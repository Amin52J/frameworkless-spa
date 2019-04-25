const express = require('express');
const path = require('path');
const fs = require('fs');
const Mustache = require('mustache');
const minify = require('html-minifier').minify;
const { PORT, MINIFIER_OPTIONS, METAS, LANDING_PAGE } = require('./config');

const app = express();

const renderHtml = (content, res) => {
  try {
    fs.readFile(
      path.join(`${__dirname}/../static/pages/index.html`),
      'utf8',
      (err, html) => {
        if (err) {
          res.status(404).send('Page not found!');
        } else {
          let data = {};
          try {
            data = require(path.join(`${__dirname}/../static/data/index.js`));
          } catch (e) {
            data = {};
          }
          const layout = Mustache.render(html, {
            content,
            ...data,
            ...METAS,
          });
          res.send(minify(layout, MINIFIER_OPTIONS));
        }
      },
    );
  } catch (err) {
    res.status(404).send('Page not found!');
  }
};

const getPartialHtml = (fileName, callback) => {
  try {
    fs.readFile(
      path.join(`${__dirname}/../static/pages/${fileName}.html`),
      'utf8',
      async (err, html) => {
        if (err) {
          callback('Page not found!', null);
        } else {
          let data = {};
          try {
            data = require(path.join(
              `${__dirname}/../static/data/${fileName.split('.')[0]}.js`,
            ));
          } catch (e) {
            data = {};
          }
          await Promise.all(
            Object.keys(data).map(async key => {
              if (typeof data[key] === 'function') {
                data[key] = await data[key]();
              }
            }),
          );
          fs.readFile(
            path.join(`${__dirname}/../static/scripts/${fileName}.js`),
            'utf8',
            (err, script) => {
              fs.readFile(
                path.join(`${__dirname}/../static/styles/${fileName}.css`),
                'utf8',
                (err, style) => {
                  const content = Mustache.render(
                    `<style>{{{style}}}</style>${html}<script>{{{script}}}</script>`,
                    {
                      ...data,
                      script,
                      style,
                    },
                  );
                  callback(null, minify(content, MINIFIER_OPTIONS));
                },
              );
            },
          );
        }
      },
    );
  } catch (err) {
    callback('Page not found!', null);
  }
};

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
app.get('/partial', (req, res) =>
  getPartialHtml(LANDING_PAGE, (err, data) => {
    if (err) {
      res.status(404).send(err);
    } else {
      res.send(data);
    }
  }),
);
app.get('/partial/*', (req, res) =>
  getPartialHtml(
    req.url
      .split('/')
      .slice(-1)[0]
      .split('.')[0],
    (err, data) => {
      if (err) {
        res.status(404).send(err);
      } else {
        res.send(data);
      }
    },
  ),
);
app.get('/', (req, res) =>
  getPartialHtml(LANDING_PAGE, (err, data) => {
    if (err) {
      res.status(404).send(err);
    } else {
      renderHtml(data, res);
    }
  }),
);
app.get('*', (req, res) =>
  getPartialHtml(
    req.url
      .split('/')
      .slice(-1)[0]
      .split('.')[0],
    (err, data) => {
      if (err) {
        res.status(404).send(err);
      } else {
        renderHtml(data, res);
      }
    },
  ),
);

app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`));
