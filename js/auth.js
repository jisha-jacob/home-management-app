import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { auth } from "./firebase-config.js?v=20260819-3";
import {
  loadActiveChores,
  loadHouseholdMembers,
  loadParentModeSettings,
  loadTodayCompletions,
  loadTodayMeals,
  loadTodayOverrides,
  saveParentPin,
  verifyParentPin
} from "./firestore-data.js?v=20260819-10";

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
  await loadParentModeSettings();
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
  await signOut(auth);
  showSignedOut('You have signed out.');
});

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
