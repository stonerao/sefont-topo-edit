const router = require('koa-router')();
var fs = require('fs');

const Babels = require("@babel/standalone");

const config = require("../config.js");
// 生成文件的方法
var createFly = require('../files/createFly');
var initJS = require('../files/createInit');
var initTexts = require('../files/createText');

var JSZip = require('jszip');
var fileDir = './public/down/';
router.get('/', async (ctx, next) => {
  const components = [];
  const blacklist = ['lib', 'config'];
  const files = fs.readdirSync('./public');
  files.forEach(function (item, index) {
    let stat = fs.lstatSync("./public/" + item)
    if (stat.isDirectory() === true && blacklist.indexOf(item) == -1) {
      components.push(item)
    }
  })
  await ctx.render('index', {
    title: '多功能图形编辑!',
    list: []
  })
})

router.get('/list', async (ctx, next) => {

  const components = [];
  const blacklist = ['lib', 'config'];
  const files = fs.readdirSync('./public/items');
  files.forEach(function (item, index) {
    let stat = fs.lstatSync("./public/items/" + item)
    if (stat.isDirectory() === true && blacklist.indexOf(item) == -1) {
      components.push({
        name: item,
        url: './items/' + item
      })
    }
  })

  await ctx.render('index', {
    title: '列表',
    list: components
  })
})
router.post('/downFly', async (ctx, next) => {
  var zip = new JSZip();
  const body = ctx.request.body;
  var data = body.data;
  const now = Date.now();

  const fly = createFly({
    img: body.img,
    name: 'INIT_FLY_' + now
  });
  const initText = initJS(data, {
    width: body.width || 500,
    height: body.height || 500,
    style: body.style,
    speed: body.speed,
    size: body.size,
    length: body.length,
    dpi: body.dpi,
    color: body.color,
    name: 'INIT_FLY_' + now
  });
  const text = initTexts({
    width: body.width || 500,
    height: body.height || 500
  });
  initText.replace(/\s/g, "")
  const fileName = 'flyInits.js'
  const initFileName = 'init.js'
  const fileUrl = fileDir + now + '.zip';
  zip.file(initFileName, initText);
  zip.file(fileName, fly);
  zip.file('注意事项.text', text);
  // 压缩
  zip.generateAsync({
    // 压缩类型选择nodebuffer，在回调函数中会返回zip压缩包的Buffer的值，再利用fs保存至本地
    type: "nodebuffer",
    // 压缩算法
    compression: "DEFLATE",
    compressionOptions: {
      level: 9
    }
  }).then(function (content) {
    let zip = fileName + '.zip';
    // 写入磁盘

    fs.writeFile(fileUrl, content, function (err) {
      if (!err) {

      } else {
        console.log(zip + '压缩失败');
      }
    });
  });
  ctx.body = {
    url: '/down/' + now + '.zip',
    data: ctx.request.body.data
  }
})

router.get('/es6', async (ctx, next) => {

  const buffer = fs.readFileSync(config.__dirname+"/public/es/es6.js");
  var input = 'const getMessage = () => "Hello World";';
 
  var output = Babels.transform(String(buffer), { presets: ['es2015','env'] }).code;
 
  ctx.body = {
    title: 'koa2 json'
  }
})

module.exports = router