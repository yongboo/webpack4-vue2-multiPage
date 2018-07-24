// package.json中通过 --BUILD_MODE 指定当前执行的配置文件
const env = process.env.BUILD_MODE.trim();
module.exports = require(`./build/webpack.${env}.js`);
