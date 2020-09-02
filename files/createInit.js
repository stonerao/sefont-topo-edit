function initJS(data = [],opts) {
    return `function () {
    return {
        //组件初始化
        init: function (options) {
            this._super.apply(this, arguments);
        },
        //容器内所有组件加载完成
        allChildrenLoaded: function () {
            var cont_id = ""; // 容器id
            var width = ${opts.width}; // 容器的高
            var height = ${opts.height}; // 容器的宽
            var config = {
                stats: false, //是否显示左上角的性能监测  默认false
                loading: true, //是否显示 loading ， 默认false
                scene: {
                    offset: [0, 0, 0]
                },
                background: {
                    color: '#1E1F22',
                    opacity: 0.0,
                }, //背景色和透明度
                camera: {
                    width: height,
                    height: width
                }, //相机视角和位置
                controls: { //控制器
                    enablePan: false,
                    enableZoom: false,
                    enableRotate: false,
                } 
            };


            INT = new ${opts.name}();
            INT.init(cont_id, config); //初始化
            INT.render();
            // 连线数据
            var data = ${data};
            INT.initFly(data, {
                style: ${opts.style}, // 跑点要是
                color: '${opts.color ||'#fff'}', // 跑点颜色
                size: ${opts.size}, // 点的大小
                speed: ${opts.speed}, // 速度
                length: ${opts.length}, // 长度
                dpi: ${opts.dpi} // 密度
            });
            
            var _element = $("#" + cont_id).widget()._element;
            $(_element).on("$destroy", function () {
                //-
                INT.disposeRender();
            });

        },
    };
}`
}
module.exports = initJS;