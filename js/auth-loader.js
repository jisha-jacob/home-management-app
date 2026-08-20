const authMessage = document.getElementById('auth-message');

import('./auth.js?v=20260820-6').catch(function (error) {
  authMessage.textContent = 'Sign-in setup failed: ' + error.message;
});
