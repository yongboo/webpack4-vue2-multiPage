const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');

const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const config = require('./config'); // 多页面的配置项
let HTMLPlugins = [];
let Entries = {};

config.HTMLDirs.forEach(item => {
  const htmlPlugin = new HTMLWebpackPlugin({
    title: item.title, // 生成的html页面的标题
    filename: `${item.page}.html`, // 生成到dist目录下的html文件名称，支持多级目录（eg: `${item.page}/index.html`）
    template: path.resolve(__dirname, `../src/template/index.html`), // 模板文件，不同入口可以根据需要设置不同模板
    chunks: [item.page, 'vendor'], // html文件中需要要引入的js模块，这里的 vendor 是webpack默认配置下抽离的公共模块的名称
  });
  HTMLPlugins.push(htmlPlugin);
  Entries[item.page] = path.resolve(__dirname, `../src/pages/${item.page}/index.js`); // 根据配置设置入口js文件
});


module.exports = {
  entry: Entries,
  output: {
    publicPath: '/',
    filename: 'js/[name].[hash:8].js',
    path: path.resolve(__dirname, '../dist'),
  },
  module: {
    rules: [
      {
        test: /\.vue$/, // 处理vue模块
        use: 'vue-loader',
      },
      {
        test: /\.js$/, //处理es6语法
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.(png|svg|jpg|gif)$/, // 处理图片
        use: {
          loader: 'file-loader', // 解决打包css文件中图片路径无法解析的问题
          options: {
            // 打包生成图片的名字
            name: '[name].[hash:8].[ext]',
            // 图片的生成路径
            outputPath: config.imgOutputPath,
          }
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/, // 处理字体
        use: {
          loader: 'file-loader',
          options: {
            outputPath: config.fontOutputPath,
          }
        }
      }
    ]
  },
  resolve: { // 设置模块如何被解析
    alias: {
      '@components': path.resolve(__dirname, '../src/components'),
      '@styles': path.resolve(__dirname, '../src/styles'),
    }
  },
  plugins: [
    new VueLoaderPlugin(),
    new CopyWebpackPlugin([{
      from: path.resolve(__dirname, '../public'),
      to: path.resolve(__dirname, '../dist'),
      ignore: ['*.html']
    }]),
    ...HTMLPlugins,
  ]
};
