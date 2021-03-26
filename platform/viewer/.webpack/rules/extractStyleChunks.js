const ExtractCssChunksPlugin = require('extract-css-chunks-webpack-plugin');

function extractStyleChunks(isProdBuild) {
  return [
    {
      test: /\.styl$/,
      use: [
        {
          loader: ExtractCssChunksPlugin.loader,
          options: {
            hot: !isProdBuild,
          },
        },
        { loader: 'css-loader' },
        { loader: 'stylus-loader' },
      ],
    },
    {
      test: /\.(sa|sc|c)ss$/,
      use: [
        {
          loader: ExtractCssChunksPlugin.loader,
          options: {
            hot: !isProdBuild,
          },
        },
        'css-loader',
        'postcss-loader',
        // 'sass-loader',
      ],
    },
    {
      test: /\.less$/,
      use: [
        {
          loader: 'style-loader',
        },
        {
          loader: 'css-loader', // translates CSS into CommonJS
        },
        {
          loader: 'less-loader', // compiles Less to CSS
          options: {
            modifyVars: {
              'primary-color': '#40cd92',
              'text-selection-bg': '#1890ff',
              'btn-disable-bg': '#26292e',
              'btn-disable-color': '#606261'
            },
            javascriptEnabled: true,
          },
        },
      ],
    },
  ];
}

module.exports = extractStyleChunks;
