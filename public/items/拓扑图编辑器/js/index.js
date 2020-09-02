/** @format */

var VM = new Vue({
	el: "#app",
	data: {
		nodeStyle: 1,
		childStyle: 1,
		nodeList: [], // 节点列表
		linkList: [], // 节点列表
		activeNode: null, // 点击选择node
		activeLink: null, // 点击选择连线
		typeList: [{ name: "Sprite", id: 1 }],
		s_node: {
			id: "",
			type: "",
			name: "",
			position: {
				x: 0.0,
				y: 0.0,
				z: 0.0,
			},
			scale: {
				x: 1.0,
				y: 1.0,
				z: 1.0,
			},
			visible: true,
			userData: "{}",
		},
		INT_state: {
			nodeHeight: 5, // 节点高度
			nodeSize: 5, // 节点大小
		},
		featuresType: 1, // 当前功能键模式
		activeLinks: [], // 存储当前线条
		editLineData: {
			data: [],
			id: null
		},// 点击线条数据
		LineTypes: [
			{ name: 'none' },
			{ name: 'CatmullRomCurve3' },
		],// 线条样式
		LineType: "none",// 线条样式
		modelsVal: '',
		models: []
	},
	mounted() {
		this.getModelList();
	},
	methods: {
		// 当前组   鼠标事件
		nodeTypeDrap(item, event) {
			// event.preventDefault()
			event.dataTransfer.setData("id", item.id);
			event.dataTransfer.setData("name", item.name);
		},
		setNode(id) {
			const obj = ModelManage.getNode(id);
			if (!obj) return false;
			Object.keys(obj).forEach((key) => {
				const elem = obj[key];
				if (this.s_node.hasOwnProperty(key)) {
					if (key !== "userData") {
						this.s_node[key] = elem;
					} else {
						this.s_node[key] = JSON.stringify(elem);
					}
				}
			});
			// 是否是连线状态
			if (this.featuresType == 2 && this.activeLinks[0] != id) {
				this.activeLinks.unshift(id);
			}
		},
		checkVisibe() {
			this.updateNode();
		},
		// 更新3D节点数据
		updateNode() {
			const { position, scale } = this.s_node;
			const obj = Object.assign(this.s_node, {
				position: {
					x: parseFloat(position.x),
					y: parseFloat(position.y),
					z: parseFloat(position.z),
				},
				scale: {
					x: parseFloat(scale.x),
					y: parseFloat(scale.y),
					z: parseFloat(scale.z),
				},
			});
			INT.updateNode(obj);
		},
		// 更新UI层节点列表
		updateNodeList(items) {
			if (Array.isArray(items)) {
				this.nodeList = items;
			}
		},
		// 点击UI层列表节点
		clicNode(item) {
			this.activeNode = item.id;
			this.childStyle = 1;
			this.setNode(item.id);
			INT.clickNode(item.id);
		},
		// 点击连线列表
		clickLine(item) {
			const link = ModelManage.getLinks(item.id);
			if (!link) return false;
			INT.activeLine(link.data);
			this.activeLink = item.id;
			this.childStyle = 2;

			// 连线编辑列表
			const obj = Object.assign({
				data: [],
				id: null
			}, link);
			this.editLineData = obj;
		},
		// 删除UI层中的线条 并且把数据更行到model
		deleteLine(id) {
			// 数据中删除
			this.$confirm('是否删除该条连线?', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'warning'
			}).then(() => {
				this.updatePageLine(id);
			})
		},
		// 删除UI层节点 并且更新到page中
		deleteNode(item) {
			// 数据中删除
			this.$confirm('是否删除该条连线?', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'warning'
			}).then(() => {
				ModelManage.deleteNode(item.id);
				INT.updatePage(true);
			})
		},
		// 更新页面的线条
		updatePageLine(id) {
			const lines = ModelManage.deleteLink(id).getData().links;
			// 更新UI层线条
			this.updateLineList(lines);
			// 更新3d
			INT.updatePage(true);
			INT.activeLine([]);
			this.$message({
				type: 'success',
				message: '成功!'
			});
		},
		createLink() {
			// model中添加连线
			if (this.activeLinks.length < 2) return false;
			const links = ModelManage.addLink(this.activeLinks).getData().links;
			INT.addLinks(links);
			this.activeLinks = [];

			// 更新Ui层线条列表 
			this.updateLineList(links);
		},
		// 更新UI层线条列表|
		updateLineList(items) {
			this.linkList = [];
			items.forEach((elem) => {
				this.linkList.push({
					id: elem.id,
					src: elem.data[0].name,
					srcId: elem.data[0].id,
					dst: elem.data[elem.data.length - 1].name,
					dstId: elem.data[elem.data.length - 1].id,
				})
			});
		},
		// viewLink() {
		// 	console.log(this.activeLinks);
		// },
		exportsEvent() {
			const data = ModelManage.getData();
			localStorage.setItem("TOPO_DATA", JSON.stringify(data));
			console.log(JSON.stringify(data));
			$.ajax({
				type: "POST", // 数据提交类型
				url: "/topo/saveData", // 发送地址
				data: {
					data: JSON.stringify(data)
				},    
				success: function (data) {
					if (data.code==200){
						setTimeout(() => {
							window.open(data.url)
						}, 300);
					}
				}
			});
		},
		importEvent() {
			const dataJSON = localStorage.getItem("TOPO_DATA");
			try {
				const data = JSON.parse(dataJSON);
				ModelManage.setData(data);
				// 更新3d
				INT.updatePage(true);
				// 更新UI层 节点 线条
				this.updateLineList(data.links);
				this.updateNodeList(data.nodes);
			} catch (err) {
				console.log(err)
			}
		},
		// 点击线条 修改
		editLineChange(item) {
			if (this.editLineData && Array.isArray(this.editLineData.data)) {
				this.editLineData.data.forEach((elem) => {
					elem.position.x = parseFloat(elem.position.x);
					elem.position.y = parseFloat(elem.position.y);
					elem.position.z = parseFloat(elem.position.z);
				});
				ModelManage.setLink(this.editLineData);
				INT.updatePage();
				INT.activeLine(this.editLineData.data);
			};


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
				success: function (data) {
					if (data.code == 200) {
						setTimeout(() => {
							if (data.url.includes("fbx") || data.url.includes("FBX")) {
								INT.uploadModel(data.url);
							}
						}, 1000);
					}
				}
			});
		},
		getModelList() {
			$.ajax({
				url: "/users/getModelList",
				type: "get",
				success: (data) => {
					this.models = data.data;
				}
			})
		},
		sub() {
			if (!this.modelsVal) return false;
			INT.uploadModel(this.modelsVal);
		},
	},
	watch: {
		featuresType(val) {
			if (val == 1) {
				this.activeLinks = [];
			}
		},
		activeLinks(val) {
			INT.addBeingLine(val);
		},
		['INT_state.nodeHeight'](val) {
			// 更新线条中所有的高度
			INT.setState({
				nodeHeight: val
			});
			ModelManage.setNodeProperty('position.y', val);
			ModelManage.updateLine();
			INT.updatePage();
			// ModelManage.setNodeHeight(val);
		},
		['INT_state.nodeSize'](val) {
			// 更新线条中所有的高度
			INT.setState({
				nodeSize: val
			});
			ModelManage.setNodeProperty('scale.x', val);
			ModelManage.setNodeProperty('scale.y', val);
			ModelManage.setNodeProperty('scale.z', val);
			ModelManage.updateLine();
			INT.updatePage();
		}
	},
});
