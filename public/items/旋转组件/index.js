/**
* 组件业务逻辑
*/
const _form = (id) => {
    return {
        id: id,
        type: "plane",
        img: "",
        size: { x: 32, y: 32, z: 32 }, // 大小
        rotation: { x: 0, y: 0, z: 0 }, // 旋转
        position: { x: 0, y: 0, z: 0 }, // 位置
        rotate: { x: 0, y: 0, z: 0 },// 每帧的运动量
        color: "",// 颜色 
        track: {
            fontSize: 14,
            radius: 120,
            lineState: false,
            lineColor: "rgba(255,255,255,1)",
            lineCenter: false,
            isCurve: false,
            curveHeight: 10,
            isFly: false,
            flyColor: 'rgba(255,0,0,1)',
            flySpeed: 1,
            flyDpi: 1,
            flySize: 22,
            isClick: false,// 是否接受被点击
        },
        material: [
            {
                name: "depthWrite",
                value: true,
                values: [
                    { name: "开启", value: true },
                    { name: "关闭", value: false }]
            },
            {
                name: "depthTest",
                value: true,
                values: [
                    { name: "开启", value: true },
                    { name: "关闭", value: false }]
            },
            {
                name: "side",
                value: 2,
                values: [
                    { name: "FrontSide", value: 0 },
                    { name: "BackSide", value: 1 },
                    { name: "DoubleSide", value: 2 }]
            },
            {
                name: "blending",
                value: 1,
                values: [
                    { name: "NoBlending", value: 0 },
                    { name: "NormalBlending", value: 1 },
                    { name: "AdditiveBlending", value: 2 },
                    { name: "SubtractiveBlending", value: 3 },
                    { name: "MultiplyBlending", value: 4 },
                ]
            }
        ]
    };
}
var VM = new Vue({
    el: "#app",
    data: {
        visible: false,
        isAdd: true,// true 添加 false修改
        configs: [],
        types: [
            {
                name: "平面",
                value: "plane",
                id: 0
            },
            {
                name: "精灵图",
                value: "sprite",
                id: 1
            },
            {
                name: "球体",
                value: "ball",
                id: 2
            },
            {
                name: "轨道",
                value: "track",
                id: 3
            }
        ], // 组件类型
        trackConfig: {
            lineState: false,
            lineColor: "",
            size: 32,
            radius: 128,
            lineCenter: true
        },
        chilData: "张三,李四,李四,李四,李四",
        form: _form(0),
        formUUID: 0

    },
    methods: {
        handleClose(done) {
            this.$confirm('确认关闭？')
                .then(_ => {
                    done();
                })
                .catch(_ => { });
        },
        // 添加组件 显示弹框
        addCom() {
            this.isAdd = true;
            this.visible = true;

            this.form = _form(this.formUUID++);
        },
        handelConfig(config) {
            const opts = {};

            opts['id'] = config['id'];
            opts['type'] = config['type'];
            opts['color'] = config['color'];
            opts['img'] = config['img'];
            opts['material'] = {};

            const vecs = ['position', 'rotation', 'rotate', 'size'];
            vecs.forEach(elem => {
                if (config[elem]) {
                    opts[elem] = {};
                    for (const key in config[elem]) {
                        if (config[elem].hasOwnProperty(key)) {
                            const val = parseFloat(config[elem][key]);
                            opts[elem][key] = isNaN(val) ? 0 : val;;
                        }
                    }
                }
            });

            for (const key in config.material) {
                if (config.material.hasOwnProperty(key)) {
                    const elem = config.material[key];
                    opts.material[elem.name] = elem.value;
                }
            }

            if (opts['type'] == "track") {
                const track = this.form.track;
                // c处理数据 
                const data = this.chilData.split(",").map(e => ({ name: e }));

                track.data = data;

                opts['track'] = track;
            }

            return opts
        },
        onSubmit() {
            if (!this.form.type) return false;
            if (this.form.type == "track" && !this.chilData) return false;
            this.configs.push(JSON.parse(JSON.stringify(this.form)));
            const opts = this.handelConfig(this.form);
            INT.addEffect(opts);
            this.visible = false;
        },
        handleAvatarSuccess(res, file) {
            this.form.img = res.url;
        },
        beforeAvatarUpload(file) {
            const isJPG = file.type === 'image/jpeg';
            const isPNG = file.type === 'image/png';
            const isLt2M = file.size / 1024 / 1024 < 2;


            return true
        },
        editItem(Config) {
            this.isAdd = false;
            this.visible = true;
            this.form = Config;

        },
        editItemEffect() {
            const opts = this.handelConfig(this.form);
            INT.setEffect(opts);
            this.visible = false;
        },
        deleItem(Config, id) {
            this.configs = this.configs.filter(x => x.id != id);
            INT.delEffect(id);
        },
        exports() {
            // 一键导出
            const imgs = this.configs.map(e => e.img);
            const datas = this.configs.map(x=>{
                const opts = this.handelConfig(x);
                const img = opts.img.split('/');
                if (img.length>1){
                    opts.img = img.pop();
                }
                return opts;
            }) 
            $.ajax({
                type: "post",
                url: "/upload/downImages",
                dataType: 'json',
                data: {
                    data: imgs,
                    configs: JSON.stringify(datas),
                    type: 'donwImg',
                    camera:JSON.stringify(INT.camera.position)
                },
                success: function (data) {
                    if (data.url && data.code ==200){
                       setTimeout(() => {
                           window.open(data.url);
                       }, 2000);
                    }
                }
            })
        }
    },
    watch: {

    },
})