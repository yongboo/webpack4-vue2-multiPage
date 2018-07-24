const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
// 清理 dist 文件夹
const CleanWebpackPlugin = require('clean-webpack-plugin');
// 抽取css extract-text-webpack-plugin不再支持webpack4，官方出了mini-css-extract-plugin来处理css的抽取
// const ExtractTextPlugin = require('extract-text-webpack-plugin');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
// 引入多页面文件列表
const config = require('./config');
let HTMLPlugins = [];
let Entries = {};

config.HTMLDirs.forEach(page => {
  const htmlPlugin = new HTMLWebpackPlugin({
    filename: `${page}.html`,
    template: path.resolve(__dirname, `../src/template/index.html`),
    chunks: [page, 'vendor'],
  });
  HTMLPlugins.push(htmlPlugin);
  Entries[page] = path.resolve(__dirname, `../src/pages/${page}/index.js`);
})


module.exports = {
  entry: Entries,
  // 启用 sourceMap
  devtool: 'cheap-module-source-map',
  output: {
    filename: 'js/[name].[hash:8].js',
    path: path.resolve(__dirname, '../dist'),
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: {
          loader: 'file-loader',
          options: {
            // 打包生成图片的名字
            name: '[name].[ext]',
            // 图片的生成路径
            outputPath: config.imgOutputPath,
          }
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: {
          loader: 'file-loader',
          options: {
            outputPath: config.fontOutputPath,
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, '../src/components'),
      '@styles': path.resolve(__dirname, '../src/styles'),
    },
    mainFields: ['jsnext:main', 'browser', 'main'],
  },

  plugins: [
    // 自动清理 dist 文件夹
    new CleanWebpackPlugin(['dist'], {
      root: path.resolve(__dirname, '..'),
      verbose: true, //开启在控制台输出信息
      dry: false,
    }),
    new VueLoaderPlugin(),
    new CopyWebpackPlugin([{
      from: path.resolve(__dirname, '../public'),
      to: path.resolve(__dirname, '../dist'),
      ignore: ['*.html']
    }]),
    // 将 css 抽取到某个文件夹
    // 这里将所有的 css 提取到 dist 文件夹下的 css 文件夹中，并命名为 style.css
    ...HTMLPlugins,
    
  ]
};
