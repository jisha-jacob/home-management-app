import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import { db } from "./firebase-config.js?v=20260819-3";

let stopCompletionsSync = null;
let stopMealsSync = null;

function formatDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return date.getFullYear() + '-' + month + '-' + day;
}

async function hashPin(pin) {
  const bytes = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest)).map(function (value) {
    return value.toString(16).padStart(2, '0');
  }).join('');
}

window.homeManagementData = {
  loadAllChores: async function () {
    const snapshot = await getDocs(collection(db, 'chores'));
    const chores = [];

    snapshot.forEach(function (choreDocument) {
      chores.push(Object.assign({ id: choreDocument.id }, choreDocument.data()));
    });

    window.homeManagementApp.setMasterChores(chores);
  },
  saveChoreCompletion: async function (choreId, date, completed, completedBy) {
    const completionReference = doc(db, 'completions', date + '_' + choreId);

    if (!completed) {
      await deleteDoc(completionReference);
      return;
    }

    await setDoc(completionReference, {
      choreId: choreId,
      date: date,
      completed: true,
      completedBy: completedBy
    });
  },
  stopSync: function () {
    if (stopCompletionsSync) {
      stopCompletionsSync();
      stopCompletionsSync = null;
    }

    if (stopMealsSync) {
      stopMealsSync();
      stopMealsSync = null;
    }
  }
};

export async function loadHouseholdMembers() {
  const snapshot = await getDocs(query(collection(db, 'members'), orderBy('displayOrder')));
  const members = {};

  snapshot.forEach(function (memberDocument) {
    const member = memberDocument.data();

    if (member.active) {
      members[memberDocument.id] = member;
    }
  });

  window.homeManagementApp.setMembers(members);
}

export async function loadParentModeSettings() {
  const settingsDocument = await getDoc(doc(db, 'settings', 'parentMode'));
  const isConfigured = settingsDocument.exists() && Boolean(settingsDocument.data().pinHash);

  window.homeManagementApp.setParentPinConfigured(isConfigured);
}

export async function saveParentPin(pin) {
  await setDoc(doc(db, 'settings', 'parentMode'), {
    pinHash: await hashPin(pin)
  }, { merge: true });
}

export async function verifyParentPin(pin) {
  const settingsDocument = await getDoc(doc(db, 'settings', 'parentMode'));

  if (!settingsDocument.exists() || !settingsDocument.data().pinHash) return false;

  return settingsDocument.data().pinHash === await hashPin(pin);
}

export async function loadActiveChores() {
  const snapshot = await getDocs(query(collection(db, 'chores'), where('active', '==', true)));
  const chores = [];

  snapshot.forEach(function (choreDocument) {
    chores.push(Object.assign({ id: choreDocument.id }, choreDocument.data()));
  });

  window.homeManagementApp.setChores(chores);
}

export async function loadTodayCompletions() {
  const date = formatDateKey(new Date());

  if (stopCompletionsSync) stopCompletionsSync();

  await new Promise(function (resolve, reject) {
    var firstSnapshot = true;

    stopCompletionsSync = onSnapshot(
      query(collection(db, 'completions'), where('date', '==', date)),
      function (snapshot) {
        const completions = [];

        snapshot.forEach(function (completionDocument) {
          completions.push(completionDocument.data());
        });

        window.homeManagementApp.setCompletions(completions);
        if (firstSnapshot) {
          firstSnapshot = false;
          resolve();
        }
      },
      function (error) {
        if (firstSnapshot) reject(error);
      }
    );
  });
}

export async function loadTodayOverrides() {
  const date = formatDateKey(new Date());
  const snapshot = await getDocs(query(collection(db, 'overrides'), where('date', '==', date)));
  const overrides = [];

  snapshot.forEach(function (overrideDocument) {
    overrides.push(overrideDocument.data());
  });

  window.homeManagementApp.setOverrides(overrides);
}

export async function loadTodayMeals() {
  const date = formatDateKey(new Date());

  if (stopMealsSync) stopMealsSync();

  await new Promise(function (resolve, reject) {
    var firstSnapshot = true;

    stopMealsSync = onSnapshot(
      doc(db, 'meals', date),
      function (mealDocument) {
        if (mealDocument.exists()) {
          window.homeManagementApp.setTodayMeals(mealDocument.data());
        }

        if (firstSnapshot) {
          firstSnapshot = false;
          resolve();
        }
      },
      function (error) {
        if (firstSnapshot) reject(error);
      }
    );
  });
}
