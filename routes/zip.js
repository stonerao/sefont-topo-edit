const router = require('koa-router')();

const fs = require('fs');
const path = require('path');
const fileUtils = require("../utils/file");
const config = require("../config.js");
const Babels = require("@babel/standalone");
var AdmZip = require('adm-zip'); // 解压
var JSZip = require('jszip'); // 压缩

router.prefix('/zips');
const baseUrl = path.join(config.__dirname, '/public/es/');
async function createFile(file) {
    return new Promise((resolve, reject) => {
        // 创建可读流
        const reader = fs.createReadStream(file.path);
        let filePath = baseUrl + `${file.name}`;
        // 创建可写流
        const upStream = fs.createWriteStream(filePath);
        // 可读流通过管道写入可写流
        reader.pipe(upStream);
        reader.on("end", () => {
            resolve({
                url: filePath,
                name: file.name
            })
        })

    })
}
const jzipOpt = {
    // 压缩类型选择nodebuffer，在回调函数中会返回zip压缩包的Buffer的值，再利用fs保存至本地
    type: "nodebuffer",
    // 压缩算法
    compression: "DEFLATE",
    compressionOptions: {
        level: 9
    }
};
function getEs5(ctx) {
    return Babels.transform(String(ctx), {
        presets: ['es2015', 'env', 'stage-3']
    }).code;
}
router.post('/upload', async (ctx, next) => {
    // 上传单个文件
    const file = ctx.request.files.file; // 获取上传文件
    if (!file) {
        ctx.body = {
            code: 400
        };
        return false;
    };
    const fileOpts = fileUtils.getFileType(file.name);
    const now = Date.now();
    var jzip = new JSZip();
    switch (fileOpts.type) {
        case "zip":
            {
                await createFile(file).then((opts, name) => {
                    var zip = new AdmZip(opts.url);
                    var zipEntries = zip.getEntries();
                    zipEntries.forEach(function (zipEntry) {

                        if (zipEntry.isDirectory == false) {
                            const name = zipEntry.name;
                            const fileType = name.split(".").pop();

                            if (fileType == "js") {
                                const ctx = String(zipEntry.getData());
                                // 转换ES5
                                var output = Babels.transform(ctx, { presets: ['es2015', 'env'] }).code;
                                jzip.file(name, output);
                            }
                        }
                    });
                    jzip.generateAsync(jzipOpt).then((content) => {
                        let zip = now + '.zip';
                        fs.writeFile(baseUrl + now + ".zip", content, (err) => {
                            if (!err) {
                                ctx.body = {
                                    code: 500
                                }
                                setTimeout(() => {
                                    fs.unlinkSync(opts.url, () => { })
                                }, 100);
                            } else {
                                console.log(zip + '压缩失败');
                            }
                        });
                    });
                }).then(res => {
                    const file = "/es/" + now + ".zip"
                    ctx.body = {
                        code: 200,
                        url: file
                    }
                    setTimeout(() => {
                        fs.unlinkSync(baseUrl + now + ".zip", function () { err })
                    }, 15000);
                })
            }
            break;
        case "js":
            {
                // 创建可读流
                const reader = fs.createReadStream(file.path);
                const name = `${fileOpts.name}_${now}.${fileOpts.type}`;
                const url = `/es/${name}`
                let filePath = path.join(__dirname, '../public/es/') + name;
                // 创建可写流
                const upStream = fs.createWriteStream(filePath);
                // 可读流通过管道写入可写流
                await reader.pipe(upStream);
                reader.on("data", function (d) {
                    // console.log(d)
                    console.log(String(d))
                    var output = getEs5(d);
                    console.log(output)
                })
                fs.readFile(filePath, 'utf8', function (err, d) {
                    // console.log("start");
                    // var output = getEs5(String(d));
                    // console.log(output)
                    /* fs.writeFile(path.join(__dirname, '../public/es/') + fileOpts.name + "." + fileOpts.type, data, 'utf8', (err) => {
                        if (err) throw err;
                        console.log('success done');
                    }); */
                })
                ctx.body = {
                    code: 200
                };
            }
            break;
        default: {
            ctx.body = {
                code: 400,
                msg: '文件格式错误'
            };
        }
            break;
    }

})
module.exports = router