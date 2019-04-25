import { routerTransition } from '../helpers/router';

routerTransition(() => {
  console.log('page-a loaded');
  return () => {
    console.log('page-a offloading');
  };
});
