const express = require('express');
const path = require('path');
const fs = require('fs');
const Mustache = require('mustache');
const minify = require('html-minifier').minify;
const { PORT, MINIFIER_OPTIONS, METAS, LANDING_PAGE } = require('./config');
const routes = require('./routes');

const app = express();

app.use((req, res, next) => {
  let url = req.url.replace('/partial', '');
  let path = null;
  const isPartial = req.url.includes('/partial');
  const exceptions = {};
  const splittedRoutes = Object.keys(routes)
    .filter(routeName => !routes[routeName].includes('*'))
    .map(routeName => routes[routeName].split('/').filter(item => item));

  const query = url.split('?')[1] || '';
  url = url.split('?')[0];
  const splittedUrl = url.split('/').filter(item => item);
  const matchedRoute = splittedRoutes.find(
    route => route[0] === splittedUrl[0],
  );
  const requiredParts =
    (matchedRoute && matchedRoute.filter(item => !item.includes('?'))) || [];
  if (
    matchedRoute &&
    matchedRoute.length > 0 &&
    requiredParts.length < splittedUrl.length &&
    !url.includes('.map') &&
    !url.includes('$')
  ) {
    const pairs = matchedRoute
      .map((route, index) =>
        splittedUrl[index]
          ? {
              [route
                .split(':')
                .join('')
                .split('?')
                .join('')]: splittedUrl[index] || '',
            }
          : '',
      )
      .filter(item => item);
    const pairsObj = pairs.reduce((acc, cur) => ({ ...acc, ...cur }), {});
    path = Object.keys(pairsObj).reduce((acc, cur) => {
      if (pairsObj[cur] === cur) {
        return `${acc}/${exceptions[cur] || cur}`;
      }
      return `${acc}${acc.includes('?') ? '&' : '?'}${cur}=${pairsObj[cur]}`;
    }, '');
    path = `${isPartial ? '/partial' : ''}${path}${
      query ? (path.includes('?') ? '&' : '?') : ''
    }${query}`;
    const originalQueries = Object.keys(req.query || {});
    req.query = path
      .split('?')[1]
      .split('&')
      .reduce((acc, cur) => {
        const [key, value] = cur.split('=');
        acc[key] = value;
        return acc;
      }, req.query);
    req.url = `${path.split('?')[0]}/${path
      .split('?')[1]
      .split('&')
      .map(item =>
        originalQueries.includes(item.split('=')[0])
          ? null
          : `$${item.split('=')[0]}`,
      )
      .filter(a => a)
      .join('/')}?${path.split('?')[1]}`;
    app.handle(req, res);
  } else {
    next();
  }
});

const readFile = filePath =>
  new Promise((resolve, reject) => {
    try {
      fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) {
          reject(err);
        }
        resolve(html);
      });
    } catch (e) {
      reject(e);
    }
  });

const requireUncached = module => {
  delete require.cache[require.resolve(module)];
  return require(module);
};

const renderHtml = async (content, res, req) => {
  try {
    const html = await readFile(
      path.join(`${__dirname}/../static/pages/index.html`),
    );
    let data = {};
    try {
      data = requireUncached(path.join(`${__dirname}/../static/data/index.js`));
    } catch (e) {
      data = {};
    }
    await Promise.all(
      Object.keys(data).map(async key => {
        if (typeof data[key] === 'function') {
          data[key] = await data[key](req);
        }
      }),
    );
    const layout = Mustache.render(html, {
      content,
      ...data,
      ...METAS,
    });
    res.send(minify(layout, MINIFIER_OPTIONS));
  } catch (err) {
    res.status(404).send('Page not found!');
  }
};

const partialSuccess = async (html, fileName, callback, extendedPage, req) => {
  let data = {};
  try {
    data = requireUncached(
      path.join(`${__dirname}/../static/data/${fileName.split('.')[0]}.js`),
    );
  } catch (e) {
    data = {};
  }
  await Promise.all(
    Object.keys(data).map(async key => {
      if (typeof data[key] === 'function') {
        data[key] = await data[key](req);
      }
    }),
  );
  let script = null;
  let extend = html.match(/\?{extend-.*?}\?/);
  if (extend && extend.length) {
    extend = extend[0].replace('?{extend-', '').replace('}?', '');
  }
  try {
    script = await readFile(
      path.join(`${__dirname}/../static/scripts/${fileName}.js`),
    );
  } catch (e) {
    if (extend) {
      try {
        script = await readFile(
          path.join(`${__dirname}/../static/scripts/${extend}.js`),
        );
      } catch (e) {}
    }
  }
  let style = null;
  try {
    style = await readFile(
      path.join(`${__dirname}/../static/styles/${fileName}.css`),
    );
  } catch (e) {
    if (extend) {
      try {
        style = await readFile(
          path.join(`${__dirname}/../static/styles/${extend}.css`),
        );
      } catch (e) {}
    }
  }
  const content = Mustache.render(
    `<style>{{{style}}}</style>${html}<script>{{{script}}}</script>`,
    {
      ...data,
      script,
      style,
      content: extendedPage,
    },
  );
  callback(minify(content, MINIFIER_OPTIONS));
};

const getPartialHtml = (req, fileName, extendedPage = '') =>
  new Promise(async (resolve, reject) => {
    try {
      const html = await readFile(
        path.join(`${__dirname}/../static/pages${fileName}.html`),
      );
      partialSuccess(html, fileName, resolve, extendedPage, req);
    } catch (err) {
      if (!fileName.includes('/index')) {
        try {
          const data = await getPartialHtml(req, `${fileName}/index`);
          resolve(data);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(err);
      }
    }
  });

app.get('/static/styles/*', (req, res) =>
  res.sendFile(
    path.join(
      `${__dirname}/../static/styles/${req.url.split('/').slice(-1)[0]}`,
    ),
  ),
);
app.get('/static/data/*', (req, res) =>
  res.sendFile(
    path.join(`${__dirname}/../static/data/${req.url.split('/').slice(-1)[0]}`),
  ),
);
app.get('/static/scripts/*', (req, res) =>
  res.sendFile(
    path.join(
      `${__dirname}/../static/scripts/${req.url.split('/').slice(-1)[0]}`,
    ),
  ),
);
app.get('/static/images/*', (req, res) =>
  res.sendFile(
    path.join(
      `${__dirname}/../static/images/${req.url.split('/').slice(-1)[0]}`,
    ),
  ),
);
app.get('/static/others/*', (req, res) =>
  res.sendFile(
    path.join(
      `${__dirname}/../static/others/${req.url.split('/').slice(-1)[0]}`,
    ),
  ),
);
app.get('/partial', async (req, res) => {
  try {
    const data = await getPartialHtml(req, `/${LANDING_PAGE}`);
    res.send(data);
  } catch (err) {
    res.status(404).send(err);
  }
});
app.get('/partial/*', async (req, res) => {
  const fileName = req.path.replace('/partial', '').split('.')[0];
  const paths = fileName.split('/').filter(a => a);
  const data = await Promise.all(
    paths.map(async (p, index) => {
      try {
        const route = Array(index)
          .fill('')
          .map((a, i) => paths[i])
          .join('/');
        return await getPartialHtml(req, `${route ? '/' : ''}${route}/${p}`);
      } catch (e) {
        return null;
      }
    }),
  );
  if (data.indexOf(null) > -1) {
    res.status(404).send('Page not found!');
  } else {
    const html = data
      .slice()
      .reverse()
      .reduce(
        (acc, cur, index) =>
          cur.includes('?{content}?') ||
          cur.includes(`?{content-${paths.slice().reverse()[index - 1]}}?`)
            ? cur
                .replace('?{content}?', acc)
                .replace(
                  `?{content-${paths.slice().reverse()[index - 1]}}?`,
                  acc,
                )
            : acc || cur,
        '',
      );
    res.send(html.replace(/\?{.*?}\?/g, ''));
  }
});
app.get('/', async (req, res) => {
  try {
    const data = await getPartialHtml(req, `/${LANDING_PAGE}`);
    renderHtml(data, res, req);
  } catch (err) {
    res.status(404).send(err);
  }
});
app.get('*', async (req, res) => {
  const fileName = req.path.split('.')[0];
  const paths = fileName.split('/').filter(a => a);
  const data = await Promise.all(
    paths.map(async (p, index) => {
      try {
        const route = Array(index)
          .fill('')
          .map((a, i) => paths[i])
          .join('/');
        return await getPartialHtml(req, `${route ? '/' : ''}${route}/${p}`);
      } catch (e) {
        return null;
      }
    }),
  );
  if (data.indexOf(null) > -1) {
    res.status(404).send('Page not found!');
  } else {
    const html = data
      .slice()
      .reverse()
      .reduce(
        (acc, cur, index) =>
          cur.includes('?{content}?') ||
          cur.includes(`?{content-${paths.slice().reverse()[index - 1]}}?`)
            ? cur
                .replace('?{content}?', acc)
                .replace(
                  `?{content-${paths.slice().reverse()[index - 1]}}?`,
                  acc,
                )
            : acc || cur,
        '',
      );
    renderHtml(html.replace(/\?{.*?}\?/g, ''), res, req);
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`));
