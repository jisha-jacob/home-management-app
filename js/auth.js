import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { auth } from "./firebase-config.js?v=20260819-3";
import {
  loadActiveChores,
  loadHouseholdMembers,
  loadTodayCompletions,
  loadTodayMeals,
  loadTodayOverrides
} from "./firestore-data.js?v=20260819-8";

const approvedParentEmails = [
  'jisha18@gmail.com',
  'to.tonybaby@gmail.com'
];
const authScreen = document.getElementById('auth-screen');
const authMessage = document.getElementById('auth-message');
const signInButton = document.getElementById('sign-in-button');
const signOutButton = document.getElementById('sign-out-button');
const appNavigation = document.querySelector('.app-navigation');
const app = document.getElementById('app');

function showSignedOut(message) {
  authMessage.textContent = message || 'Sign in with an approved parent account to continue.';
  signInButton.disabled = false;
  authScreen.hidden = false;
  appNavigation.hidden = true;
  app.hidden = true;
}

async function showApp() {
  await loadHouseholdMembers();
  await loadActiveChores();
  await loadTodayCompletions();
  await loadTodayOverrides();
  await loadTodayMeals();
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

    if (approvedParentEmails.includes(email)) {
      await showApp();
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
  await signOut(auth);
  showSignedOut('You have signed out.');
});

async function showCurrentSession() {
  await auth.authStateReady();
  const user = auth.currentUser;
  const email = user && user.email ? user.email.toLowerCase() : '';

  if (user && approvedParentEmails.includes(email)) {
    await showApp();
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
