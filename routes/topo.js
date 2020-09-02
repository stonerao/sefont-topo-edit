const router = require('koa-router')()
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

router.prefix('/topo');
// 保存数据
const fileUrl = './public/down/'
router.post('/saveData', async (ctx, next) => {
    const body = ctx.request.body;
    let bodys = {
        code:400
    };
    if (body.hasOwnProperty('data')) {
        // 写入一个json文件中 并且提供下载路径
        const now = Date.now();
        const url = fileUrl + `TOPO_${now}.json`;
        await fs.writeFile(url, body.data, (err) => {
            if (err) {
                return console.log(err);
            }
            
        }) 
        bodys = {
            code:200,
            url: '/down/' + `TOPO_${now}.json`
        }

    };
    ctx.body = bodys;
})

module.exports = router
