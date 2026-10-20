const authMessage = document.getElementById('auth-message');

import('./auth.js?v=20261020-22').catch(function (error) {
  authMessage.textContent = 'Sign-in setup failed: ' + error.message;
});
