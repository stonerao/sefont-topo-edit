// - 全局对象 - 是否支持webgl
window._isSupportWebGL = -1;
/**
 * [detector 判断是否支持webgl]
 * @return   {[boolean]}   [true/false]
 */
function detector() {
    if (window._isSupportWebGL !== -1) { // 初始化后直接取值
        return window._isSupportWebGL;
    }
    try { // 是否支持webgl
        window._isSupportWebGL = !!window.WebGLRenderingContext
            && !!document.createElement('canvas').getContext('webgl');
        return window._isSupportWebGL;
    } catch (e) {
        window._isSupportWebGL = false;
        return window._isSupportWebGL;
    }
}
detector();

/**
 * [EffectRender 渲染器]
 * @Author   ZHOUPU
 */
function EffectRender(config) {
    this.scene;
    this.camera;
    this.renderer;
    this.controls;

    this.clock;
    this.width;
    this.height;
    this.composer;

    this.GId = '';
    this.container;
    this.parentCont;

    this.bgTxue = {}; // 背景纹理

    this.animateArr = [];
    this.isCtrUpdate = true;

    this.hasComposer = false;

    this.df_Raycaster = null;
    this.df_Mouse = null;

    this.eventObj = {
        click: [],
        move: [],
        key: []
    }
    this.eventArray = [];

    /**
     * [DefaultConfig 默认配置项]
     * @type {Object}
     */
    const DefaultConfig = {
        cts: '', // 容器dom 或id
        background: {
            color: '#ffffff', opacity: 0, type: 'cubSky' // type: shpereSky-天空球,cubSky-天空盒
        },
        camera: {
            fov: 45, near: 8, far: 10000, position: [0, 1024, 256], ratio: 1
        },
        controls: {
            target: { x: 0, y: 0, z: 0 }, // 中心点
            enablePan: true, // 平移  
            enableZoom: true, // 缩放  
            enableRotate: false, // 旋转
            enableDamping: true, //是否阻尼
            dampingFactor: 0.04, //阻尼系数
            panSpeed: 0.02, //平移系数
            zoomSpeed: 0.1, //缩放系数
            rotateSpeed: 0.01, //旋转系数
            distance: [32, 2048], //缩放距离区间
            polarAngle: [0, Math.PI * 0.5], //上下旋转区间 *0.5
            azimuthAngle: [-Infinity, Infinity], //左右旋转区间
        },
        light: {
            isHemisphere: true,  // 半球光
            isDirectional: true,  // 方向光
            Ambient: { // 环境光
                color: '#7E7E7E', strength: 0.8
            },
            hemisphere: {
                color: '#A3A3A3', groundColor: '#A3A3A3', strength: 0.6, position: [0, 0, 0]
            },
            directional: {
                color: '#FFFFFF', strength: 1.0, position: [120, 0, 60], shadow: true
            },
        },
        texture: {}, // 纹理
        composer: {  // 后期处理
            isBloom: false, // 是否开启辉光
            bloomThreshold: 0.2, // 辉光亮度阀值，颜色亮度大于阀值起效
            bloomStrength: 0.05, // 辉光强度
            bloomRadius: 0, // 辉光半径

            isFocus: false, // 是否径向模糊
            focusVal: 0.01, // 径向模糊值
            waveFactor: 0.0000000, //模糊系数

            isAntialias: false, // 是否开启 smaa 、 ssaa 抗锯齿
            antialiasType: 'ssaa', // smaa 、 ssaa 抗锯齿 ssaa-硬件要求高
            antialiasLevel: 2, // ssaa抗锯齿级别
        }
    };

    function renderers() {
        (function Animations() {
            if (IsInit) {
                dfRaf = window.requestAnimationFrame(Animations);
                var delta = _that.clock.getDelta();
                if (delta < 0.1) _that.animation(delta);

                _that.isCtrUpdate && _that.controls.update();

                if (_that.hasComposer) {
                    _that.composer.render(delta);
                } else {
                    _that.renderer.render(_that.scene, _that.camera);
                }
            } else {
                dfRaf && window.cancelAnimationFrame(dfRaf);

                _that.renderer.dispose();
                _that.renderer.forceContextLoss();
                _that.renderer.domElement = null;

                _that.disposeObj(_that.scene);
                _that.container.remove();
                _that.disposePms();
            }
        })();
    }

    // 是否初始化完成
    var IsInit = false, _that = this, dfRaf;
    this.parentCont = this.parseCts(config.cts);
    if (_isSupportWebGL && this.parentCont != null) {
        this.GId = THREE.Math.generateUUID();
        this.container = this.creatContainer(`${this.parentCont.attr('id')}_${this.GId}`);
        this.parentCont.html(this.container);

        this.config = $.extend(true, {}, DefaultConfig, config);
        this.loadTexture(this.config.texture);

        this.initiate();
        IsInit = true;
        window.requestAnimationFrame(() => {
            renderers();
        });
    } else {
        this.Result = 'error! Not Support WebGL!';
    }

    this.disposeRender = function () {
        if (IsInit && this.testing()) {
            IsInit = false;
        }
    };

}

Object.assign(EffectRender.prototype, {

    addEffect: function (eftObj) {
        this.scene.add(eftObj.group);
        this.onAnimate(eftObj.animate);
        if (this.isFunction(eftObj.onClick)) {
            this.eventObj.click.push({
                uuid: eftObj.group.uuid,
                func: eftObj.onClick
            })
        }
        if (this.isFunction(eftObj.onMove)) {
            this.eventObj.move.push({
                uuid: eftObj.group.uuid,
                func: eftObj.onMove
            })
        }
        // 键盘
        if (this.isFunction(eftObj.onKey)) {
            this.eventObj.key.push(eftObj.onKey)
        }
    },

    onAnimate: function (func) {
        this.isFunction(func) && this.animateArr.push(func);
    },

    unAnimate: function (func) {
        this.animateArr = this.animateArr.filter(item => item !== func);
    },

    animation: function (dt) {
        for (var i = 0; i < this.animateArr.length; i++) {
            this.animateArr[i](dt, this.clock);
        }
    },

    initiate: function () {
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        var wh = this.getWH();
        this.width = wh.w;
        this.height = wh.h;

        var cm = this.config.camera,
            bg = this.config.background;

        // - background
        if (bg.type === 'shpereSky' && this.bgTxue._shpereSky) {
            // this.bgTxue._shpereSky.userData = {isUpdate: true, speed: 0.04, isRotate: true};
            this.bgTxue._shpereSky.isSphereTexture = true;
            this.scene.background = this.bgTxue._shpereSky;
        } else if (bg.type === 'cubSky' && this.bgTxue._cubSky) {
            // this.bgTxue._cubSky.userData = {isUpdate: true, speed: 0.04, isRotate: true};
            this.scene.background = this.bgTxue._cubSky;
        }

        // - camera
        // this.camera = new THREE.PerspectiveCamera(cm.fov, wh.w / wh.h, cm.near, cm.far);
        this.camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);
        // this.camera.position.set(cm.position[0], cm.position[2], cm.position[1]);
        // this.camera.lookAt(this.scene.position);

        // - renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setClearColor(bg.color, bg.opacity);
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(1);
        this.container.append($(this.renderer.domElement));

        //- controls
        this.controls = new THREE.OrbitControls(this.camera, this.container[0]);
        this.setControls(this.controls, this.config.controls);
        this.controls.target.copy(this.config.controls.target);

        // - lights
        this.setLight(this.scene, this.config.light);

        // - composer
        this.effectComposer();

        this.df_Raycaster = new THREE.Raycaster();
        this.df_Mouse = new THREE.Vector2();
        this.renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
        this.renderer.domElement.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false);

        window.addEventListener("keydown", this.keyDownWalk.bind(this), false);
        window.addEventListener("keyup", this.keyUpWalkStop.bind(this), false);
    },
    keyDownWalk(event) {
        this.toKeyControl(event.keyCode, true);
    },
    keyUpWalkStop(event) {
        this.toKeyControl(event.keyCode, false);
    },
    toKeyControl(code, state = false) {
        this.eventObj.key.forEach(func => {
            func(code, state);
        })
    },
    // mouse event
    onDocumentMouseMove(event) {
        event.preventDefault();
        this.df_Mouse.x = (event.layerX / this.width) * 2 - 1;
        this.df_Mouse.y = -(event.layerY / this.height) * 2 + 1;
        this.df_Raycaster.setFromCamera(this.df_Mouse, this.camera);
        var intersects = this.df_Raycaster.intersectObjects(this.eventArray);
        if (intersects.length != 0) {
            const obj = intersects[0].object;
            // if ()
            this.eventObj.move.forEach((e) => {
                if (e.uuid === obj.__uuid) {
                    e.func(intersects[0], event);
                }
            })
        } else { // 单击回调
            
        }
    },
    onDocumentMouseDown(event) {
        event.preventDefault();
        this.df_Mouse.x = (event.layerX / this.width) * 2 - 1;
        this.df_Mouse.y = -(event.layerY / this.height) * 2 + 1;
        this.df_Raycaster.setFromCamera(this.df_Mouse, this.camera);
        var intersects = this.df_Raycaster.intersectObjects(this.eventArray);
        if (intersects.length != 0) {
            const obj = intersects[0].object;
            // if ()
            this.eventObj.click.forEach((e) => {
                if (e.uuid === obj.__uuid) {
                    e.func(intersects[0], event);
                }
            })
        } else { // 单击回调

        }

    },
    effectComposer: function () {
        var cps = this.config.composer;
        this.hasComposer = cps.isAntialias || cps.isFocus || cps.isBloom;
        if (!this.hasComposer) return;

        // - post composer
        var renderScene = new THREE.RenderPass(this.scene, this.camera);
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.renderTarget1.stencilBuffer = true;
        this.composer.renderTarget2.stencilBuffer = true;
        this.composer.setSize(this.width, this.height);
        this.composer.addPass(renderScene);

        //- 抗锯齿
        if (cps.isAntialias) {
            this.composer.addPass(this.antialiasPass(cps.antialiasType, cps.antialiasLevel));
        }
        // - 径向模糊
        if (cps.isFocus) {
            var focusPass = new THREE.ShaderPass(THREE.FocusShader);
            focusPass.uniforms["screenWidth"].value = this.width;
            focusPass.uniforms["screenHeight"].value = this.height;
            focusPass.uniforms["sampleDistance"].value = cps.focusVal;
            focusPass.uniforms["waveFactor"].value = cps.waveFactor;
            this.composer.addPass(focusPass);
        }
        // - 辉光
        if (cps.isBloom) {
            var bloomPass = new THREE.UnrealBloomPass(
                { x: this.width, y: this.height },
                cps.bloomStrength,
                cps.bloomRadius,
                cps.bloomThreshold
            );
            this.composer.addPass(bloomPass);
        }

        // - 合并
        var copyPass = new THREE.ShaderPass(THREE.CopyShader);
        copyPass.renderToScreen = true;
        this.composer.addPass(copyPass);
    },

    antialiasPass: function (type, level) {
        var antialias;
        if (type === 'smaa') {
            var pxr = this.renderer.getPixelRatio();
            antialias = new THREE.SMAAPass(this.width * pxr, this.height * pxr);
            antialias.renderToScreen = true;
        } else {
            antialias = new THREE.SSAARenderPass(this.scene, this.camera);
            antialias.unbiased = false;
            antialias.sampleLevel = level;
        }
        return antialias;
    },

    // --------
    loadTexture: function (texture) {
        var tph = texture.txuePath || '',
            bg = texture.background;
        if (!bg) return;
        if (bg.shpereSky) {
            var txueLoader = new THREE.TextureLoader();
            this.bgTxue._shpereSky = txueLoader.load(tph + bg.shpereSky);
        }
        if (bg.cubSky) {
            var cTextureLoader = new THREE.CubeTextureLoader();
            this.bgTxue._cubSky = cTextureLoader.load([
                tph + bg.cubSky.px, tph + bg.cubSky.nx, tph + bg.cubSky.py,
                tph + bg.cubSky.ny, tph + bg.cubSky.pz, tph + bg.cubSky.nz
            ]);
        }
    },

    setControls: function (controls, opts) {
        controls.enablePan = opts.enablePan;
        controls.enableKeys = opts.enablePan;
        controls.enableZoom = opts.enableZoom;
        controls.enableRotate = opts.enableRotate;

        controls.enableDamping = opts.enableDamping;
        controls.dampingFactor = opts.dampingFactor;

        controls.panSpeed = opts.panSpeed;
        controls.zoomSpeed = opts.zoomSpeed;
        controls.rotateSpeed = opts.rotateSpeed;

        controls.minDistance = opts.distance[0];
        controls.maxDistance = opts.distance[1];
        controls.minPolarAngle = opts.polarAngle[0];
        controls.maxPolarAngle = opts.polarAngle[1];
        controls.minAzimuthAngle = opts.azimuthAngle[0];
        controls.maxAzimuthAngle = opts.azimuthAngle[1];
    },

    setControlsOff: function (controls) {
        controls.enablePan = false;
        controls.enableKeys = false;
        controls.enableZoom = false;
        controls.enableRotate = false;
    },

    setLight: function (scene, opts) {
        scene.add(new THREE.AmbientLight(opts.Ambient.color, opts.Ambient.strength));
        if (opts.isHemisphere) {
            var lh = opts.hemisphere,
                hLight = new THREE.HemisphereLight(lh.color, lh.groundColor, lh.strength);
            hLight.position.set(lh.position[0], lh.position[2], lh.position[1]);
            scene.add(hLight);
        }
        if (opts.isDirectional) {
            var ld = opts.directional,
                dlight = new THREE.DirectionalLight(ld.color, ld.strength);
            dlight.position.set(ld.position[0], ld.position[2], ld.position[1]);
            dlight.castShadow = ld.shadow;
            this.directLight = dlight;
            scene.add(dlight);
        }
    },

    testing: function () {
        return this.renderer instanceof THREE.WebGLRenderer;
    },

    disposePms: function () {
        Object.keys(this.bgTxue).forEach((item) => {
            this.bgTxue[item].dispose && this.bgTxue[item].dispose();
            this.bgTxue[item] = null;
        });
        Object.keys(this.allTxues).forEach((item) => {
            this.allTxues[item].dispose && this.allTxues[item].dispose();
            this.allTxues[item] = null;
        });
        this.animateArr.splice(0, this.animateArr.length);
    },

    disposeObj: function (obj) {
        if (obj instanceof THREE.Object3D) {
            this.objectTraverse(obj, function (child) {
                if (child.geometry) {
                    if (child.geometry._bufferGeometry) {
                        child.geometry._bufferGeometry.dispose();
                    }
                    child.geometry.dispose();
                    child.geometry = null;
                }

                if (this.isArray(child.material)) {
                    child.material.forEach(function (mtl) {
                        this.disposeMaterial(mtl);
                    });
                } else if (child.material) {
                    this.disposeMaterial(child.material);
                }
                child.material = null;

                if (child.parent) child.parent.remove(child);
                child = null;
            });
        }
    },

    disposeMaterial: function (mtl) {
        Object.keys(mtl).forEach((key) => {
            if (!(mtl[key] && this.isFunction(mtl[key].dispose))
                && key !== 'uniforms') {
                if (key === 'program' || key === 'fragmentShader' || key === 'vertexShader') {
                    mtl[key] = null;
                }
                return;
            }

            if (key === 'uniforms') {
                Object.keys(mtl.uniforms).forEach((i) => {
                    let uniform = mtl.__webglShader ? mtl.__webglShader.uniforms[i] : undefined;
                    if (uniform && uniform.value) {
                        if (uniform.value.dispose) { uniform.value.dispose(); }
                        uniform.value = null;
                    }
                    uniform = mtl.uniforms[i];
                    if (uniform.value) {
                        if (uniform.value.dispose) { uniform.value.dispose(); }
                        uniform.value = null;
                    }
                });
            } else {
                mtl[key].dispose();
                mtl[key] = null;
            }
        });

        mtl.dispose();
        mtl = null;
    },

    objectTraverse: function (obj, callback) {
        if (!this.isFunction(callback)) return;
        var children = obj.children;
        for (var i = children.length - 1; i >= 0; i--) {
            this.objectTraverse(children[i], callback);
        }
        callback(obj);
    },

    isArray: function (o) {
        return Object.prototype.toString.call(o) == '[object Array]';
    },

    isFunction: function (a) {
        return Object.prototype.toString.call(a) === '[object Function]';
    },

    toFunction: function (a) {
        var b = Object.prototype.toString.call(a) === '[object Function]';
        return b ? a : function (o) { };
    },

    getWH: function () {
        return { w: this.container.width(), h: this.container.height() };
    },

    parseCts: function (cts) {
        var $dom = (typeof cts == 'object') ? $(cts) : $('#' + cts);
        if ($dom.length <= 0) return null;
        return $dom;
    },

    creatContainer: function (id) {
        var containers = $('<div></div>');
        containers.css("cssText", "height:100%;width:100%;overflow:hidden;position:relative !important");
        containers.attr('id', id);
        return containers;
    }

});

// export { EffectRender }