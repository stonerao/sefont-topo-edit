const fs = require("fs");
const path = require("path");
let join = require('path').join;
const deleteFile = function (url) {
    var files = [];
    //判断给定的路径是否存在
    if (fs.existsSync(url)) {
        //返回文件和子目录的数组
        files = fs.readdirSync(url);
        files.forEach(function (file, index) {
            // var curPath = url + "/" + file;
            var curPath = path.join(url, file);
            //fs.statSync同步读取文件夹文件，如果是文件夹，在重复触发函数
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
                // 是文件delete file
            } else {
                fs.unlinkSync(curPath);
            }
        });
        //清除文件夹
        fs.rmdirSync(url);
    } else {
        console.log("给定的路径不存在，请给出正确的路径");
    }
};
/**

 * 

 * @param startPath  起始目录文件夹路径

 * @returns {Array}

 */

function findSync(startPath) {
    let result = [];
    function finder(path) {
        let files = fs.readdirSync(path);
        files.forEach((val, index) => {
            let fPath = join(path, val);
            let stats = fs.statSync(fPath);
            if (stats.isDirectory()) finder(fPath);
            if (stats.isFile()) result.push(val);
        });
    }
    finder(startPath);
    return result;
}
/**
 * 更具文件名 返回当前文件的名称以及文件类型
 */
function getFileType(name) {
    const names = name.split(".");
    const type = names.pop();
    const fileName = names.join(".");
    return {
        type: type,
        name: fileName
    }
}
module.exports = {
    deleteFile,
    findSync,
    getFileType
}