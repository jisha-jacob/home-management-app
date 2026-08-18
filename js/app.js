document.addEventListener('DOMContentLoaded', function () {
  console.log('Phase 0 scaffold loaded');
  var btn = document.getElementById('open-dashboard');
  if (btn) btn.addEventListener('click', function (e) {
    e.preventDefault();
    alert('Placeholder dashboard — Phase 0');
  });
});
