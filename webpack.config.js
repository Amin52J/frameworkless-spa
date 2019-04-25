const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const glob = require('glob');

let entries = glob.sync('./app/scripts/**/*.js', {
  ignore: ['./app/scripts/data/*.js'],
});
entries = entries.reduce((acc, cur) => {
  acc[cur.replace('./app/scripts', '').replace('/pages', '')] = cur;
  return acc;
}, {});
module.exports = {
  devtool: 'source-map',
  entry: entries,
  output: {
    path: path.resolve(__dirname, 'static/scripts'),
    filename: '[name]',
    chunkFilename: '[name]',
  },
  module: {
    rules: [
      {
        exclude: /(node_modules)/,
        test: /\.(js)$/,
        loader: 'babel-loader',
      },
    ],
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        exclude: [/\.min\.js$/gi],
        sourceMap: true,
        uglifyOptions: {
          mangle: true,
          compress: {
            warnings: false,
            pure_getters: true,
            unsafe: true,
            unsafe_comps: true,
            conditionals: true,
            unused: true,
            comparisons: true,
            sequences: true,
            dead_code: true,
            evaluate: true,
            if_return: true,
            join_vars: true,
          },
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
  ],
  resolve: {
    extensions: ['.js'],
  },
  stats: {
    colors: true,
  },
};
