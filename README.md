# webpack4-vue2-multiPage
基于webpack4搭建vue2、vuex多页应用

## 背景

------
最近在对公司的H5项目做重构，涉及到构建优化，由于一些历史原因，项目原先使用的打包工具是饿了么团队开发的cooking（基于webpack2做的封装），目前已停止维护了。如果继续使用，一是项目目前比较庞大，现在的构建方式每次打包耗时较长；二是使用一个已经停止维护的工具本身也有风险；另外因为本次重构还要进行vue1.0到vue2.0的框架升级，涉及到一系列构建插件（vue-style-loader等）的版本兼容问题。折腾了一天也没啥头绪，索性将构建工具直接升级到最新的webpack4，同步搭配vue2和vuex3，一步到位。

由于公司业务需要（SEO、页面主要以投放为主），我们项目采用的还是传统多页面架构，网上基于vue的单页的应用模板，官方提供了vue-cli，第三方的也不少，多页模板可参考的却不多。我前后花了两周左右时间，参考了一些博客资料和文档，整理了这套基于webpack4 + vue2 + vuex3的多页应用模板，记录下来方便自己以后查看，也分享给大家做参考。难免有错漏的地方，欢迎大家批评指正~



## webpack的核心概念

-------
受Parcel等零配置构建工具的启发，webpack4也在向无配置方向努力，做了大量优化，虽然支持零配置的方式，但如果想对模块进行细粒度的控制，仍然需要手动对一些配置项进行设定。但和webpack2相比已经明显简化，上手容易了很多。这里先了解webpack4的几个核心配置项，后面会详细展开：

- mode
- entry
- output
- loader
- plugins
- devServer

接下来我就按照上面的顺序，尽量详细的列出基于webpack4搭建vue2、vuex多页应用的全流程

## mode

------
webpack4新增，指定打包模式，可选的值有：
1. development，开发模式
   - 会将process.env.NODE_ENV设置成development
   - 启用NamedChunksPlugin、NamedModulesPlugin插件
2. production，生产模式
   - 会将process.env.NODE_ENV设置成production
   - 会启用最大化的优化（模块的压缩、串联等）
3. none，这种模式不会进行优化处理

### mode设置的两种方式:
- package.json中通过设置shell命令参数形式定义
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

------
对比多页应用和单页应用（SPA）,最大的不同点，就在于入口的不同
- 多页：最终打包生成多个入口（html页面），一般每个入口文件除了要引入公共的静态文件（js/css）还要另外引入页面特有的静态资源
- 单页：只有一个入口(index.html)，页面中需要引入打包后的所有静态文件，所有的页面内容全由 JavaScript 控制

需要注意的是，上面说的入口指的都是最终打包到dist目录下的html文件，而我们在这里配置的entry其实是需要被html引入的js模块，这些js模块、连同抽离的公共js模块最终还需要利用html-webpack-plugin这个插件组合到html文件中：
```js
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
      title: '列表页'
    },
    {
      page: 'detail',
      title: '详情页'
    }
  ],
  // ...
};
```
最后在配置项中引入相关配置：
```js
module.exports = {
  entry: Entries,
  // ...
   plugins: [
     ...HTMLPlugins
   ]
  // ... 
}
```
关于公共模块的抽离后面会单独介绍
> html-webpack-plugin更多配置信息：[html-webpack-plugin官网](https://github.com/jantimon/html-webpack-plugin)


## output

------
配置出口的文件名和路径：
```js
module.exports = {
  entry: Entries,
  output: {
    filename: 'js/[name].[hash:8].js',
    path: path.resolve(__dirname, '../dist'),
  },
}  
```
这里将生成的js文件挂上8位的MD5戳，以充分利用CDN缓存。
> 关于hash的几种计算方式和区别可以参考 [webpack中的hash、chunkhash、contenthash区别](https://juejin.im/post/5a4502be6fb9a0450d1162ed)

## loader

------
loader 用于对模块的源代码进行转换，负责把某种文件格式的内容转换成 webpack 可以支持打包的模块，例如将sass预处理转换成css模块；将TypeScript转换成JavaScript；或将内联图像转换为 data URL等

### 具体配置：
- webpack.base.js(基础配置文件)
```js
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
// ...
```
babel-loader 还要配合配置 .babelrc 使用，这里配置”stage-2“以使用es7里的高级语法，实测如果不配置就无法处理 对象扩展符、async和await 等新语法特性。

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
  ]
},
// ...
```  













## splitChunks默认配置
```js
module.exports = {
  // webpack 4 移除 CommonsChunkPlugin，取而代之的是两个新的配置项（optimization.splitChunks 和 optimization.runtimeChunk）
  // 通过optimization.runtimeChunk: true选项，webpack会添加一个只包含运行时(runtime)额外代码块到每一个入口。（译注：这个需要看场景使用，会导致每个入口都加载多//一份运行时代码）
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


## 参考资料
- [wepack官方文档](https://webpack.js.org/concepts/)
- [Webpack4不完全迁移指北](https://github.com/dwqs/blog/issues/60)
- [基于 Webpack4 + Vue 的多页应用解决方案](https://www.jianshu.com/p/c52df2689d34)
- [没有了CommonsChunkPlugin，咱拿什么来分包（译）](https://github.com/yesvods/Blog/issues/15)
- [webpack中的hash、chunkhash、contenthash区别](https://juejin.im/post/5a4502be6fb9a0450d1162ed)
- [webpack 4 终于知道「约定优于配置」了](https://zhuanlan.zhihu.com/p/32886546)
- [[webpack] devtool里的7种SourceMap模式是什么鬼？](https://juejin.im/post/58293502a0bb9f005767ba2f)





