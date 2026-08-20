document.addEventListener('DOMContentLoaded', function () {
  var currentDate = new Date();
  var completions = [];
  var selectedProfile = 'family';
  var masterChoresLoaded = false;
  var parentModeActive = false;
  var weeklyMeals = [];
  var mealFavorites = [];
  var activeMealInput = null;

  function formatDateKey(date) {
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');

    return date.getFullYear() + '-' + month + '-' + day;
  }

  function getCalendarDayNumber(date) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  }

  function parseLocalDate(dateString) {
    var parts = dateString.split('-');

    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function isChoreDueOnDate(chore, date) {
    if (!chore.active) return false;

    if (chore.frequency === 'daily') return true;

    if (chore.frequency === 'weekdays') {
      return date.getDay() >= 1 && date.getDay() <= 5;
    }

    if (chore.frequency === 'weekends') {
      return date.getDay() === 0 || date.getDay() === 6;
    }

    if (chore.frequency === 'weekly') {
      return date.getDay() === chore.dayOfWeek;
    }

    if (chore.frequency === 'every-2-weeks') {
      if (date.getDay() !== chore.dayOfWeek || !chore.recurrenceStartDate) return false;

      var recurrenceStart = parseLocalDate(chore.recurrenceStartDate);
      var daysSinceStart = getCalendarDayNumber(date) - getCalendarDayNumber(recurrenceStart);
      var weeksSinceStart = Math.floor(daysSinceStart / 7);

      return daysSinceStart >= 0 && weeksSinceStart % 2 === 0;
    }

    if (chore.frequency === 'monthly') {
      return date.getDate() === chore.dayOfMonth;
    }

    return false;
  }

  function findNextDueDate(chore, startDate) {
    var candidate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    for (var daysAhead = 0; daysAhead <= 370; daysAhead += 1) {
      if (isChoreDueOnDate(chore, candidate)) return candidate;
      candidate.setDate(candidate.getDate() + 1);
    }

    return null;
  }

  function formatNextDueDate(date) {
    if (!date) return 'No upcoming date';

    var daysAhead = getCalendarDayNumber(date) - getCalendarDayNumber(currentDate);

    if (daysAhead === 0) return 'Today';
    if (daysAhead === 1) return 'Tomorrow';
    if (daysAhead <= 7) {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    }

    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }

  function formatFrequency(frequency) {
    var labels = {
      daily: 'Daily',
      weekdays: 'Weekdays',
      weekends: 'Weekends',
      weekly: 'Weekly',
      'every-2-weeks': 'Every 2 weeks',
      monthly: 'Monthly'
    };

    return labels[frequency] || frequency;
  }

  function renderWeeklyMeals() {
    var grid = document.getElementById('weekly-meal-grid');
    var range = document.getElementById('meal-week-range');
    var mealTypes = ['breakfast', 'lunch', 'dinner'];

    if (!grid || weeklyMeals.length === 0) return;

    activeMealInput = null;

    var firstDate = parseLocalDate(weeklyMeals[0].date);
    var lastDate = parseLocalDate(weeklyMeals[weeklyMeals.length - 1].date);
    range.textContent = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(firstDate)
      + ' – ' + new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(lastDate);
    grid.textContent = '';

    weeklyMeals.forEach(function (meal) {
      var date = parseLocalDate(meal.date);
      var card = document.createElement('article');
      var heading = document.createElement('h2');
      var dateLabel = document.createElement('time');
      var fields = document.createElement('div');

      card.className = 'dashboard-card day-card meal-day-card';
      if (meal.date === formatDateKey(currentDate)) card.classList.add('is-today');
      heading.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
      dateLabel.dateTime = meal.date;
      dateLabel.textContent = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
      fields.className = 'meal-day-fields';

      mealTypes.forEach(function (mealType) {
        var label = document.createElement('label');
        var input = document.createElement('input');
        label.textContent = mealType.charAt(0).toUpperCase() + mealType.slice(1);
        input.type = 'text';
        input.maxLength = 120;
        input.value = meal[mealType];
        input.readOnly = !parentModeActive;
        input.setAttribute('data-meal-date', meal.date);
        input.setAttribute('data-meal-type', mealType);
        label.appendChild(input);
        fields.appendChild(label);
      });

      card.appendChild(heading);
      card.appendChild(dateLabel);
      card.appendChild(fields);
      grid.appendChild(card);
    });
  }

  function isCompletedOnDate(choreId, date) {
    var dateKey = formatDateKey(date);

    return completions.some(function (completion) {
      return completion.choreId === choreId && completion.date === dateKey && completion.completed;
    });
  }

  function getOverrideForDate(choreId, date, overrides) {
    var dateKey = formatDateKey(date);

    return overrides.find(function (override) {
      return override.choreId === choreId && override.date === dateKey;
    });
  }

  function getAssignedOwner(chore, date, overrides) {
    var override = getOverrideForDate(chore.id, date, overrides);

    return override && override.assignedTo ? override.assignedTo : chore.defaultOwner;
  }

  async function setChoreCompletion(choreId, completed) {
    var dateKey = formatDateKey(currentDate);
    var previousCompletions = completions.slice();

    completions = completions.filter(function (completion) {
      return completion.choreId !== choreId || completion.date !== dateKey;
    });

    if (completed) {
      completions.push({
        choreId: choreId,
        date: dateKey,
        completed: true
      });
    }

    renderTodayChores();

    try {
      await window.homeManagementData.saveChoreCompletion(choreId, dateKey, completed, selectedProfile);
    } catch (error) {
      completions = previousCompletions;
      renderTodayChores();
      window.alert('The chore could not be saved. Please try again.');
    }
  }

  function createChoreItem(chore, ownerId, members) {
    var owner = members[ownerId] || {
      name: ownerId === 'family' ? 'Family' : 'Unassigned',
      colorClass: 'profile-family'
    };
    var item = document.createElement('li');
    var indicator = document.createElement('span');
    var label = document.createElement('label');
    var checkbox = document.createElement('input');
    var details = document.createElement('span');
    var ownerName = document.createElement('span');
    var choreName = document.createElement('span');

    item.className = 'chore-item';
    indicator.className = 'person-indicator ' + owner.colorClass;
    indicator.setAttribute('aria-hidden', 'true');
    label.className = 'chore-label';
    checkbox.className = 'chore-checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = isCompletedOnDate(chore.id, currentDate);
    checkbox.setAttribute('data-chore-id', chore.id);
    checkbox.addEventListener('change', function () {
      setChoreCompletion(chore.id, checkbox.checked);
    });
    details.className = 'chore-details';
    ownerName.className = 'chore-owner';
    ownerName.textContent = owner.name;
    choreName.className = 'chore-name';
    choreName.textContent = chore.name;

    details.appendChild(ownerName);
    details.appendChild(choreName);
    label.appendChild(checkbox);
    label.appendChild(details);
    item.appendChild(indicator);
    item.appendChild(label);

    return item;
  }

  function renderChoreList(listId, chores, members, overrides) {
    var list = document.getElementById(listId);

    if (!list) return;

    list.textContent = '';
    chores.forEach(function (chore) {
      var ownerId = getAssignedOwner(chore, currentDate, overrides);

      list.appendChild(createChoreItem(chore, ownerId, members));
    });
  }

  function renderTodayChores() {
    var sampleData = window.homeManagementSampleData;
    var homeCount = document.getElementById('home-chore-count');
    var todayCount = document.getElementById('today-chore-count');

    if (!sampleData || !homeCount || !todayCount) return;

    var dueChores = sampleData.chores.filter(function (chore) {
      return isChoreDueOnDate(chore, currentDate);
    }).filter(function (chore) {
      var override = getOverrideForDate(chore.id, currentDate, sampleData.overrides);

      return !override || !override.skipped;
    });
    var profileChores = dueChores.filter(function (chore) {
      var ownerId = getAssignedOwner(chore, currentDate, sampleData.overrides);

      return selectedProfile === 'family' || ownerId === selectedProfile;
    });
    var openProfileChores = profileChores.filter(function (chore) {
      return !isCompletedOnDate(chore.id, currentDate);
    });
    var completedCount = profileChores.length - openProfileChores.length;

    renderChoreList('home-chore-list', profileChores, sampleData.members, sampleData.overrides);
    renderChoreList('today-chore-list', profileChores, sampleData.members, sampleData.overrides);
    homeCount.textContent = completedCount + ' of ' + profileChores.length + ' done';
    todayCount.textContent = openProfileChores.length + ' chores due';
  }

  function renderChoresByRoom() {
    var sampleData = window.homeManagementSampleData;
    var roomGrid = document.getElementById('room-grid');
    var choresByRoom = {};

    sampleData.chores.forEach(function (chore) {
      if (!choresByRoom[chore.room]) choresByRoom[chore.room] = [];
      choresByRoom[chore.room].push(chore);
    });

    roomGrid.textContent = '';
    Object.keys(choresByRoom).sort().forEach(function (room) {
      var card = document.createElement('article');
      var heading = document.createElement('h3');
      var list = document.createElement('ul');

      card.className = 'dashboard-card room-card';
      heading.textContent = room;
      list.className = 'room-task-list';

      choresByRoom[room].sort(function (firstChore, secondChore) {
        return firstChore.name.localeCompare(secondChore.name);
      }).forEach(function (chore) {
        var item = document.createElement('li');
        var choreName = document.createElement('span');
        var ownerName = document.createElement('span');
        var owner = sampleData.members[chore.defaultOwner];
        var override = getOverrideForDate(chore.id, currentDate, sampleData.overrides);
        var dueToday = isChoreDueOnDate(chore, currentDate);
        var nextStartDate = currentDate;
        var timingParts = [owner ? owner.name : 'Unassigned'];

        if (override && override.skipped && dueToday) {
          nextStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
          timingParts.push('Skipped today');
        } else if (override && override.assignedTo && dueToday) {
          var temporaryOwner = sampleData.members[override.assignedTo];
          timingParts[0] += ' normally';
          timingParts.push((temporaryOwner ? temporaryOwner.name : 'Unassigned') + ' today');
        }

        timingParts.push(formatNextDueDate(findNextDueDate(chore, nextStartDate)));
        timingParts.push(formatFrequency(chore.frequency));

        choreName.textContent = chore.name;
        ownerName.textContent = timingParts.join(' · ');
        item.appendChild(choreName);
        item.appendChild(ownerName);
        list.appendChild(item);
      });

      card.appendChild(heading);
      card.appendChild(list);
      roomGrid.appendChild(card);
    });
  }

  renderTodayChores();

  function applyFamilyResetFlags() {
    var sampleData = window.homeManagementSampleData;
    var resetChoreRows = document.querySelectorAll('[data-family-reset-chore-id]');

    if (!sampleData) return;

    resetChoreRows.forEach(function (row) {
      var choreId = row.getAttribute('data-family-reset-chore-id');
      var chore = sampleData.chores.find(function (item) {
        return item.id === choreId;
      });

      row.hidden = !chore || !chore.familyReset;
    });
  }

  applyFamilyResetFlags();

  var profileButtons = document.querySelectorAll('[data-profile-target]');

  profileButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      selectedProfile = button.getAttribute('data-profile-target');

      profileButtons.forEach(function (profileButton) {
        profileButton.setAttribute('aria-pressed', profileButton === button ? 'true' : 'false');
      });

      renderTodayChores();
    });
  });

  var dateElement = document.getElementById('today-date');

  if (dateElement) {
    var formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).format(currentDate);

    dateElement.dateTime = currentDate.toISOString().slice(0, 10);
    dateElement.textContent = formattedDate.toUpperCase();
  }

  var navigationButtons = document.querySelectorAll('[data-screen-target]');
  var screens = document.querySelectorAll('[data-screen]');

  navigationButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var target = button.getAttribute('data-screen-target');

      screens.forEach(function (screen) {
        screen.hidden = screen.getAttribute('data-screen') !== target;
      });

      navigationButtons.forEach(function (navigationButton) {
        if (navigationButton === button) {
          navigationButton.setAttribute('aria-current', 'page');
        } else {
          navigationButton.removeAttribute('aria-current');
        }
      });
    });
  });

  var choreViewButtons = document.querySelectorAll('[data-chore-view-target]');
  var choreViews = document.querySelectorAll('[data-chore-view]');

  choreViewButtons.forEach(function (button) {
    button.addEventListener('click', async function () {
      var target = button.getAttribute('data-chore-view-target');

      choreViews.forEach(function (view) {
        view.hidden = view.getAttribute('data-chore-view') !== target;
      });

      choreViewButtons.forEach(function (viewButton) {
        viewButton.setAttribute('aria-pressed', viewButton === button ? 'true' : 'false');
      });

      if (target === 'all' && !masterChoresLoaded) {
        document.getElementById('master-task-count').textContent = 'Loading tasksâ€¦';

        try {
          await window.homeManagementData.loadAllChores();
          masterChoresLoaded = true;
        } catch (error) {
          document.getElementById('master-task-count').textContent = 'Tasks could not be loaded';
        }
      }
    });
  });

  var choreRooms = [
    'Kitchen', 'Dining Area', 'Living Room / Family Room', 'Entryway', 'Stairs / Hallways',
    "Kids' Bedroom", 'Parents / Toddler Bedroom', 'Office', 'Basement Hangout Room',
    "Kids' Bathroom", 'Primary Bathroom', 'Powder Room 1', 'Powder Room 2',
    'Laundry Area', 'Whole House', 'Household Admin'
  ];
  var choreEditor = document.getElementById('chore-editor');
  var choreEditorForm = document.getElementById('chore-editor-form');
  var choreFrequency = document.getElementById('chore-frequency');
  var choreRoom = document.getElementById('chore-room');
  var choreOwner = document.getElementById('chore-owner');
  var choreTodayOwner = document.getElementById('chore-today-owner');

  function addSelectOption(select, value, label) {
    var option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  choreRooms.forEach(function (room) {
    addSelectOption(choreRoom, room, room);
  });

  function populateOwnerOptions() {
    var members = window.homeManagementSampleData.members;
    var ownerIds = Object.keys(members).sort(function (firstId, secondId) {
      return members[firstId].displayOrder - members[secondId].displayOrder;
    });

    choreOwner.textContent = '';
    choreTodayOwner.textContent = '';
    addSelectOption(choreOwner, 'unassigned', 'Unassigned');
    addSelectOption(choreOwner, 'family', 'Family');
    addSelectOption(choreTodayOwner, '', 'Use normal owner');
    addSelectOption(choreTodayOwner, 'unassigned', 'Unassigned');
    addSelectOption(choreTodayOwner, 'family', 'Family');
    ownerIds.forEach(function (ownerId) {
      addSelectOption(choreOwner, ownerId, members[ownerId].name);
      addSelectOption(choreTodayOwner, ownerId, members[ownerId].name);
    });
  }

  populateOwnerOptions();

  function updateRecurrenceFields() {
    var frequency = choreFrequency.value;
    document.getElementById('chore-weekday-field').hidden = frequency !== 'weekly' && frequency !== 'every-2-weeks';
    document.getElementById('chore-monthday-field').hidden = frequency !== 'monthly';
    document.getElementById('chore-start-date-field').hidden = frequency !== 'every-2-weeks';
  }

  choreFrequency.addEventListener('change', updateRecurrenceFields);

  function closeChoreEditor() {
    choreEditor.hidden = true;
    choreEditorForm.reset();
    document.getElementById('chore-editor-status').textContent = '';
  }

  function openChoreEditor(chore) {
    if (!parentModeActive) return;

    choreEditorForm.reset();
    document.getElementById('chore-editor-title').textContent = chore ? 'Edit chore' : 'Add chore';
    document.getElementById('chore-id').value = chore ? chore.id : '';
    document.getElementById('chore-name').value = chore ? chore.name : '';
    choreRoom.value = chore ? chore.room : choreRooms[0];
    choreOwner.value = chore ? chore.defaultOwner : 'unassigned';
    choreFrequency.value = chore ? chore.frequency : 'daily';
    document.getElementById('chore-day-of-week').value = chore && chore.dayOfWeek !== null ? String(chore.dayOfWeek) : '1';
    document.getElementById('chore-day-of-month').value = chore && chore.dayOfMonth ? chore.dayOfMonth : 1;
    document.getElementById('chore-start-date').value = chore && chore.recurrenceStartDate ? chore.recurrenceStartDate : formatDateKey(currentDate);
    document.getElementById('chore-family-reset').checked = Boolean(chore && chore.familyReset);
    document.getElementById('chore-active').checked = chore ? Boolean(chore.active) : true;
    document.getElementById('chore-notes').value = chore && chore.notes ? chore.notes : '';

    var override = chore ? getOverrideForDate(chore.id, currentDate, window.homeManagementSampleData.overrides) : null;
    document.getElementById('today-override-fields').hidden = !chore || !isChoreDueOnDate(chore, currentDate);
    choreTodayOwner.value = override && override.assignedTo ? override.assignedTo : '';
    document.getElementById('chore-skip-today').checked = Boolean(override && override.skipped);
    choreTodayOwner.disabled = Boolean(override && override.skipped);
    document.getElementById('chore-editor-status').textContent = '';
    updateRecurrenceFields();
    choreEditor.hidden = false;
    document.getElementById('chore-name').focus();
  }

  document.getElementById('add-chore-button').addEventListener('click', function () {
    openChoreEditor(null);
  });
  document.getElementById('cancel-chore-button').addEventListener('click', closeChoreEditor);
  document.getElementById('chore-skip-today').addEventListener('change', function (event) {
    choreTodayOwner.disabled = event.target.checked;
    if (event.target.checked) choreTodayOwner.value = '';
  });

  choreEditorForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!parentModeActive) return;

    var saveButton = document.getElementById('save-chore-button');
    var status = document.getElementById('chore-editor-status');
    var choreId = document.getElementById('chore-id').value;
    var frequency = choreFrequency.value;
    var chore = {
      id: choreId || null,
      name: document.getElementById('chore-name').value.trim(),
      room: choreRoom.value,
      defaultOwner: choreOwner.value,
      frequency: frequency,
      dayOfWeek: frequency === 'weekly' || frequency === 'every-2-weeks'
        ? Number(document.getElementById('chore-day-of-week').value) : null,
      dayOfMonth: frequency === 'monthly' ? Number(document.getElementById('chore-day-of-month').value) : null,
      active: document.getElementById('chore-active').checked,
      familyReset: document.getElementById('chore-family-reset').checked,
      notes: document.getElementById('chore-notes').value.trim() || null
    };

    if (!chore.name) {
      status.textContent = 'Enter a chore name.';
      return;
    }

    if (frequency === 'every-2-weeks') {
      chore.recurrenceStartDate = document.getElementById('chore-start-date').value;
      if (!chore.recurrenceStartDate) {
        status.textContent = 'Choose a recurrence start date.';
        return;
      }
    }

    saveButton.disabled = true;
    status.textContent = 'Saving chore...';

    try {
      var savedId = await window.homeManagementData.saveChore(chore);
      if (choreId) {
        await window.homeManagementData.saveTodayOverride(
          savedId,
          formatDateKey(currentDate),
          choreTodayOwner.value,
          document.getElementById('chore-skip-today').checked
        );
      }
      closeChoreEditor();
    } catch (error) {
      status.textContent = 'Could not save the chore: ' + error.message;
    } finally {
      saveButton.disabled = false;
    }
  });

  var weeklyMealForm = document.getElementById('weekly-meal-form');

  weeklyMealForm.addEventListener('focusin', function (event) {
    if (event.target.matches('[data-meal-date][data-meal-type]')) activeMealInput = event.target;
  });

  weeklyMealForm.addEventListener('input', function () {
    if (!parentModeActive) return;
    document.getElementById('meal-save-status').textContent = 'Unsaved changes';
  });

  weeklyMealForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!parentModeActive) return;

    var saveButton = document.getElementById('save-weekly-meals-button');
    var status = document.getElementById('meal-save-status');
    var meals = weeklyMeals.map(function (meal) {
      var savedMeal = { date: meal.date };

      ['breakfast', 'lunch', 'dinner'].forEach(function (mealType) {
        var input = weeklyMealForm.querySelector(
          '[data-meal-date="' + meal.date + '"][data-meal-type="' + mealType + '"]'
        );
        savedMeal[mealType] = input.value.trim();
      });

      return savedMeal;
    });

    saveButton.disabled = true;
    status.textContent = 'Saving week...';

    try {
      await window.homeManagementData.saveWeeklyMeals(meals);
      status.textContent = 'Week saved.';
    } catch (error) {
      status.textContent = 'Could not save the week: ' + error.message;
    } finally {
      saveButton.disabled = false;
    }
  });

  function renderMealFavorites() {
    var container = document.getElementById('meal-favorites-groups');
    var mealTypes = ['breakfast', 'lunch', 'dinner'];

    container.textContent = '';
    mealTypes.forEach(function (mealType) {
      var group = document.createElement('section');
      var heading = document.createElement('h3');
      var list = document.createElement('div');
      var matchingFavorites = mealFavorites.filter(function (favorite) {
        return favorite.type === mealType;
      }).sort(function (firstFavorite, secondFavorite) {
        return firstFavorite.name.localeCompare(secondFavorite.name);
      });

      heading.textContent = mealType.charAt(0).toUpperCase() + mealType.slice(1);
      list.className = 'favorite-meal-list';
      if (matchingFavorites.length === 0) {
        var empty = document.createElement('span');
        empty.className = 'favorite-meal-empty';
        empty.textContent = 'No favorites yet';
        list.appendChild(empty);
      }

      matchingFavorites.forEach(function (favorite) {
        var button = document.createElement('button');
        button.className = 'favorite-meal-button';
        button.type = 'button';
        button.textContent = favorite.name;
        button.disabled = !parentModeActive;
        button.addEventListener('click', function () {
          if (!activeMealInput) {
            document.getElementById('favorite-meal-status').textContent = 'Choose a meal field first.';
            return;
          }

          activeMealInput.value = favorite.name;
          activeMealInput.dispatchEvent(new Event('input', { bubbles: true }));
          document.getElementById('favorite-meal-status').textContent = favorite.name + ' added to the planner.';
          activeMealInput.focus();
        });
        list.appendChild(button);
      });

      group.className = 'favorite-meal-group';
      group.appendChild(heading);
      group.appendChild(list);
      container.appendChild(group);
    });

    document.getElementById('meal-favorites-count').textContent = mealFavorites.length + ' favorites';
  }

  document.getElementById('favorite-meal-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!parentModeActive) return;

    var nameInput = document.getElementById('favorite-meal-name');
    var typeInput = document.getElementById('favorite-meal-type');
    var status = document.getElementById('favorite-meal-status');
    var saveButton = document.getElementById('save-favorite-meal-button');
    var name = nameInput.value.trim();
    var duplicate = mealFavorites.some(function (favorite) {
      return favorite.type === typeInput.value && favorite.name.toLowerCase() === name.toLowerCase();
    });

    if (!name) return;
    if (duplicate) {
      status.textContent = 'That favorite already exists for this meal type.';
      return;
    }

    saveButton.disabled = true;
    status.textContent = 'Saving favorite...';
    try {
      await window.homeManagementData.saveMealFavorite(name, typeInput.value);
      nameInput.value = '';
      status.textContent = 'Favorite saved.';
    } catch (error) {
      status.textContent = 'Could not save the favorite: ' + error.message;
    } finally {
      saveButton.disabled = false;
    }
  });

  document.getElementById('copy-last-week-button').addEventListener('click', async function () {
    if (!parentModeActive) return;

    var button = document.getElementById('copy-last-week-button');
    var status = document.getElementById('copy-last-week-status');
    button.disabled = true;
    status.textContent = 'Loading last week...';

    try {
      var copiedMeals = await window.homeManagementData.getLastWeekMeals();
      copiedMeals.forEach(function (meal) {
        ['breakfast', 'lunch', 'dinner'].forEach(function (mealType) {
          weeklyMealForm.querySelector(
            '[data-meal-date="' + meal.date + '"][data-meal-type="' + mealType + '"]'
          ).value = meal[mealType];
        });
      });
      document.getElementById('meal-save-status').textContent = 'Unsaved changes';
      status.textContent = 'Last week copied. Review the plan, then save the week.';
    } catch (error) {
      status.textContent = 'Could not copy last week: ' + error.message;
    } finally {
      button.disabled = false;
    }
  });

  window.homeManagementApp = {
    setMembers: function (members) {
      var sampleData = window.homeManagementSampleData;

      Object.keys(members).forEach(function (memberId) {
        var existingMember = sampleData.members[memberId] || {};
        sampleData.members[memberId] = Object.assign({}, existingMember, members[memberId]);

        var profileButton = document.querySelector('[data-profile-target="' + memberId + '"]');
        if (profileButton) profileButton.textContent = members[memberId].name;
      });

      populateOwnerOptions();
      renderTodayChores();
    },
    setChores: function (chores) {
      var sampleData = window.homeManagementSampleData;
      var sampleOrder = sampleData.chores.map(function (chore) {
        return chore.id;
      });

      chores.sort(function (firstChore, secondChore) {
        var firstPosition = sampleOrder.indexOf(firstChore.id);
        var secondPosition = sampleOrder.indexOf(secondChore.id);

        if (firstPosition === -1) firstPosition = sampleOrder.length;
        if (secondPosition === -1) secondPosition = sampleOrder.length;

        return firstPosition - secondPosition || firstChore.name.localeCompare(secondChore.name);
      });

      sampleData.chores = chores;
      renderTodayChores();
      renderChoresByRoom();
      applyFamilyResetFlags();
    },
    setCompletions: function (savedCompletions) {
      completions = savedCompletions;
      renderTodayChores();
    },
    setOverrides: function (overrides) {
      window.homeManagementSampleData.overrides = overrides;
      renderTodayChores();
      renderChoresByRoom();
    },
    setTodayMeals: function (meals) {
      document.getElementById('today-breakfast').textContent = meals.breakfast || 'Not planned';
      document.getElementById('today-lunch').textContent = meals.lunch || 'Not planned';
      document.getElementById('today-dinner').textContent = meals.dinner || 'Not planned';
    },
    setWeeklyMeals: function (meals) {
      weeklyMeals = meals;
      renderWeeklyMeals();
    },
    setMealFavorites: function (favorites) {
      mealFavorites = favorites;
      renderMealFavorites();
    },
    setParentPinConfigured: function (isConfigured) {
      var setupForm = document.getElementById('parent-pin-form');
      var unlockForm = document.getElementById('parent-pin-unlock-form');
      var lockButton = document.getElementById('lock-parent-mode-button');
      var parentTools = document.getElementById('parent-tools');
      var description = document.getElementById('parent-pin-description');
      var status = document.getElementById('parent-pin-status');

      parentModeActive = false;
      document.querySelectorAll('.parent-only-control').forEach(function (control) {
        control.hidden = true;
      });
      closeChoreEditor();
      renderWeeklyMeals();
      renderMealFavorites();
      document.getElementById('meal-editing-note').textContent = 'Unlock Parent Mode under More to edit this week.';

      setupForm.hidden = isConfigured;
      unlockForm.hidden = !isConfigured;
      lockButton.hidden = true;
      parentTools.hidden = true;
      description.textContent = isConfigured
        ? 'Enter the Parent PIN to access household editing controls.'
        : 'Create a 4-digit PIN to prevent accidental changes by children.';
      status.textContent = '';
    },
    setSignedInParent: function (parentName, email) {
      document.getElementById('signed-in-parent').textContent = 'Signed in as ' + parentName + ' · ' + email;
    },
    setParentModeActive: function (isActive) {
      var unlockForm = document.getElementById('parent-pin-unlock-form');
      var lockButton = document.getElementById('lock-parent-mode-button');
      var parentTools = document.getElementById('parent-tools');
      var changePinForm = document.getElementById('change-parent-pin-form');
      var changePinStatus = document.getElementById('change-parent-pin-status');
      var description = document.getElementById('parent-pin-description');
      var status = document.getElementById('parent-pin-status');

      parentModeActive = isActive;
      document.querySelectorAll('.parent-only-control').forEach(function (control) {
        control.hidden = !isActive;
      });
      if (!isActive) closeChoreEditor();
      renderWeeklyMeals();
      renderMealFavorites();
      document.getElementById('meal-editing-note').textContent = isActive
        ? 'Editing is enabled. Save the week when your plan is ready.'
        : 'Unlock Parent Mode under More to edit this week.';
      if (!isActive) document.getElementById('meal-save-status').textContent = '';

      unlockForm.hidden = isActive;
      lockButton.hidden = !isActive;
      parentTools.hidden = !isActive;
      description.textContent = isActive
        ? 'Parent Mode is active for this session.'
        : 'Enter the Parent PIN to access household editing controls.';
      status.textContent = isActive ? 'Parent Mode unlocked.' : 'Parent Mode locked.';

      if (!isActive) {
        changePinForm.reset();
        changePinStatus.textContent = '';
      }
    },
    setMasterChores: function (chores) {
      var members = window.homeManagementSampleData.members;
      var list = document.getElementById('master-task-list');

      chores.sort(function (firstChore, secondChore) {
        return firstChore.room.localeCompare(secondChore.room)
          || firstChore.name.localeCompare(secondChore.name);
      });

      list.textContent = '';
      chores.forEach(function (chore) {
        var item = document.createElement('li');
        var owner = members[chore.defaultOwner];
        var ownerLabel = owner ? owner.name : chore.defaultOwner === 'family' ? 'Family' : 'Unassigned';
        var values = [
          chore.name,
          chore.room,
          ownerLabel,
          formatFrequency(chore.frequency) + (chore.active ? '' : ' · Inactive')
        ];

        item.className = 'master-task-item';
        if (!chore.active) item.classList.add('is-inactive');
        values.forEach(function (value, index) {
          var detail = document.createElement('span');
          detail.textContent = value;
          if (index === 0) detail.className = 'master-task-name';
          item.appendChild(detail);
        });

        var editButton = document.createElement('button');
        editButton.className = 'secondary-action master-task-edit parent-only-control';
        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.hidden = !parentModeActive;
        editButton.addEventListener('click', function () {
          openChoreEditor(chore);
        });
        item.appendChild(editButton);
        list.appendChild(item);
      });

      document.getElementById('master-task-count').textContent = chores.length + ' tasks';
    }
  };
});
