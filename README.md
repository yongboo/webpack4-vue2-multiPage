# 基于webpack4搭建vue2、vuex多页应用

## 背景

最近在对公司的H5项目做重构，涉及到构建优化，由于一些历史原因，项目原先使用的打包工具是饿了么团队开发的 cooking（基于 webpack 做的封装，目前已停止维护了。）如果继续使用，一是项目目前已经比较复杂，现在的构建方式每次打包耗时较长；二是使用一个已经停止维护的工具本身也有风险；另外因为本次重构还要进行 Vue1.0 到 Vue2.0 的框架升级，涉及到一系列依赖包（ vue-style-loader 等）的版本兼容问题。折腾了一天也没啥头绪，索性将构建工具直接升级到 webpack4，同步搭配 vue2 和 vuex3，一步到位。

由于公司业务需要（SEO、页面主要以投放为主），我们项目采用的是多页面架构，网上基于vue的单页应用模板，官方提供了 vue-cli，第三方的也不少，多页模板可参考的却不多。我前后花了两周左右时间，参考了一些博客资料和文档，整理了这套基于webpack4 + vue2 + vuex3的多页应用模板，记录下来方便自己以后查看，也分享给有需要的同学参考。


## webpack的核心概念

受 Parcel 等零配置构建工具的启发，webpack4 也在向无配置方向努力，做了大量优化，虽然支持零配置的方式，但如果想对模块进行细粒度的控制，仍然需要手动对一些配置项进行设定。但和 webpack 之前版本相比已经明显简化，上手容易了很多。这里先了解 webpack4 的几个核心配置项，后面会逐一展开：

- mode
- entry
- output
- loader
- plugins
- devServer

接下来我就按照上面的顺序，尽量详细的列出基于 webpack4 搭建 vue2、vuex 多页应用的全流程

## mode

webpack4新增，指定打包模式，可选的值有：
1. development，开发模式
   - 会将 process.env.NODE_ENV 设置成 development
   - 启用 NamedChunksPlugin、NamedModulesPlugin 插件
2. production，生产模式
   - 会将 process.env.NODE_ENV 设置成 production
   - 会启用最大化的优化（模块的压缩、串联等）
3. none，这种模式不会进行优化处理

### mode设置的两种方式:
- package.json 中通过shell命令参数形式设置
```js
webpack --mode=production
```
- 通过配置mode配置项
```js
module.exports = {
  mode: 'production'
};
```
> 更多信息可参考：[官方文档 Mode](https://webpack.js.org/concepts/mode/)

## entry

对比多页应用和单页应用（SPA）,最大的不同点，就在于入口的不同
- 多页：最终打包生成多个入口（ html 页面），一般每个入口文件除了要引入公共的静态文件（ js/css ）还要另外引入页面特有的静态资源
- 单页：只有一个入口( index.html )，页面中需要引入打包后的所有静态文件，所有的页面内容全由 JavaScript 控制

需要注意的是，上面说的入口指的都是最终打包到dist目录下的html文件，而我们在这里配置的 entry 其实是需要被 html 引入的js模块，这些js模块、连同抽离的公共js模块最终还需要利用  html-webpack-plugin 这个插件组合到html文件中：
```js
const config = require('./config'); // 多页面的配置项
let HTMLPlugins = [];
let Entries = {};

config.HTMLDirs.forEach(item => {
  let filename = `${item.page}.html`;
  if (item.dir) filename = `${item.dir}/${item.page}.html`;
  const htmlPlugin = new HTMLWebpackPlugin({
    title: item.title, // 生成的html页面的标题
    filename: filename, // 生成到dist目录下的html文件名称，支持多级目录（eg: `${item.page}/index.html`）
    template: path.resolve(__dirname, `../src/template/index.html`), // 模板文件，不同入口可以根据需要设置不同模板
    chunks: [item.page, 'vendor'], // html文件中需要要引入的js模块，这里的 vendor 是webpack默认配置下抽离的公共模块的名称
  });
  HTMLPlugins.push(htmlPlugin);
  Entries[item.page] = path.resolve(__dirname, `../src/pages/${item.page}/index.js`); // 根据配置设置入口js文件
});
// ...


```
config.js中多页的配置信息：
```js
module.exports = {
  HTMLDirs: [
    {
      page: 'index',
      title: '首页'
    },
    {
      page: 'list',
      title: '列表页',
      dir: 'content' // 支持设置多级目录

    },
    {
      page: 'detail',
      title: '详情页'
    }
  ],
  // ...
};
```
最后再引入相关配置：
```js
module.exports = {
  entry: Entries,
  // ...
   plugins: [
     ...HTMLPlugins // 利用 HTMLWebpackPlugin 插件合成最终页面
   ]
  // ... 
}
```
关于公共模块的抽离后面会单独介绍
> html-webpack-plugin更多配置信息：[html-webpack-plugin官网](https://github.com/jantimon/html-webpack-plugin)


## output

配置出口的文件名和路径：
```js
const env = process.env.BUILD_MODE.trim();
let ASSET_PATH = '/'; // dev 环境
if (env === 'prod') ASSET_PATH = '//abc.com/static/'; // build 时设置成实际使用的静态服务地址
module.exports = {
  entry: Entries,
  output: {
    publicPath: ASSET_PATH,
    filename: 'js/[name].[hash:8].js',
    path: path.resolve(__dirname, '../dist'),
  },
}  
```
这里将生成的js文件挂上8位的MD5戳，以充分利用CDN缓存。
> 关于hash的几种计算方式和区别可以参考 [webpack中的hash、chunkhash、contenthash区别](https://juejin.im/post/5a4502be6fb9a0450d1162ed)

## loader

loader 用于对模块的源代码进行转换，负责把某种文件格式的内容转换成 webpack 可以支持打包的模块，例如将sass预处理转换成 css 模块；将 TypeScript 转换成 JavaScript；或将内联图像转换为 data URL等

### 具体配置：
- webpack.base.js(基础配置文件)
```js
const VueLoaderPlugin = require('vue-loader/lib/plugin');
// ...

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
          name: '[name].[ext]',
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
  plugins: [
    // ...
    new VueLoaderPlugin()  
  ]
// ...
```
vue-loader要配合 VueLoaderPlugin 插件一起使用。
babel-loader 要配合 .babelrc 使用。这里配置“stage-2”以使用es7里的高级语法，实测如果不配置就无法处理 对象扩展符、async和await 等新语法特性。

.babelrc配置：
```js
{
  "presets": [
    ["env", {
      "modules": false,
      "targets": {
        "browsers": ["> 1%", "last 2 versions", "not ie <= 8"]
      }
    }],
    "stage-2"
  ],
  "plugins": ["transform-runtime"]
}

```
> 关于 .babelrc 相关的配置可参考: 
> [官方文档](https://babeljs.io/docs/en/babelrc)；
> [babel配置-各阶段的stage的区别](https://www.vanadis.cn/2017/03/18/babel-stage-x/)

- webpack.dev.js(开发配置文件)
```js
// ...
module: {
  rules: [
    {
      test: /\.css$/,
      exclude: /node_modules/,
      use: [
        'vue-style-loader', // 处理vue文件中的css样式
        'css-loader',
        'postcss-loader',
      ]
    },
    {
      test: /\.scss$/,
      exclude: /node_modules/,
      use: [ // 这些loader会按照从右到左的顺序处理样式
        'vue-style-loader',
        'css-loader',
        'sass-loader',
        'postcss-loader',
        { 
          loader: 'sass-resources-loader', // 将定义的sass变量、mix等统一样式打包到每个css文件中，避免在每个页面中手动手动引入
          options: {
            resources: path.resolve(__dirname, '../src/styles/lib/main.scss'),
          }
        }
      ]
    },
    {
      test: /\.(js|vue)$/,
      enforce: 'pre', // 强制先进行 ESLint 检查
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
// ...
```
- webpack.prod.js(生产配置文件)
```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ASSET_PATH = '//abc.com/static/'; // 线上静态资源地址
// ...
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
    {
        test: /\.(png|svg|jpg|gif)$/, // 处理图片
        use: {
          loader: 'file-loader', // 解决打包css文件中图片路径无法解析的问题
          options: {
            // 打包生成图片的名字
            name: '[name].[hash:8].[ext]',
            // 图片的生成路径
            outputPath: config.imgOutputPath,
            publicPath: ASSET_PATH
          }
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/, // 处理字体
        use: {
          loader: 'file-loader',
          options: {
            outputPath: config.fontOutputPath,
            publicPath: ASSET_PATH
          }
        }
      }
  ]
},
// ...
plugins: [
  new MiniCssExtractPlugin({
    filename: 'css/[name].[chunkhash:8].css' // css最终以单文件形式抽离到 dist/css目录下
  })
]
```  
抽取 css 成单个文件 之前使用的 extract-text-webpack-plugin 不再支持webpack4，官方出了 [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) 来处理css的抽取

## plugins

在webpack打包流程中，模块代码转换的工作由 loader 来处理，除此之外的其他工作都可以交由 plugin 来完成。常用的有：
- uglifyjs-webpack-plugin， 处理js代码压缩
- mini-css-extract-plugin， 将css抽离成单文件
- clean-webpack-plugin， 用于每次 build 时清理 dist 文件夹
- copy-webpack-plugin， copy文件
- webpack.HotModuleReplacementPlugin， 热加载
- webpack.DefinePlugin，定义环境变量

### 具体配置：
- webpack.base.js(基础配置文件)
```js
const HTMLWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
// ...
plugins: [
  new VueLoaderPlugin(),
  new CopyWebpackPlugin([
    {
      from: path.resolve(__dirname, '../public'),
      to: path.resolve(__dirname, '../dist'),
      ignore: ['*.html']
    },
    {
      from: path.resolve(__dirname, '../src/scripts/lib'), // 搬运本地类库资源
      to: path.resolve(__dirname, '../dist')
    }
  ]),
  ...HTMLPlugins, // 利用 HTMLWebpackPlugin 插件合成最终页面
  new webpack.DefinePlugin({
    'process.env.ASSET_PATH': JSON.stringify(ASSET_PATH) // 利用 process.env.ASSET_PATH 保证模板文件中引用正确的静态资源地址
  })
  
]

```

- webpack.prod.js(生产配置文件)
```js
// 抽取css extract-text-webpack-plugin不再支持webpack4，官方出了mini-css-extract-plugin来处理css的抽取
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
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
```

## devServer

日常开发的时候我们需要在本地启动一个静态服务器，以方便开发调试，我们使用 webpack-dev-server  这个官方提供的一个工具，基于当前的 webpack 构建配置快速启动一个静态服务。当 mode 为 development 时，会具备 hot reload 的功能，所以不需要再手动引入 webpack.HotModuleReplacementPlugin 插件了。

一般把 webpack-dev-server 作为开发依赖安装，然后使用 npm scripts 来启动：
```shell
npm install webpack-dev-server -S
```

package 中的 scripts 配置：
```json
"scripts": {
  "dev": "cross-env BUILD_MODE=dev webpack-dev-server ",
},

```
> devServer的详细配置可参考官方文档：[dev-server](https://webpack.js.org/configuration/dev-server/)


## splitChunks配置

webpack 4 移除了 CommonsChunkPlugin，取而代之的是两个新的配置项（ optimization.splitChunks 和 optimization.runtimeChunk ）用于抽取公共js模块。
通过 optimization.runtimeChunk: true 选项，webpack 会添加一个只包含运行时(runtime)额外代码块到每一个入口。（注：这个需要看场景使用，会导致每个入口都加载多一份运行时代码）。

### splitChunks默认配置介绍：
```js
module.exports = {
  // ...
  optimization: {
    splitChunks: {
      chunks: 'async', // 控制webpack选择哪些代码块用于分割（其他类型代码块按默认方式打包）。有3个可选的值：initial、async和all。
      minSize: 30000, // 形成一个新代码块最小的体积
      maxSize: 0,
      minChunks: 1, // 在分割之前，这个代码块最小应该被引用的次数（默认配置的策略是不需要多次引用也可以被分割）
      maxAsyncRequests: 5, // 按需加载的代码块，最大数量应该小于或者等于5
      maxInitialRequests: 3, // 初始加载的代码块，最大数量应该小于或等于3
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        vendors: { // 将所有来自node_modules的模块分配到一个叫vendors的缓存组
          test: /[\\/]node_modules[\\/]/,
          priority: -10 // 缓存组的优先级(priotity)是负数，因此所有自定义缓存组都可以有比它更高优先级
        },
        default: { 
          minChunks: 2, // 所有重复引用至少两次的代码，会被分配到default的缓存组。
          priority: -20, // 一个模块可以被分配到多个缓存组，优化策略会将模块分配至跟高优先级别（priority）的缓存组
          reuseExistingChunk: true // 允许复用已经存在的代码块，而不是新建一个新的，需要在精确匹配到对应模块时候才会生效。
        }
      }
    }
  }
};
```
> 关于 SplitChunksPlugin 的详细配置可参考官方文档: [SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)

## Vue && Vuex

### Vue:
我们知道vue单页应用只有一个入口，默认入口文件是 main.js，在该文件中处理 vue模板、Vuex 最终构造Vue对象。而多页应用有多个入口，相当于在每个入口里都要处理一遍单页里 main.js 要处理的事情。
一般的配置类似这样：
```js
import Vue from 'vue';
import Tpl from './index.vue'; // Vue模板
import store from '../../store'; // Vuex

new Vue({
  store,
  render: h => h(Tpl),
}).$mount('#app');
```
### Vuex:
为了避免所有状态都集中到 store 对象中，导致文件臃肿，不易维护，这里将store 分割成多个模块（module）。每个模块拥有自己的 state、mutation、action。同时将getter抽离成单独文件。
文件结构如下：
```cpp
|- store
|   |-modules
|   |   |-app.js // 单个module
|   |   |-user.js // // 单个module
|   |-getters.js    
|   |-index.js // 在这里组织各个module 
```
单个module的设置如下：
```js
const app = {
  state: { // state
    count: 0
  },
  mutations: { // mutations
    ADD_COUNT: (state, payload) => {
      state.count += payload.amount;
    }
  },
  actions: { // actions
    addCount: ({ commit }, payload) => {
      commit('ADD_COUNT', {
        amount: payload.num
      });
    }
  }
};

export default app;
```

最终在index.js中组装各个module：
```js
import Vue from 'vue';
import Vuex from 'vuex';
import app from './modules/app';
import user from './modules/user';
import getters from './getters';

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    app,
    user
  },
  getters
});

export default store;
```

## 总结

总算写完了，中间填了不少坑，但一路走下来还是有不少收获的，后面有时间会继续完善。项目源码的github地址在这里：[webpack4-vue2-multiPage](https://github.com/yongboo/webpack4-vue2-multiPage)，有需要的直接拿去，如果对你有一些帮助，也请给个star哈~~


## 参考资料
- [wepack官方文档](https://webpack.js.org/concepts/)
- [Webpack4不完全迁移指北](https://github.com/dwqs/blog/issues/60)
- [基于 Webpack4 + Vue 的多页应用解决方案](https://www.jianshu.com/p/c52df2689d34)
- [没有了CommonsChunkPlugin，咱拿什么来分包（译）](https://github.com/yesvods/Blog/issues/15)
- [webpack中的hash、chunkhash、contenthash区别](https://juejin.im/post/5a4502be6fb9a0450d1162ed)
- [webpack 4 终于知道「约定优于配置」了](https://zhuanlan.zhihu.com/p/32886546)
- [[webpack] devtool里的7种SourceMap模式是什么鬼？](https://juejin.im/post/58293502a0bb9f005767ba2f)





