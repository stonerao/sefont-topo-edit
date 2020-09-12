var fs = require('fs');
var archiver = require('archiver');

const config = require("../config")
var path = config.__dirname;


const zips = async (opts) => {

    var output = fs.createWriteStream(opts.output);

    var archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    archive.pipe(output);

    opts.entry.forEach(elem => {
        var file = path + '/public' + elem;
        const names = file.split("/").pop();

        archive.append(fs.createReadStream(file), { name: names });
    })

    await archive.finalize();

}
module.exports = {
    zips: zips
}