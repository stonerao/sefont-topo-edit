function initText(opts) {
    return `
    注意事项，本组件的宽度为${opts.width},高度为${opts.height};
    flyInits.js 文件为代码上传的
    init.js 文件为代码注入的  里面的变量 cont_id  需要填写展示的组件id
    `
}
module.exports = initText;