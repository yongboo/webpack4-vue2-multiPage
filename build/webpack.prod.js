// 引入基础配置
const path = require('path');
const webpackBase = require('./webpack.base');
// 引入 webpack-merge 插件
const webpackMerge = require('webpack-merge');
// 清理 dist 文件夹
const CleanWebpackPlugin = require('clean-webpack-plugin');
// js压缩、优化插件
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
// 抽取css extract-text-webpack-plugin不再支持webpack4，官方出了mini-css-extract-plugin来处理css的抽取
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

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
              resources: path.resolve(__dirname, '../src/styles/lib/main.scss'),
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
      new UglifyJsPlugin({ // 压缩js
        uglifyOptions: {
          compress: {
            warnings: false,
            drop_debugger: false,
            drop_console: true
          }
        }
      }),
      new OptimizeCSSAssetsPlugin({ // 压缩css
        cssProcessorOptions: {
          safe: true
        }
      })
    ]
  },
  plugins: [
    // 自动清理 dist 文件夹
    new CleanWebpackPlugin(['dist'], {
      root: path.resolve(__dirname, '..'),
      verbose: true, //开启在控制台输出信息
      dry: false,
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[chunkhash:8].css'
    })
  ]
});