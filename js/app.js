document.addEventListener('DOMContentLoaded', function () {
  var currentDate = new Date();
  var completions = [];
  var selectedProfile = 'family';

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

  function setChoreCompletion(choreId, completed) {
    var dateKey = formatDateKey(currentDate);

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
    button.addEventListener('click', function () {
      var target = button.getAttribute('data-chore-view-target');

      choreViews.forEach(function (view) {
        view.hidden = view.getAttribute('data-chore-view') !== target;
      });

      choreViewButtons.forEach(function (viewButton) {
        viewButton.setAttribute('aria-pressed', viewButton === button ? 'true' : 'false');
      });
    });
  });
});
