const path = require('path');
const webpackBase = require('./webpack.base');
const webpackMerge = require('webpack-merge');
const config = require('./config');
const webpack = require('webpack');
module.exports = webpackMerge(webpackBase, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          'vue-style-loader',
          'css-loader',
          'postcss-loader',
        ]
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader',
          'postcss-loader',
          {
            loader: 'sass-resources-loader',
            options: {
              resources: path.resolve(__dirname, '../src/styles/lib/main.scss'),
            }
          }
        ]
      },
      {
        test: /\.(js|vue)$/,
        // 强制先进行 ESLint 检查
        enforce: 'pre',
        // 不对 node_modules 和 lib 文件夹中的代码进行检查
        exclude: /node_modules|lib/,
        loader: 'eslint-loader',
        options: {
          // 启用自动修复
          fix: true,
          // 启用警告信息
          emitWarning: true,
        }
      }
    ]
  },
  devServer: {
    contentBase: config.devServerOutputPath,
    overlay: {
      errors: true,
      warnings: true,
    },
    open: true,
    hot: true,
  },
  plugins: [
    //热更新
    new webpack.HotModuleReplacementPlugin(),
  ],
});