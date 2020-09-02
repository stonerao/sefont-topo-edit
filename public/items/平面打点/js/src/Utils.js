var THREE_UTILS = {
    getBase64(url, callback) {
        //通过构造函数来创建的 img 实例，在赋予 src 值后就会立刻下载图片，相比 createElement() 创建 <img> 省去了 append()，也就避免了文档冗余和污染
        var Img = new Image();
        var dataURL = '';

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
    },
    round(val, k = 1) {
        const t = Math.pow(10, k) / 10;
        return Math.round(val * t) / t;
    },
    smoothstep(x, min, max) {
        if (x <= min) return 0;
        if (x >= max) return 1;
        x = (x - min) / (max - min);
        return x;
    },
    // - dispose
    // - 清除util
    disposeUtil() {
        for (const k in this.dft.txues) {
            this.dft.txues[k].dispose();
        }
    },
    /**
     * [disposeObj 删除组合节点]
     * @Author   ZHOUPU
     * @DateTime 2019-05-14
     * @param    {[object]}   obj [组合节点]
     * @return   {[type]}       [description]
     */
    disposeObj(obj) {
        if (obj instanceof THREE.Object3D) {
            this.objectTraverse(obj, Utils.disposeNode.bind(Utils));
        }
    },
    /**
     * [disposeNode 删除单个节点]
     * @Author   ZHOUPU
     * @DateTime 2019-05-14
     * @param    {[object]}   node [节点对象]
     * @return   {[type]}        [description]
     */
    disposeNode(node) {
        if (Array.isArray(node._txueArr)) {
            for (let i = 0; i < node._txueArr.length; i++) {
                node._txueArr[i].dispose();
                node._txueArr[i] = null;
            }
            node._txueArr = null;
        }
        this.deleteGeometry(node);
        this.deleteMaterial(node);
        node.dispose && node.dispose();
        if (node.parent) node.parent.remove(node);
        node = null;
    },
    /**
     * [deleteGeometry 删除几何体]
     * @Author   ZHOUPU
     * @DateTime 2019-05-14
     * @param    {[object]}   node [节点对象]
     * @return   {[type]}        [description]
     */
    deleteGeometry(node) {
        if (node.geometry && node.geometry.dispose) {
            if (node.geometry._bufferGeometry) {
                node.geometry._bufferGeometry.dispose();
            }

            node.geometry.dispose();
            node.geometry = null;
        }
    },
    /**
     * [deleteMaterial 删除材质，多材质]
     * @Author   ZHOUPU
     * @DateTime 2019-05-14
     * @param    {[object]}   node [节点对象]
     * @return   {[type]}        [description]
     */
    deleteMaterial(node) {
        if (Array.isArray(node.material)) {
            node.material.forEach(Utils.disposeMaterial.bind(Utils));
        } else if (node.material) {
            this.disposeMaterial(node.material);
        }
        node.material = null;
    },
    /**
     * [disposeMaterial 销毁材质]
     * @Author   ZHOUPU
     * @DateTime 2018-08-02
     * @param    {[object]}   obj      [THREE的材质对象]
     * @return   {[void]}
     */
    disposeMaterial(mtl) {
        if (mtl.uniforms) {
            for (const i in mtl.uniforms) {
                let uniform = mtl.__webglShader ? mtl.__webglShader.uniforms[i] : undefined;
                if (uniform && uniform.value) {
                    uniform.value.dispose && uniform.value.dispose();
                    uniform.value = null;
                }
                uniform = mtl.uniforms[i];
                if (uniform.value) {
                    uniform.value.dispose && uniform.value.dispose();
                    uniform.value = null;
                }
            }
        }
        if (mtl.map) {
            mtl.map.dispose();
            mtl.map = null;
            if (mtl.__webglShader) {
                mtl.__webglShader.uniforms.map.value.dispose();
                mtl.__webglShader.uniforms.map.value = null;
            }
        }

        mtl.dispose();
        mtl = null;
    },
    /**
     * [objectTraverse 遍历对象树，由叶到根]
     * @Author   ZHOUPU
     * @DateTime 2018-08-02
     * @param    {[object]}   obj      [THREE的object3D对象]
     * @param    {Function} callback [回调函数，返回遍历对象]
     * @return   {[void]}
     */
    objectTraverse(obj, callback) {
        if (!Utils.isFunction(callback)) return;
        const {
            children
        } = obj;
        for (let i = children.length - 1; i >= 0; i--) {
            Utils.objectTraverse(children[i], callback);
        }
        callback(obj);
    }
} 