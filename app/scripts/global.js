import router from './helpers/router';

window.addEventListener('DOMContentLoaded', () => {
  /* initialize router */
  router({
    delay: 0,
    routeWillChange: () => {
      console.log('route is going to change');
    },
    routeDidChange: () => {
      console.log('route changed');
    },
  });
});
