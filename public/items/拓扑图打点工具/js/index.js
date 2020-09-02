/**
 * 页面逻辑
 */
var parms = {
    style: 1,
    speed: 1,
    size: 1,
    color: '#ff0000',
    length: 100,
    dpi: 1
}
var fun = {
    click: function () {
        parms.style = parseInt(parms.style)
        INT.viewLine(parms);
    }
}
var gui = new dat.GUI();
gui.addColor(parms, 'color').name('颜色');
gui.add(parms, 'style', [1, 2, 3]).name('线条样式');
gui.add(parms, 'speed', 0.1, 10, 0.1).name('速度');
gui.add(parms, 'size', 1, 20, 0.5).name('大小');
gui.add(parms, 'dpi', 0.1, 10, 0.1).name('线条密度');
gui.add(parms, 'length', 1, 200, 1).name('长度');


gui.add(fun, 'click').name('渲染');

var VM = new Vue({
    el: '#app',
    data: {
        lines: [],
        active: null,
        width: 0,
        height: 0,
        styles: [1, 2, 3],
        style: 1,
        speed: 2,
        size: 2,
        color: '#ff0000',
        importVisible: false,
        importText: '',
        imgBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABuUlEQVRYR82XPy8EURTFf6fWUlD5k9ALhYLQkkgUJAql6HwFfAQqG6VCQiGR0BIKCaK3ibUVBSX1lSfzZGd3ZmdnZ2Z3XzLF5N177pm59913rkixzGweWAFmgIHgcQifwXMPnEu6aRVWSYZmNghsAevAeJJ9sF8GToCSpI9mPk0JmNkusAkMtRi43uwdOJLkcCJXLAEzuwVm2wxc73YnaS4KK5KAmbmc9ucU3MN8SXJ1E1oNBMzsDRjOObiHq0oaqcUOETCzU2C1oOAe9kzSmn/5JxAU3E7BwT38ni/MPwLBUXvKUO1pebvTMeWOqCfgjkmnvj70FzyBV2A07WdktK9IGpOZLQKXGcHadV9yBA6DVtsuSBa/kiPwAExnQcng++gIFNl4krhVHYFvoC/JsqD9n54g0PUUdL0I94HtgnKcBHvgasDpvOsky4L2F3wrfkmh9/LiUpY00TOXkVO+3buOA03QySs5LEh8UnNWwnG1ElLIUaK0CEXsyTQo4zhZXkR3bFDEjlWzwSRPhRxSwrGyvD5pXR3NagrTD6cbKXRjBTjOPJxG/BGnH5eByZjx/Bm4kHTVarv8BfUiqvAfUSxCAAAAAElFTkSuQmCC'
    },
    methods: {
        updateLine(items) {
            if (!Array.isArray(items)) return;
            this.lines = items.map((elem, i) => {
                return {
                    name: '线条' + elem.id + '-' + elem.data.length,
                    id: elem.id,
                    data: elem.data
                }
            })
            this.active = null;
        },
        selectLine(item) {
            this.active = item.id;
            INT.activeLine(item.id);
        },
        delet(item) {
            INT.removeLine(item.id);
            INT.quitFlyLine();
        },
        exports() {
            const data = INT.saveLine();
            console.log(data);
            $.ajax({
                url: '/downFly',
                type: "POST",
                dataType: 'json',
                data: {
                    data: data,
                    width: this.width,
                    height: this.height,
                    ...parms,
                    img: this.imgBase64
                },
                success: function (data) {
                    var state = confirm('已导出，数据已打印在控制台，是否还需要下载');
                    if (state) {
                        window.open(data.url);
                    }
                }
            });

            localStorage.setItem("lineData", data);

        },
        imports() {
            this.importVisible = true;
        },
        restore() {
            const data = localStorage.getItem('lineData');
            INT.restoreLine(JSON.parse(data));
        },
        viewLine() {
            const opts = {
                style: this.style,
                color: this.color,
                size: this.size,
                speed: this.speed,
                length: 100,
                dpi: 1
            }
            INT.viewLine(opts);
        },
        fileImg(fileinput) {
            const file = fileinput.target;
            // getBase64()
            if (!file.files[0]) return false;
            var dataURL = URL.createObjectURL(file.files[0])    // 创建URL对象

            getBase64(dataURL, (opts) => {
                this.width = opts.width;
                this.height = opts.height;
                INT.setMap(opts)
            })
        },
        filePoint(fileinput) {
            const file = fileinput.target;
            // getBase64()
            if (!file.files[0]) return false;
            var dataURL = URL.createObjectURL(file.files[0])    // 创建URL对象

            getBase64(dataURL, (opts) => {
                this.imgBase64 = opts.img;
                INT.setPointMap(dataURL)
            })
        },
        importBtn(done) {
            this.$confirm('确认关闭？')
                .then(_ => {
                    done();
                })
                .catch(_ => { });

        },
        importsData() {
            try {
                const data = this.importText;
                const jsonData = JSON.parse(data);
                INT.restoreLine(jsonData);
            } catch (err) {
                // 数据错误
                this.$message.error('数据错误');
                console.error(err);
            }
        }
    },
    mounted() {
        var state = localStorage.getItem("state");
        if (state != 'true') {
            alert('一直按照ctrl点击则可生成线条，松开则结束！')
            localStorage.setItem("state", true);
        }
    },
    watch: {

    }
})
function getBase64(url, callback) {
    //通过构造函数来创建的 img 实例，在赋予 src 值后就会立刻下载图片，相比 createElement() 创建 <img> 省去了 append()，也就避免了文档冗余和污染
    var Img = new Image(),
        dataURL = '';
    Img.src = url;
    Img.onload = function () { //要先确保图片完整获取到，这是个异步事件
        var canvas = document.createElement("canvas"), //创建canvas元素
            width = Img.width, //确保canvas的尺寸和图片一样
            height = Img.height;
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(Img, 0, 0, width, height); //将图片绘制到canvas中
        dataURL = canvas.toDataURL('image/png'); //转换图片为dataURL
        callback({
            img: dataURL,
            width: width,
            height: height
        })
    };
}