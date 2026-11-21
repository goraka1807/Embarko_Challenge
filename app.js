(() => {
  'use strict';

  const PROTOCOL = 'jarvis://screen/v1';
  const host = document.getElementById('screen-host');

  const routes = {
    start: 'start/code.html',
    wheel: 'wheel/code.html'
  };

  let activeFrame = null;
  let activeRoute = null;

  function screenNameFromRoute(route) {
    return route === 'wheel' ? 'wheel' : 'start';
  }

  function routeFromHash() {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    return routes[hash] ? hash : 'start';
  }

  function navigate(route, payload = {}) {
    if (!routes[route]) return;

    if (window.location.hash !== `#/${route}`) {
      window.location.hash = `/${route}`;
      return;
    }

    activateRoute(route, payload);
  }

  function deactivateActive(payload = {}) {
    if (!activeFrame) return;
    activeFrame.contentWindow?.postMessage({
      protocol: PROTOCOL,
      type: 'APP_DEACTIVATE',
      payload
    }, '*');
  }

  function activateRoute(route, payload = {}) {
    if (activeRoute === route && activeFrame) {
      activeFrame.contentWindow?.postMessage({
        protocol: PROTOCOL,
        type: 'APP_ACTIVATE',
        payload
      }, '*');
      return;
    }

    deactivateActive({ route: activeRoute });

    if (activeFrame) {
      activeFrame.remove();
      activeFrame = null;
    }

    const frame = document.createElement('iframe');
    frame.className = 'jarvis-screen-frame';
    frame.title = `JARVIS ${screenNameFromRoute(route).toUpperCase()}`;
    frame.src = routes[route];
    frame.setAttribute('allow', 'camera; microphone; autoplay; fullscreen');
    frame.setAttribute('allowfullscreen', '');

    frame.addEventListener('load', () => {
      frame.contentWindow?.postMessage({
        protocol: PROTOCOL,
        type: 'APP_ACTIVATE',
        payload
      }, '*');
    }, { once: true });

    host.replaceChildren(frame);
    activeFrame = frame;
    activeRoute = route;
  }

  window.addEventListener('message', (event) => {
    if (!activeFrame || event.source !== activeFrame.contentWindow) return;

    const message = event.data;
    if (!message || message.protocol !== PROTOCOL) return;

    if (message.type === 'ACTIVATION_COMPLETE') {
      navigate('wheel', message.payload || {});
    }

    if (message.type === 'NAVIGATE_REQUEST') {
      const destination = String(message.payload?.destination || '').toLowerCase();
      if (destination === 'wheel' || destination === 'home') navigate('wheel', message.payload);
    }

    if (message.type === 'ABORT_REQUEST') {
      navigate('wheel', message.payload || {});
    }
  });

  window.addEventListener('hashchange', () => {
    activateRoute(routeFromHash());
  });

  if (!window.location.hash) {
    window.location.hash = '/start';
  } else {
    activateRoute(routeFromHash());
  }
})();
