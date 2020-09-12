const router = require('koa-router')()


const fs = require('fs');
const path = require('path');
var zipl = require('../utils/zip');


const config = require("../config.js");
const fileUtils = require("../utils/file");
router.prefix('/upload');
// 保存数据 
const baseUrl = path.join(config.__dirname, '/public/images/');
let loadNumber = 0;
async function createFile(file, config) {
    return new Promise((resolve, reject) => {
        // 创建可读流
        const reader = fs.createReadStream(file.path);
        const fileName = `${config.name}_${loadNumber++}.${config.type}`;
        let filePath = baseUrl + fileName;
        // 创建可写流
        const upStream = fs.createWriteStream(filePath);
        // 可读流通过管道写入可写流
        reader.pipe(upStream);
        reader.on("end", () => {
            resolve({
                url: filePath,
                name: fileName
            })
        })

    })
}


router.post('/loadImages', async (ctx, next) => {

    const file = ctx.request.files.file; // 获取上传文件 

    if (!file) {
        ctx.body = {
            code: 400
        };
        return false;
    };
    const fileOpts = fileUtils.getFileType(file.name);

    await createFile(file, fileOpts).then((opts, name) => {

        ctx.body = {
            code: 200,
            url: "/images/" + opts.name,

        }
    })
})

const initRotate = require('../files/rotate/createRotate');
function wireFile(filePath, val) {
    fs.writeFile(filePath, val, { 'flag': 'a' }, function (err) {
        if (err) {
            throw err;
        }
        // 写入成功后读取测试
        fs.readFile(filePath, 'utf-8', function (err, data) {
            if (err) {
                throw err;
            }
        });
    });
}
// 下载包
router.post('/downImages', async (ctx, next) => {
    const now = Date.now();
    const files = [];
    const body = ctx.request.body;
    const names = [];
    if (body.data && Array.isArray(body.data)) {
        files.push(...body.data)
        body.data.forEach(elem => {
            var file = path + '/public' + elem;
            const n = file.split("/").pop();

            !names.includes(n) && names.push(n);
        })
    }
    const zr = path.join(config.__dirname, '/public/down/zhuru' + now + '.js')

    // 生成代码注入
    const vals = initRotate({
        data: body.configs,
        imgAssets: 'attach/img_' + now + "/",
        imgs: names,
        camera: JSON.parse(body.camera) || { x: 0, z: 0, y: 0 }
    })
    wireFile(zr, vals);
    // 压缩JS文件 
    // 压缩图片
    const imgUrl = '/down/img_' + now + '.zip'
    await zipl.zips({
        output: path.join(config.__dirname, '/public' + imgUrl),
        entry: files
    }).then(async (e) => {
        // 压缩文件  
        const fileNames = '/down/rotate_' + now + '.zip';
        await zipl.zips({
            output: path.join(config.__dirname, '/public' + fileNames),
            entry: [
                imgUrl,
                '/files/rotate/createInit.js',
                // '/down/zhuru' + now + '.js'
            ]
        }).then(() => {
            ctx.body = {
                code: 200,
                url: fileNames
            }
        })
    })



})

module.exports = router
