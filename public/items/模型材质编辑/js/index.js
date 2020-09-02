/** @format */
const clone = (data) => {
	return JSON.parse(JSON.stringify(data));
}
var VM = new Vue({
	el: "#app",
	data: {
		gui: null,
		matObjs: {
			opacity: 1,// 透明度
			transparent: true, // 是否开启透明通道
			depthWrite: true,
			depthTest: true,
			color: [255, 255, 255],// 颜色
		},
		folder: [],
		folderObjes: [],
		materials: null,
		modelsVal: '',
		models: []
	},
	mounted() {
		this.gui = new dat.GUI();
		const options = {
			render: () => {
				this.renderFolader();
			}
		}
		this.gui.add(options, "render");
		/* console.log(this.gui);
		var f = this.gui.addFolder('入门');
		console.log(f);
		setTimeout(() => {
			this.gui.removeFolder(f);
		}, 2000); */
		this.getModelList();
	},
	methods: {
		getModelList() {
			$.ajax({
				url: "/users/getModelList",
				type: "get",
				success: (data) => {
					this.models = data.data;
				}
			})
		},
		renderFolader() {
			if (!this.materials) return false;
			if (Array.isArray(this.materials)) {
				this.folderObjes.forEach((obj, i) => {
					const mat = this.materials[i];
					if (!mat) return false;
					Object.keys(obj).forEach(key => {
						if (mat.hasOwnProperty(key)) {
							if (key == "color") {
								const c = obj[key].map(n => Math.floor(n));
								mat[key] = new THREE.Color(`rgb(${c.join(",")})`)
							} else {
								mat[key] = obj[key];
							}
						}
					})
				});
			} else {
				this.folderObjes.forEach((obj, i) => {
					const mat = this.materials;
					if (!mat) return false;
					Object.keys(obj).forEach(key => {
						if (mat.hasOwnProperty(key)) {
							if (key == "color") {
								const c = obj[key].map(n => Math.floor(n));
								mat[key] = new THREE.Color(`rgb(${c.join(",")})`)
							} else {
								mat[key] = obj[key];
							}
						}
					})
				});
			}
		},
		updateFolder(materials, name) {
			this.folder.forEach(x => {
				this.gui.removeFolder(x);
			});
			this.folder = [];
			this.folderObjes = [];
			this.materials = materials;
			if (Array.isArray(materials)) {
				materials.forEach((mat, i) => {
					var f = this.gui.addFolder(mat.name);
					const obj = clone(this.matObjs);
					this.setMatObj(obj, mat);
					this.setFolder(obj, f);
					this.folderObjes.push(obj);
					this.folder.push(f);
				})
			} else {
				var f = this.gui.addFolder(materials.name);
				const obj = clone(this.matObjs);
				this.setMatObj(obj, materials);
				this.setFolder(obj, f);
				this.folder.push(f);
				this.folderObjes.push(obj);
			}
		},
		setMatObj(obj, mat) {
			Object.keys(obj).forEach(key => {
				if (mat.hasOwnProperty(key)) {
					if (key == "color") {
						const c = mat.color;
						obj[key] = [
							Math.floor(c.r * 255),
							Math.floor(c.g * 255),
							Math.floor(c.b * 255)
						];
					} else {
						obj[key] = mat[key];
					}
				}
			})
		},
		setFolder(objs, folder) {
			folder.add(objs, "opacity", 0, 1, 0.01).onChange(() => {
				this.renderFolader();
			});
			folder.add(objs, "transparent").onChange(() => {
				this.renderFolader();
			});;
			folder.add(objs, "depthWrite").onChange(() => {
				this.renderFolader();
			});;
			folder.add(objs, "depthTest").onChange(() => {
				this.renderFolader();
			});;
			folder.addColor(objs, "color").onChange(() => {
				this.renderFolader();
			});;
			folder.open();
		},
		addParms(f) {

		},
		// 上传模型作为编辑底图
		uploadModel(e) {
			var formData = new FormData();
			formData.append("file", e.target.files[0]);
			$.ajax({
				type: "POST", // 数据提交类型
				url: "/users/uploadModel", // 发送地址
				data: formData, //发送数据
				// async: true, // 是否异步
				processData: false, //processData 默认为false，当设置为true的时候,jquery ajax 提交的时候不会序列化 data，而是直接使用data
				contentType: false, //
				success: (data) => {
					if (data.code == 200) {
						this.getModelList();
						setTimeout(() => {
							if (data.url.includes("fbx") || data.url.includes("FBX")) {
								INT.uploadModel(data.url);
							}
						}, 1000);
					}
				}
			});
		},
		sub() {
			if (!this.modelsVal) return false;
			INT.uploadModel(this.modelsVal);
		},
		uploadDf() {
			INT.uploadModel("/upload/moren.FBX");
		}
	},
	watch: {

	},
});
