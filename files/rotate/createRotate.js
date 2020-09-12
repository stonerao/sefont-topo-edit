function InitRotate(opts) {
    // 传递 图片zip包名， 执行方法名， 大小\
    
return `function () {
    return {
        //组件初始化
        init: function (options) {
            this._super.apply(this, arguments);
        },
        //容器内所有组件加载完成
        allChildrenLoaded: function () {
            var cont_id = "";// 容器ID
            var assetsUrl = "${opts.imgAssets}";
            var config = {
                loading: true, //是否显示 loading ， 默认false
                url: assetsUrl,
                background: {
                    opacity: 0.0,
                }, //背景色和透明度
                camera: {
                    position: [${opts.camera.x}, ${opts.camera.y}, ${opts.camera.z}]
                }, //相机视角和位置
                controls: {
                    //控制器
                    enablePan: false,
                    enableZoom: false,
                    enableRotate: false,
                },
                texture: {
                    
                }
            };

            var INT = new ROTATE_EFFECT();
			INT.init(cont_id, config); //初始化
            INT.render();
            
            const configs = ${opts.data};
            configs.forEach((elem) => {
                INT.addEffect(elem)
            })
			
            var _element = $("#" + cont_id).widget()._element;
            $(_element).on("$destroy", function () {
                //-
                INT.disposeRender();
            });
            
        },
    };
}
    
`
}
module.exports = InitRotate;