// 引入基础配置
const path = require('path');
const webpackBase = require('./webpack.base');
// 引入 webpack-merge 插件
const webpackMerge = require('webpack-merge');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// 引入 webpack
// const webpack = require('webpack');
// 合并配置文件
module.exports = webpackMerge(webpackBase, {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      }, {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
          'postcss-loader',
          {
            loader: 'sass-resources-loader',
            options: {
              resources: path.resolve(__dirname, '../src/style/lib/main.scss'),
            },
          }
        ]
      },
    ]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all'
        }
      }
    },
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          compress: {
            warnings: false,
            drop_debugger: false,
            drop_console: true
          }
        }
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          safe: true
        }
      })
    ]
  },
  stats: {
    chunkGroups: false,
    chunkModules: false,
    chunkOrigins: false,
    modules: false,
    moduleTrace: false,
    source: false,
    children: false,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[chunkhash:8].css'
    })
  ]
});