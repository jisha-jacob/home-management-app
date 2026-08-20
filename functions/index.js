const crypto = require('crypto');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { defineJsonSecret } = require('firebase-functions/params');
const { HttpsError, onCall, onRequest } = require('firebase-functions/v2/https');

initializeApp();

const db = getFirestore();
const googleOAuthClient = defineJsonSecret('GOOGLE_OAUTH_CLIENT');
const calendarScope = 'https://www.googleapis.com/auth/calendar.readonly';
const callbackUrl = 'https://us-central1-jisha-home-management-app.cloudfunctions.net/calendarOAuthCallback';
const appUrl = 'https://jisha-home-management-app.web.app/';
const approvedParentAccounts = ['jisha18@gmail.com', 'to.tonybaby@gmail.com'];

function requireApprovedParent(request) {
  const email = request.auth && request.auth.token && request.auth.token.email
    ? request.auth.token.email.toLowerCase() : '';

  if (!request.auth || request.auth.token.email_verified !== true || !approvedParentAccounts.includes(email)) {
    throw new HttpsError('permission-denied', 'An approved parent account is required.');
  }

  return { uid: request.auth.uid, email };
}

function oauthCredentials() {
  const configuration = googleOAuthClient.value();
  const credentials = configuration.web || configuration;

  if (!credentials.client_id || !credentials.client_secret) {
    throw new Error('The Google OAuth client secret is not configured correctly.');
  }

  return credentials;
}

function createOAuthClient() {
  const { google } = require('googleapis');
  const credentials = oauthCredentials();
  return new google.auth.OAuth2(credentials.client_id, credentials.client_secret, callbackUrl);
}

exports.startCalendarConnection = onCall({ secrets: [googleOAuthClient] }, async function (request) {
  const parent = requireApprovedParent(request);
  const state = crypto.randomBytes(32).toString('hex');

  await db.collection('privateCalendarOAuthStates').doc(state).set({
    uid: parent.uid,
    parentEmail: parent.email,
    expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000)
  });

  const authorizationUrl = createOAuthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: [calendarScope],
    state
  });

  return { authorizationUrl };
});

exports.calendarOAuthCallback = onRequest({ secrets: [googleOAuthClient] }, async function (request, response) {
  const state = typeof request.query.state === 'string' ? request.query.state : '';
  const code = typeof request.query.code === 'string' ? request.query.code : '';
  const stateReference = db.collection('privateCalendarOAuthStates').doc(state);

  try {
    if (!state || !code) throw new Error('Missing OAuth response parameters.');

    const stateDocument = await stateReference.get();
    if (!stateDocument.exists || stateDocument.data().expiresAt.toMillis() < Date.now()) {
      throw new Error('The Calendar authorization request expired.');
    }

    const stateData = stateDocument.data();
    await stateReference.delete();

    const oauthClient = createOAuthClient();
    const tokenResponse = await oauthClient.getToken(code);
    const tokens = tokenResponse.tokens;
    if (!tokens.refresh_token) throw new Error('Google did not return an offline refresh token.');

    oauthClient.setCredentials(tokens);
    const { google } = require('googleapis');
    const calendar = google.calendar({ version: 'v3', auth: oauthClient });
    const calendarList = await calendar.calendarList.list({ maxResults: 250, showHidden: false });
    const primaryCalendar = (calendarList.data.items || []).find(function (item) { return item.primary; });

    await db.collection('privateCalendarConnections').doc('household').set({
      refreshToken: tokens.refresh_token,
      calendarAccount: primaryCalendar ? primaryCalendar.id : 'Connected Google account',
      connectedBy: stateData.parentEmail,
      connectedAt: FieldValue.serverTimestamp()
    });

    response.redirect(302, appUrl + '?calendar=connected');
  } catch (error) {
    console.error('Calendar OAuth callback failed.', error);
    if (state) await stateReference.delete().catch(function () {});
    response.redirect(302, appUrl + '?calendar=error');
  }
});

exports.getCalendarStatus = onCall(async function (request) {
  const parent = requireApprovedParent(request);
  const connection = await db.collection('privateCalendarConnections').doc('household').get();

  if (!connection.exists) return { connected: false };
  return { connected: true, calendarAccount: connection.data().calendarAccount || '' };
});

exports.getCalendarEvents = onCall({ secrets: [googleOAuthClient], timeoutSeconds: 60 }, async function (request) {
  const parent = requireApprovedParent(request);
  const timeMin = new Date(request.data && request.data.timeMin);
  const timeMax = new Date(request.data && request.data.timeMax);

  if (!Number.isFinite(timeMin.getTime()) || !Number.isFinite(timeMax.getTime())
      || timeMax <= timeMin || timeMax - timeMin > 10 * 24 * 60 * 60 * 1000) {
    throw new HttpsError('invalid-argument', 'A valid Calendar date range is required.');
  }

  const connectionReference = db.collection('privateCalendarConnections').doc('household');
  const connection = await connectionReference.get();
  if (!connection.exists || !connection.data().refreshToken) {
    throw new HttpsError('failed-precondition', 'Google Calendar is not connected.');
  }

  try {
    const oauthClient = createOAuthClient();
    oauthClient.setCredentials({ refresh_token: connection.data().refreshToken });
    const { google } = require('googleapis');
    const calendarApi = google.calendar({ version: 'v3', auth: oauthClient });
    const calendarList = await calendarApi.calendarList.list({ maxResults: 250, showHidden: false });
    const readableCalendars = (calendarList.data.items || []).filter(function (calendar) {
      return calendar.accessRole !== 'freeBusyReader';
    });
    const eventLists = await Promise.all(readableCalendars.map(async function (calendar) {
      const result = await calendarApi.events.list({
        calendarId: calendar.id,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250
      });

      return (result.data.items || []).filter(function (event) {
        return event.status !== 'cancelled' && event.start && event.end;
      }).map(function (event) {
        return {
          id: calendar.id + ':' + event.id,
          summary: event.summary || 'Untitled event',
          calendarName: calendar.summaryOverride || calendar.summary || 'Google Calendar',
          start: event.start.dateTime || event.start.date + 'T00:00:00',
          end: event.end.dateTime || event.end.date + 'T00:00:00',
          allDay: Boolean(event.start.date)
        };
      });
    }));
    const events = eventLists.flat().sort(function (firstEvent, secondEvent) {
      return new Date(firstEvent.start) - new Date(secondEvent.start);
    });

    return { events };
  } catch (error) {
    console.error('Calendar refresh failed.', error);
    throw new HttpsError('unavailable', 'Google Calendar could not be refreshed. Reconnect it under More if needed.');
  }
});

exports.disconnectCalendar = onCall({ secrets: [googleOAuthClient] }, async function (request) {
  const parent = requireApprovedParent(request);
  const connectionReference = db.collection('privateCalendarConnections').doc('household');
  const connection = await connectionReference.get();

  if (connection.exists && connection.data().refreshToken) {
    const oauthClient = createOAuthClient();
    await oauthClient.revokeToken(connection.data().refreshToken).catch(function (error) {
      console.warn('Google token revocation failed; removing the local connection.', error);
    });
  }

  await connectionReference.delete();
  return { disconnected: true };
});
