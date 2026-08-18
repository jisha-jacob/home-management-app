document.addEventListener('DOMContentLoaded', function () {
  var dateElement = document.getElementById('today-date');

  if (!dateElement) return;

  var today = new Date();
  var formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(today);

  dateElement.dateTime = today.toISOString().slice(0, 10);
  dateElement.textContent = formattedDate.toUpperCase();
});
