const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    concatenateModules: false,
    splitChunks: {
      // include all types of chunks
      chunks: 'all',
    },
  },
});
