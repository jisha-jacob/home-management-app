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
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import { db } from "./firebase-config.js?v=20260819-3";

let stopCompletionsSync = null;
let stopMealsSync = null;
let stopWeeklyMealsSync = null;
let stopMealFavoritesSync = null;

function formatDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return date.getFullYear() + '-' + month + '-' + day;
}

function getWeekStart(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
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
    return chores;
  },
  saveChore: async function (chore) {
    const choreId = chore.id || doc(collection(db, 'chores')).id;
    const savedChore = Object.assign({}, chore);

    delete savedChore.id;
    await setDoc(doc(db, 'chores', choreId), savedChore);
    await loadActiveChores();
    await window.homeManagementData.loadAllChores();
    return choreId;
  },
  saveTodayOverride: async function (choreId, date, assignedTo, skipped) {
    const overrideReference = doc(db, 'overrides', date + '_' + choreId);

    if (!assignedTo && !skipped) {
      await deleteDoc(overrideReference);
    } else {
      await setDoc(overrideReference, {
        choreId: choreId,
        date: date,
        assignedTo: assignedTo || null,
        skipped: Boolean(skipped)
      });
    }

    await loadTodayOverrides();
  },
  saveWeeklyMeals: async function (meals) {
    const batch = writeBatch(db);

    meals.forEach(function (meal) {
      batch.set(doc(db, 'meals', meal.date), {
        date: meal.date,
        breakfast: meal.breakfast,
        lunch: meal.lunch,
        dinner: meal.dinner
      });
    });

    await batch.commit();
  },
  saveMealFavorite: async function (name, type) {
    const favoriteReference = doc(collection(db, 'mealFavorites'));

    await setDoc(favoriteReference, {
      name: name,
      type: type,
      normalizedName: name.toLowerCase()
    });
  },
  getLastWeekMeals: async function () {
    const currentWeekStart = getWeekStart(new Date());
    const previousDates = [];
    const currentDates = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      previousDates.push(formatDateKey(new Date(
        currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() - 7 + dayOffset
      )));
      currentDates.push(formatDateKey(new Date(
        currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() + dayOffset
      )));
    }

    const documents = await Promise.all(previousDates.map(function (date) {
      return getDoc(doc(db, 'meals', date));
    }));

    if (!documents.some(function (mealDocument) { return mealDocument.exists(); })) {
      throw new Error('No meal plan was saved last week.');
    }

    return documents.map(function (mealDocument, index) {
      const data = mealDocument.exists() ? mealDocument.data() : {};

      return {
        date: currentDates[index],
        breakfast: data.breakfast || '',
        lunch: data.lunch || '',
        dinner: data.dinner || ''
      };
    });
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

    if (stopWeeklyMealsSync) {
      stopWeeklyMealsSync();
      stopWeeklyMealsSync = null;
    }

    if (stopMealFavoritesSync) {
      stopMealFavoritesSync();
      stopMealFavoritesSync = null;
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
        } else {
          window.homeManagementApp.setTodayMeals({
            date: date,
            breakfast: '',
            lunch: '',
            dinner: ''
          });
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

export async function loadCurrentWeekMeals() {
  const weekStart = getWeekStart(new Date());
  const dates = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + dayOffset);
    dates.push(formatDateKey(date));
  }

  if (stopWeeklyMealsSync) stopWeeklyMealsSync();

  await new Promise(function (resolve, reject) {
    let firstSnapshot = true;
    const weekQuery = query(
      collection(db, 'meals'),
      where('date', '>=', dates[0]),
      where('date', '<=', dates[6])
    );

    stopWeeklyMealsSync = onSnapshot(
      weekQuery,
      function (snapshot) {
        const mealsByDate = {};

        snapshot.forEach(function (mealDocument) {
          mealsByDate[mealDocument.id] = mealDocument.data();
        });

        const meals = dates.map(function (date) {
          const data = mealsByDate[date] || {};

          return {
            date: date,
            breakfast: data.breakfast || '',
            lunch: data.lunch || '',
            dinner: data.dinner || ''
          };
        });

        window.homeManagementApp.setWeeklyMeals(meals);
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

export async function loadMealFavorites() {
  if (stopMealFavoritesSync) stopMealFavoritesSync();

  await new Promise(function (resolve, reject) {
    let firstSnapshot = true;

    stopMealFavoritesSync = onSnapshot(
      collection(db, 'mealFavorites'),
      function (snapshot) {
        const favorites = [];

        snapshot.forEach(function (favoriteDocument) {
          favorites.push(Object.assign({ id: favoriteDocument.id }, favoriteDocument.data()));
        });

        window.homeManagementApp.setMealFavorites(favorites);
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
