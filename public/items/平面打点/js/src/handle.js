
// 渲染器
var test = new EffectRender({
    cts: 'canvas-frame',
    background: {
        color: '#ffffff', opacity: 0, type: 'cubSky' // type: shpereSky-天空球,cubSky-天空盒
    },
    texture: {
        txuePath: 'images/', //路径
        background: { //背景

        },
    },
    composer: {
        isBloom: false, // 是否开启辉光
        bloomThreshold: 0.1, // 辉光亮度阀值，颜色亮度大于阀值起效
        bloomStrength: 0.15, // 辉光强度
        bloomRadius: 1, // 辉光半径

        isFocus: false, // 是否径向模糊
        focusVal: 0.0001, // 径向模糊值
        waveFactor: 0.00000001, //模糊系数

        isAntialias: false, // 是否开启 smaa 、 ssaa 抗锯齿
        antialiasType: 'smaa', // smaa 、 ssaa 抗锯齿 ssaa-硬件要求高
        antialiasLevel: 1, // ssaa 抗锯齿级别
    }
});


var topo = new CreateEarth({
    texture: {
        common: {
            img: "images/dd.png"
        }
    },
    events: test.eventArray
});
window.scene = test.scene;
test.addEffect(topo);

/**
* 业务逻辑处理
*/
var VM = new Vue({
    el: "#app",
    data: {
        lines: [
            {
                index: 0,
                name: "测试"
            }
        ]
    },
    methods: {
        // 背景图上传
        bgUpload(fileinput) {
            const file = fileinput.target;
            // getBase64()
            if (!file.files[0]) return false;
            var dataURL = URL.createObjectURL(file.files[0])    // 创建URL对象

            THREE_UTILS.getBase64(dataURL, (opts) => {
                // this.imgBase64 = opts.img;
                topo.createFoot(opts);
            })
        },
        updateLine(line) {
            this.lines = line.map((item, index) => {
                return {
                    index: index,
                    name: "线条" + (index + 1)
                }
            })
        }
    },
    mounted() {
        this.lines = (new Array(20)).fill(1).map((item, index) => {
            return {
                index: index,
                name: "线条" + (index + 1)
            }
        })
    },
});



// gui

const gui = new dat.GUI();

// 操作
const handelOpts = {
    // 上传图片
    upload: () => {
        $("#upload").trigger("click");
    },
    val: 1
}
const handel = gui.addFolder("操作");
handel.open();
handel.add(handelOpts, "upload").name("上传背景图");



