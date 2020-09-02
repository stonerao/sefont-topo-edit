const router = require('koa-router')()
const fs = require('fs');
const path = require('path');
const fileUtils = require("../utils/file");
const config = require("../config.js");

router.prefix('/users')

router.get('/', function (ctx, next) {
  ctx.body = 'this is a users response!'
})

router.get('/bar', function (ctx, next) {
  ctx.body = 'this is a users/bar response'
})
router.post('/uploadModel', async (ctx, next) => {
  // 上传单个文件
  const file = ctx.request.files.file; // 获取上传文件
  // 创建可读流
  const reader = fs.createReadStream(file.path);
  const nowStr = String(Date.now()).substring(5, 10);
  const url = `/upload/${nowStr}_${file.name}`
  let filePath = path.join(__dirname, '../public/upload/') + `${nowStr}_${file.name}`;
  // 创建可写流
  const upStream = fs.createWriteStream(filePath);
  // 可读流通过管道写入可写流
  await reader.pipe(upStream);

  /* // 2分钟后自动删除
  setTimeout(() => {
    console.log("删除成功", filePath);
    fs.unlinkSync(filePath);
    // 已删除
  }, 1000 * 30 * 1); */
  return ctx.body = {
    code: 200,
    msg: "上传成功",
    url: url
  };
})

router.get('/getModelList', function (ctx, next) {
  const list = fileUtils.findSync(config.__dirname + "/public/upload")
  const items = list.map((name,i) => {
    return {
      url: `/upload/${name}`,
      name: name,
      id:i
    }
  })
  ctx.body = {
    code: 200,
    data: items
  };
})

module.exports = router
