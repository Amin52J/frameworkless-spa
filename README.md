# Frameworkless-SPA

A frameworkless single page application boilerplate. [**LIVE DEMO**](http://www.amin52j.com)

You can read more about the idea, theory and the implementation of this boilerplate on [**this article**](https://medium.com/@a.jafari.90/framework-less-single-page-application-a547325f6e0c).

**NOTE:** This is not a Javascript driven framework or templating system, please read the article above to see how it works.

### Benefits

* **Super lightweight:** Only 1.2 KB gzipped Javascript overhead.
* **SEO Friendly:** 100% SEO friendly with complete SSR (no workarounds, just the simple fetch and serve).
* **Easy to use:** Nothing more than the old HTML and CSS development that we all first started with.
* **Full control:** Using this boilerplate and/or terminology we have full control over what and how we wanna implement things and what technologies and environments we wanna work with.
* **High performance:** Nothing beats the power and performance of Vanilla JS, HTML and CSS.
* **Extendible:** You can easily twist and extend this boilerplate and/or terminology to any extent that your mind and needs go which means you can easily use any kind of libraries like state managers (e.g. redux) or DOM Manipulators (e.g. jQuery).
* **File System Routing:** 100% file system routing support for all your pages and scripts. You never need to worry about routing and route handling.

### Technologies

* **babel:** to transpile our ES6-7
* **cssnano:** to not worry about the prefixes and css code performance
* **eslint:** to have linting utility over our code
* **express:** to get our server up and running (can be replaced by any backend languages or technologies)
* **mustache:** as our html template generator (can be replaced by any templating systems for any languages)
* **prettier:** to apply linting and code styling to our code
* **SCSS:** to style our project
* **webpack:** as our module bundler

### How to start?

* Clone the project
* `yarn`
* `yarn dev`
* visit [localhost:3000](http://127.0.0.1:3000)

### Scripts

* `yarn build` to make a single production build
* `yarn dev` to make a development build, run the server and watch for changes
* `yarn start` to start the server

### Docs

#### File System Routing and File System Templating

In this boilerplate all the imports of styles, scripts, data and routing are based on the file system structure which means the folder/file structure you choose for your html templates defines the routes and they need to be consistent in styles, scripts and data folders.

#### HTML Templating

* **Extend:** In order to extend the styles and scripts of a template in another template we add the following command to the beginning of the template `?{extend-path/to/template}?`
* **Partial Render:** In order to render a template into a certain place in the parent template, we use `?{content}?` in the intended place in parent.
* **Route Specific Partial Render:** In order to do a parital render just for a specific sub-page we use `?{content-template-name}?`
* **Full Page Render:** If we want the sub-page to replace the parent page, we should leave out `?{content}?` in the parent template.

#### Client-Side Route Handling

**Initialization:** In order to initialize the client side routing we should import router from `/scripts/helpers/router` and run the function with the options object. i.e. `router(options)`

```js
  router({
    delay: 0, // the delay to load the new route. gives us time to animate the page offload
    routeWillChange: () => {}, // this function will run before every route change
    routeDidChange: () => {}, // this function will run after every route change
  });
```

**routerTransition Hook:** This method exposes two events to us, the page load and the page offload. The function we pass to it is what runs on page load and the function it returns is what runs right before page offload.

```js
routerTransition(() => {
  console.log('page loaded');
  return () => {
    console.log('page offloading');
  };
});
```

### License

This project is licensed under the [MIT License](https://github.com/Amin52J/frameworkless-spa/blob/master/LICENSE).
