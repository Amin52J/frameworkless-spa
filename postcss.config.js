const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    require('cssnano')({
      preset: 'default',
    }),
    autoprefixer({}),
  ],
};
