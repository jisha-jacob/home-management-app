import {
  GoogleAuthProvider,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { auth } from "./firebase-config.js?v=20260819-3";
import {
  loadActiveChores,
  loadCurrentWeekMeals,
  loadCurrentFamilyReset,
  loadHouseholdMembers,
  loadMealFavorites,
  loadParentModeSettings,
  loadTodayCompletions,
  loadTodayMeals,
  loadTodayOverrides,
  saveParentPin,
  verifyParentPin
} from "./firestore-data.js?v=20260820-6";

const approvedParentAccounts = {
  'jisha18@gmail.com': 'Mom',
  'to.tonybaby@gmail.com': 'Dad'
};
const authScreen = document.getElementById('auth-screen');
const authMessage = document.getElementById('auth-message');
const signInButton = document.getElementById('sign-in-button');
const signOutButton = document.getElementById('sign-out-button');
const parentPinForm = document.getElementById('parent-pin-form');
const parentPinInput = document.getElementById('parent-pin');
const parentPinConfirmInput = document.getElementById('parent-pin-confirm');
const parentPinStatus = document.getElementById('parent-pin-status');
const saveParentPinButton = document.getElementById('save-parent-pin-button');
const parentPinUnlockForm = document.getElementById('parent-pin-unlock-form');
const parentPinUnlockInput = document.getElementById('parent-pin-unlock');
const unlockParentModeButton = document.getElementById('unlock-parent-mode-button');
const lockParentModeButton = document.getElementById('lock-parent-mode-button');
const changeParentPinForm = document.getElementById('change-parent-pin-form');
const newParentPinInput = document.getElementById('new-parent-pin');
const newParentPinConfirmInput = document.getElementById('new-parent-pin-confirm');
const changeParentPinButton = document.getElementById('change-parent-pin-button');
const changeParentPinStatus = document.getElementById('change-parent-pin-status');
const appNavigation = document.querySelector('.app-navigation');
const app = document.getElementById('app');
const connectCalendarButton = document.getElementById('connect-calendar-button');
const refreshCalendarButton = document.getElementById('refresh-calendar-button');
let calendarAccessToken = null;

async function fetchGoogleJson(url) {
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer ' + calendarAccessToken }
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error && body.error.message ? body.error.message : 'Google Calendar request failed.');
  }

  return body;
}

function calendarDateValue(value) {
  if (value.dateTime) return value.dateTime;

  const parts = value.date.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).toISOString();
}

async function loadGoogleCalendar() {
  if (!calendarAccessToken) return;

  refreshCalendarButton.disabled = true;
  window.homeManagementApp.setCalendarConnectionState(true, 'Refreshing Google Calendar...');

  try {
    const calendarList = await fetchGoogleJson(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250&showHidden=false'
    );
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + 8);
    const readableCalendars = (calendarList.items || []).filter(function (calendar) {
      return calendar.accessRole !== 'freeBusyReader';
    });
    const eventLists = await Promise.all(readableCalendars.map(async function (calendar) {
      const parameters = new URLSearchParams({
        timeMin: dayStart.toISOString(),
        timeMax: rangeEnd.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100'
      });
      const data = await fetchGoogleJson(
        'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(calendar.id) + '/events?' + parameters
      );

      return (data.items || []).filter(function (event) {
        return event.status !== 'cancelled' && event.start && event.end;
      }).map(function (event) {
        return {
          id: calendar.id + ':' + event.id,
          summary: event.summary || 'Untitled event',
          calendarName: calendar.summaryOverride || calendar.summary || 'Google Calendar',
          start: calendarDateValue(event.start),
          end: calendarDateValue(event.end),
          allDay: Boolean(event.start.date)
        };
      });
    }));
    const events = eventLists.flat().sort(function (firstEvent, secondEvent) {
      return new Date(firstEvent.start) - new Date(secondEvent.start);
    });

    window.homeManagementApp.setCalendarEvents(events);
    window.homeManagementApp.setCalendarConnectionState(true, 'Connected · ' + events.length + ' events loaded');
  } catch (error) {
    calendarAccessToken = null;
    window.homeManagementApp.setCalendarConnectionState(false, 'Calendar could not be refreshed: ' + error.message);
  } finally {
    refreshCalendarButton.disabled = false;
  }
}

function showSignedOut(message) {
  authMessage.textContent = message || 'Sign in with an approved parent account to continue.';
  signInButton.disabled = false;
  authScreen.hidden = false;
  appNavigation.hidden = true;
  app.hidden = true;
}

function isApprovedParent(email) {
  return Object.prototype.hasOwnProperty.call(approvedParentAccounts, email);
}

async function showApp(user) {
  const email = user.email.toLowerCase();

  window.homeManagementApp.setSignedInParent(approvedParentAccounts[email], email);
  await loadHouseholdMembers();
  await loadActiveChores();
  await loadTodayCompletions();
  await loadTodayOverrides();
  await loadTodayMeals();
  await loadCurrentWeekMeals();
  await loadMealFavorites();
  await loadCurrentFamilyReset();
  await loadParentModeSettings();
  window.homeManagementApp.setCalendarConnectionState(false, 'Unlock Parent Mode to connect Google Calendar.');
  authScreen.hidden = true;
  appNavigation.hidden = false;
  app.hidden = false;
}

signInButton.addEventListener('click', async function () {
  signInButton.disabled = true;
  authMessage.textContent = 'Opening Google sign-in…';

  try {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    const email = result.user.email ? result.user.email.toLowerCase() : '';

    if (isApprovedParent(email)) {
      await showApp(result.user);
      return;
    }

    await signOut(auth);
    showSignedOut('The signed-in account (' + (email || 'no email available') + ') is not approved for this household.');
  } catch (error) {
    showSignedOut('Sign-in failed: ' + error.message);
  }
});

signOutButton.addEventListener('click', async function () {
  window.homeManagementData.stopSync();
  calendarAccessToken = null;
  await signOut(auth);
  showSignedOut('You have signed out.');
});

connectCalendarButton.addEventListener('click', async function () {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  provider.setCustomParameters({ prompt: 'consent' });
  connectCalendarButton.disabled = true;
  window.homeManagementApp.setCalendarConnectionState(false, 'Opening Google Calendar authorization...');

  try {
    const result = await reauthenticateWithPopup(auth.currentUser, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential || !credential.accessToken) throw new Error('Google did not return a Calendar access token.');
    calendarAccessToken = credential.accessToken;
    await loadGoogleCalendar();
  } catch (error) {
    window.homeManagementApp.setCalendarConnectionState(false, 'Calendar connection failed: ' + error.message);
  } finally {
    connectCalendarButton.disabled = false;
  }
});

refreshCalendarButton.addEventListener('click', loadGoogleCalendar);

parentPinForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  const pin = parentPinInput.value;

  if (!/^\d{4}$/.test(pin)) {
    parentPinStatus.textContent = 'Enter exactly four digits.';
    return;
  }

  if (pin !== parentPinConfirmInput.value) {
    parentPinStatus.textContent = 'The PIN entries do not match.';
    return;
  }

  saveParentPinButton.disabled = true;
  parentPinStatus.textContent = 'Saving PINâ€¦';

  try {
    await saveParentPin(pin);
    parentPinForm.reset();
    window.homeManagementApp.setParentPinConfigured(true);
  } catch (error) {
    parentPinStatus.textContent = 'Could not save the PIN: ' + error.message;
    saveParentPinButton.disabled = false;
  }
});

parentPinUnlockForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  const pin = parentPinUnlockInput.value;

  if (!/^\d{4}$/.test(pin)) {
    parentPinStatus.textContent = 'Enter exactly four digits.';
    return;
  }

  unlockParentModeButton.disabled = true;
  parentPinStatus.textContent = 'Checking PINâ€¦';

  try {
    if (await verifyParentPin(pin)) {
      parentPinUnlockForm.reset();
      window.homeManagementApp.setParentModeActive(true);
      return;
    }

    parentPinStatus.textContent = 'Incorrect PIN. Try again.';
  } catch (error) {
    parentPinStatus.textContent = 'Could not check the PIN: ' + error.message;
  }

  unlockParentModeButton.disabled = false;
});

lockParentModeButton.addEventListener('click', function () {
  unlockParentModeButton.disabled = false;
  window.homeManagementApp.setParentModeActive(false);
});

changeParentPinForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  const pin = newParentPinInput.value;

  if (!/^\d{4}$/.test(pin)) {
    changeParentPinStatus.textContent = 'Enter exactly four digits.';
    return;
  }

  if (pin !== newParentPinConfirmInput.value) {
    changeParentPinStatus.textContent = 'The PIN entries do not match.';
    return;
  }

  changeParentPinButton.disabled = true;
  changeParentPinStatus.textContent = 'Changing PINâ€¦';

  try {
    await saveParentPin(pin);
    changeParentPinForm.reset();
    changeParentPinButton.disabled = false;
    unlockParentModeButton.disabled = false;
    window.homeManagementApp.setParentModeActive(false);
    parentPinStatus.textContent = 'PIN changed. Parent Mode locked.';
  } catch (error) {
    changeParentPinStatus.textContent = 'Could not change the PIN: ' + error.message;
    changeParentPinButton.disabled = false;
  }
});

async function showCurrentSession() {
  await auth.authStateReady();
  const user = auth.currentUser;
  const email = user && user.email ? user.email.toLowerCase() : '';

  if (user && isApprovedParent(email)) {
    await showApp(user);
    return;
  }

  if (user) {
    await signOut(auth);
    showSignedOut('This Google account is not approved for this household.');
    return;
  }

  showSignedOut();
}

showCurrentSession().catch(function (error) {
  showSignedOut('Sign-in check failed: ' + error.message);
});
