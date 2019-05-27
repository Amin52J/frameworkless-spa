import loadScript from './loadScript';

function anchorListener(e) {
  e.preventDefault();
  const href = this.getAttribute('href');
  if (window.location.pathname !== href) {
    onRouteChange(href);
  }
}

const addListenerToAnchors = anchor => {
  const href = anchor.getAttribute('href');
  if (
    !href.startsWith('http') &&
    !href.startsWith('wwww') &&
    !href.startsWith('//')
  ) {
    anchor.addEventListener('click', anchorListener);
  }
};

const removeListenerFromAnchors = anchor => {
  const href = anchor.getAttribute('href');
  if (
    !href.startsWith('http') &&
    !href.startsWith('wwww') &&
    !href.startsWith('//')
  ) {
    anchor.removeEventListener('click', anchorListener);
  }
};

const onRouteChange = (href, noPush) => {
  const _app = document.getElementById('app');
  window.routeWillChange();
  setTimeout(() => {
    fetch(`/partial${href}`)
      .then(resp => resp.text())
      .then(html => {
        const pageOffload = new CustomEvent('page-offload');
        document.dispatchEvent(pageOffload);
        app.querySelectorAll('a').forEach(removeListenerFromAnchors);
        if (!noPush) {
          window.history.pushState({}, href, `${window.location.origin}${href}`);
        }
        _app.innerHTML = html;
        _app.querySelectorAll('a').forEach(addListenerToAnchors);
        loadScript(_app);
        const pageOnload = new CustomEvent('page-onload');
        document.dispatchEvent(pageOnload);
        window.routeDidChange();
      });
  }, window.routerDelay);
};

const router = ({
  routeWillChange = () => {},
  routeDidChange = () => {},
  delay = 0,
} = {}) => {
  window.routeWillChange = routeWillChange;
  window.routeDidChange = routeDidChange;
  window.routerDelay = delay;

  /* initialization */
  document.querySelectorAll('a').forEach(addListenerToAnchors);
  window.onpopstate = () => {
    onRouteChange(window.location.pathname + window.location.search, true);
  };
  const pageOnload = new CustomEvent('page-onload');
  document.dispatchEvent(pageOnload);
  routeDidChange();
};

export const routerTransition = (cb = () => () => {}) => {
  const noop = () => {};
  const cbReturn = cb() || noop;
  let init = false;
  const onload = () => {
    if (init) {
      cb();
    } else {
      init = true;
    }
  };
  const offload = () => {
    cbReturn();
    document.removeEventListener('page-onload', onload);
    document.removeEventListener('page-offload', offload);
  };
  document.addEventListener('page-onload', onload);
  document.addEventListener('page-offload', offload);
};

export const routeTo = onRouteChange;

export default router;
