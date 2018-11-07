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
  cssPublicPath: '../',
  imgOutputPath: 'img/',
  fontOutputPath: 'font',
  cssOutputPath: './css/styles.css',
  devServerOutputPath: '../dist',
};