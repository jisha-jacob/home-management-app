const authMessage = document.getElementById('auth-message');

import('./auth.js?v=20260819-19').catch(function (error) {
  authMessage.textContent = 'Sign-in setup failed: ' + error.message;
});
