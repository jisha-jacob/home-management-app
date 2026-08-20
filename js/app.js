document.addEventListener('DOMContentLoaded', function () {
  var currentDate = new Date();
  var completions = [];
  var selectedProfile = 'family';
  var masterChoresLoaded = false;

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
    var owner = members[ownerId];
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

  window.homeManagementApp = {
    setMembers: function (members) {
      var sampleData = window.homeManagementSampleData;

      Object.keys(members).forEach(function (memberId) {
        var existingMember = sampleData.members[memberId] || {};
        sampleData.members[memberId] = Object.assign({}, existingMember, members[memberId]);

        var profileButton = document.querySelector('[data-profile-target="' + memberId + '"]');
        if (profileButton) profileButton.textContent = members[memberId].name;
      });

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
      document.getElementById('today-breakfast').textContent = meals.breakfast;
      document.getElementById('today-lunch').textContent = meals.lunch;
      document.getElementById('today-dinner').textContent = meals.dinner;

      var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var todayName = dayNames[new Date().getDay()];
      var dayCards = document.querySelectorAll('.day-card');

      for (var index = 0; index < dayCards.length; index += 1) {
        if (dayCards[index].querySelector('h2').textContent !== todayName) continue;

        var mealValues = dayCards[index].querySelectorAll('dd');
        mealValues[0].textContent = meals.breakfast;
        mealValues[1].textContent = meals.lunch;
        mealValues[2].textContent = meals.dinner;
        break;
      }
    },
    setParentPinConfigured: function (isConfigured) {
      var setupForm = document.getElementById('parent-pin-form');
      var unlockForm = document.getElementById('parent-pin-unlock-form');
      var lockButton = document.getElementById('lock-parent-mode-button');
      var parentTools = document.getElementById('parent-tools');
      var description = document.getElementById('parent-pin-description');
      var status = document.getElementById('parent-pin-status');

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
        var values = [
          chore.name,
          chore.room,
          owner ? owner.name : 'Unassigned',
          chore.frequency.replaceAll('-', ' ')
        ];

        item.className = 'master-task-item';
        values.forEach(function (value, index) {
          var detail = document.createElement('span');
          detail.textContent = value;
          if (index === 0) detail.className = 'master-task-name';
          item.appendChild(detail);
        });
        list.appendChild(item);
      });

      document.getElementById('master-task-count').textContent = chores.length + ' tasks';
    }
  };
});
