(() => {
  'use strict';

  const PROTOCOL = 'jarvis://screen/v1';
  const host = document.getElementById('screen-host');

  const routes = {
    start: 'start/code.html',
    wheel: 'wheel/code.html',
    armory: 'armory/code.html',
    mark_i: 'mark_i/code.html',
    mark_v: 'mark_v/code.html',
    hulk_buster: 'hulk_buster/code.html',
    flight: 'flight/code.html',
    visor: 'visor/code.html'
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

    if (message.type === 'SELECT_SUIT') {
      const suit = String(message.payload?.suit || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const suitRoutes = {
        mark_i: 'mark_i',
        mark_i_suit: 'mark_i',
        mark_v: 'mark_v',
        mark_v_suit: 'mark_v',
        hulkbuster: 'hulk_buster',
        hulk_buster: 'hulk_buster',
        hulk_buster_suit: 'hulk_buster',
        hulkbuster_mk_xliv: 'hulk_buster'
      };
      const route = suitRoutes[suit];
      if (route) navigate(route, { selectedSuit: message.payload?.suit });
    }

    if (message.type === 'NAVIGATE_REQUEST') {
      const destination = String(message.payload?.destination || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const destinationRoutes = {
        wheel: 'wheel',
        home: 'wheel',
        command: 'wheel',
        armory: 'armory',
        armoury: 'armory',
        workbench: 'mark_v',
        mark_i: 'mark_i',
        mark_i_workbench: 'mark_i',
        mark_v: 'mark_v',
        mark_v_workbench: 'mark_v',
        hulkbuster: 'hulk_buster',
        hulk_buster: 'hulk_buster',
        hulkbuster_workbench: 'hulk_buster',
        flight: 'flight',
        visor: 'visor'
      };
      const route = destinationRoutes[destination];
      if (route) navigate(route, message.payload);
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
