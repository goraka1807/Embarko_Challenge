(() => {
  'use strict';

  const protocol = 'jarvis://screen/v1';

  function send(type, payload = {}) {
    if (window.parent !== window) {
      window.parent.postMessage({ protocol, type, payload }, '*');
    }
  }

  function activate(payload = {}) {
    send('SCREEN_ACTIVATE', payload);
  }

  function deactivate(payload = {}) {
    send('SCREEN_DEACTIVATE', payload);
  }

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (!message || message.protocol !== protocol) return;

    if (message.type === 'APP_ACTIVATE') {
      activate(message.payload || {});
      document.dispatchEvent(new CustomEvent('jarvis:activate', { detail: message.payload || {} }));
    }

    if (message.type === 'APP_DEACTIVATE') {
      deactivate(message.payload || {});
      document.dispatchEvent(new CustomEvent('jarvis:deactivate', { detail: message.payload || {} }));
    }

    if (message.type === 'APP_STATE') {
      document.dispatchEvent(new CustomEvent('jarvis:state', { detail: message.payload || {} }));
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    send('SCREEN_READY', { screen: document.body.dataset.screen || null });
  });

  window.JarvisBridge = Object.freeze({
    send,
    navigate(destination, payload = {}) {
      send('NAVIGATE_REQUEST', { destination, ...payload });
    },
    selectSuit(suit, payload = {}) {
      send('SELECT_SUIT', { suit, ...payload });
    },
    activationComplete(payload = {}) {
      send('ACTIVATION_COMPLETE', payload);
    },
    abort(payload = {}) {
      send('ABORT_REQUEST', payload);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => send('SCREEN_READY', {}), { once: true });
  } else {
    send('SCREEN_READY', {});
  }
})();
