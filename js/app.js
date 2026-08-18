document.addEventListener('DOMContentLoaded', function () {
  var dateElement = document.getElementById('today-date');

  if (dateElement) {
    var today = new Date();
    var formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).format(today);

    dateElement.dateTime = today.toISOString().slice(0, 10);
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
