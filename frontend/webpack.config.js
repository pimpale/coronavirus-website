// webpack.config.js
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = {
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.pug$/,
        use: [{ loader: "pug-loader" }],
      },
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/vendor', to: 'vendor' },
        { from: 'src/img', to: 'img' },
        { from: 'src/css', to: 'css' },
        { from: 'src/js', to: 'js' },
      ]
    }),
    [
      'about',
      'index',
      'check',
      'upload',
      'termsofservice'
    ].map((n) => new HtmlWebpackPlugin({
      filename: `${n}.html`,
      template: `src/${n}.pug`,
      inject: false
    }))
  ].flat()
};

module.exports = config;
