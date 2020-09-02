/** @format */
const setNodeVal = (key, obj, val) => {
	const keys = key.split(".");
	if (keys.length === 0) return false;
	const k = keys.splice(0, 1)[0];
	if (keys.length === 0) {
		obj[k] = val;
	} else {
		setNodeVal(key, obj[k], val);
	}
	console.log(ModelManage.nodes)
}
window.ModelManage = {
	id: 0,
	linkId: 0,
	nodes: [],
	links: [],
	// 添加节点
	addNode: function (name, type, vec3) {
		const scale = type == 1 ? 5 : 1;
		this.nodes.push({
			name: `${name}_${this.id + 1}`,
			type,
			id: this.id++,
			position: vec3 || { x: 0, y: 0, z: 0 },
			scale: { x: scale, y: scale, z: scale },
			userData: {},
			visible: true,
		});
		return this;
	},
	// 添加连线
	addLink: function (links) {
		if (!Array.isArray(links) && links.length < 2) return false;
		const lines = [];
		links.forEach((id) => {
			const node = this.getNode(id);
			lines.push(node);
		});
		this.links.push({
			data: lines,
			id: this.linkId++,
			type: "none",
			point: 0
		});
		return this;
	},
	// 获取指定id节点
	getNode: function (id) {
		let node = null;
		for (let i = 0; i < this.nodes.length; i++) {
			const elem = this.nodes[i];
			if (id == elem.id) {
				node = elem;
				i = this.nodes.length;
			}
		}
		return node;
	},
	// 根据传递的ID 查找是否有当前连线
	getLinks: function (id) {
		let link = null;
		for (let i = 0; i < this.links.length; i++) {
			const elem = this.links[i];
			if (id == elem.id) {
				link = elem;
				i = this.links.length;
			}
		}
		return link;
	},
	deleteNode: function (id) {
		// 删除当前节点
		const n_len = this.nodes.length;
		const l_len = this.links.length;
		for (let i = n_len - 1; i >= 0; i--) {
			const elem = this.nodes[i];
			if (elem.id === id) {
				this.nodes.splice(i, 1);
			}
		}

	},
	// 
	deleteLink: function (id) {
		// 值传递了一个参数，删除含有这个连线的所有线条
		const len = this.links.length;
		for (let i = len - 1; i >= 0; i--) {
			if (this.links[i].id === id) {
				this.links.splice(i, 1);
			}
		}
		return this;
	},
	// 修改node名字
	setName: function (id, name) {
		const node = this.getNode(id);
		node.name = name;
	},
	// 统一修改节点属性
	setNodeProperty(key, val) {
		const keys = key.split(".");
		if (keys.length === 0) return false;
		const k = keys.splice(0, 1)[0];
		this.nodes.forEach((elem) => {
			if (elem.hasOwnProperty(k)) {
				if (keys.length !== 0) {
					setNodeVal(keys.join("."), elem[k], val);
				} else {
					elem[k] = val;
				}
			}
		})
	},
	// 更新当前node的数据
	updateNode(item) {
		const node = this.getNode(item.id);
		if (!node) return false;
		Object.keys(item).forEach((key) => {
			if (node.hasOwnProperty(key) && typeof node[key] == typeof item[key]) {
				node[key] = item[key];
			}
		});
		return node;
	},
	// 更新线条 位置信息与node对齐
	updateLine() {
		this.links.forEach((line) => {
			console.log(line);
			line.data.forEach((n) => {
				this.nodes.forEach((node) => {
					if (n.id == node.id) {
						n.position = node.position;
					}
				})
			})
		})
	},

	setLink(item) {
		const link = this.getLinks(item.id);
		link.data = item.data;
	},
	setData(data) {
		if (data.hasOwnProperty("nodes")) {
			data.nodes.forEach((elem) => {
				if (elem.id >= this.id) {
					this.id = elem.id + 1;
				}
			})
			this.nodes = data.nodes;
		}
		if (data.hasOwnProperty("links")) {
			data.links.forEach((elem) => {
				if (elem.id >= this.linkId) {
					this.linkId = elem.id + 1;
				}
			})
			this.links = data.links;
		}
	},
	// 获取所有数据
	getData: function (state = true) {
		const data = {
			nodes: this.nodes,
			links: this.links,
		};
		if (state) {
			return data;
		} else {
			return JSON.stringify();
		}
	},
};
