var ROTATE_EFFECT = function () {
	"use strict";

	this.scene;
	this.camera;
	this.renderer;
	this.controls;

	this.GId = '';
	this.tipconts;
	this.container;
	this.parentCont;
	this.Tweens = [];
	this.Result = false;
	this.flyInit = null;
	this.init = function (cts, config) {
		var conts = parseCts(cts);
		if (detector() && conts != null) {
			try {
				var config = config || {};
				df_Config = $.extend(true, {}, defaultConfig, config);

				thm.parentCont = conts;
				thm.GId += THREE.Math.generateUUID();
				var TId = conts.attr('id') + '_' + thm.GId;
				thm.container = creatContainer(TId);
				thm.parentCont.html(thm.container);

				try {
					InitControls();
				} catch (err) {
					console.log("缺少Controls文件");
				}


				if (df_Config.loading)
					loading(thm.container);
				creatTips(thm.container);
				loadTexture()
				initiate();
				init3DMesh();
				is_Init = true;
			} catch (e) {
				thm.Result = 'error! Initialization Error!';
				console.log(e);
				creatError(conts);
				return;
			}
		} else
			thm.Result = 'error! Not Support WebGL!';
	};

	this.render = function (func) {
		if (is_Init) {
			if (!testing())
				return;
			removeLoading(thm.container);
			if (is_Stats)
				df_Stats.begin();
			renderers(func);
			initTween();
		}
	};

	this.rotaScene = function (angle, times) {
		if (is_Init) {
			angle = isNaN(angle * 1) ? 0 : Math.max(0, angle);
			times = isNaN(times * 1) ? 1 : Math.max(100, times);
			rotateScene(angle, times);
		}
	};

	this.disposeRender = function () {
		if (is_Init && testing()) {
			removeEvent();
			thm.controls.dispose();
			thm.container.remove();
			thm.renderer.forceContextLoss();
			thm.renderer.domElement = null;
			thm.renderer.context = null;
			thm.renderer = null;
			is_Init = false;
		}
	};

	var thm = this;
	var df_Stats,
		is_Stats = false; //stats
	var df_Raycaster,
		df_Mouse,
		df_Intersects,
		df_MouseEvent = false; //tips
	var df_Clock,
		df_Width = 0,
		df_Height = 0,
		is_Init = false,
		txues = {},
		df_Config = {}; //essential

	var defaultConfig = {
		stats: false,
		loading: false,
		background: {
			color: '#1E1F22',
			opacity: 1
		},
		camera: {
			fov: 45,
			near: 32,
			far: 10000,
			position: [0, 256, 512]
		},
		controls: {
			enablePan: true,
			enableZoom: true,
			enableRotate: true,
			enableDamping: true, //是否阻尼
			dampingFactor: 0.1, //阻尼系数
			keyPanSpeed: 5.0,
			panSpeed: 0.1, //平移系数
			zoomSpeed: 0.1, //缩放系数
			rotateSpeed: 0.013, //旋转系数
			distance: [64, 2048], //缩放距离区间
			polarAngle: [-Infinity, Infinity], //上下旋转区间
			azimuthAngle: [-Infinity, Infinity], //左右旋转区间
		},
		light: {
			Ambient: {
				color: '#FFFFFF',
				strength: 1.0
			},
			isHemisphere: false,
			hemisphere: {
				color: '#EFEFEF',
				groundColor: '#EFEFEF',
				strength: 0.7,
				position: [0, 0, 2000]
			},
		},
		backMap: {
			texture: null,
			opacity: 1,
			lw: [0, 0],
			position: [0, 0, 0],
			side: true
		},
		texture: {}
	};

	function initiate() {

		thm.scene = new THREE.Scene();
		df_Clock = new THREE.Clock();

		var wh = getWH();
		df_Width = wh.w;
		df_Height = wh.h;
		var cm = df_Config.camera,
			bg = df_Config.background;

		thm.camera = new THREE.PerspectiveCamera(cm.fov, wh.w / wh.h, cm.near, cm.far);
		thm.camera.position.set(cm.position[0], cm.position[1], cm.position[2]);
		//
		//thm.camera.lookAt({ x: 0, y: 0, z: 100 });

		thm.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			preserveDrawingBuffer: true,//是否保留缓冲区直到手动清除或覆盖。默认值为false
		});
		thm.renderer.setSize(df_Width, df_Height);
		thm.renderer.setClearColor(bg.color, bg.opacity);



		// controls
		thm.controls = new THREE.OrbitControls(thm.camera, thm.container[0]);
		setControls(thm.controls, df_Config.controls);

		setLight(thm.scene, df_Config.light);

		// state
		is_Stats = (df_Config.stats === true) ? true : false;
		if (is_Stats) {
			df_Stats = new Stats();
			thm.container.append($(df_Stats.dom));
		}

		thm.container.append($(thm.renderer.domElement));

		window.addEventListener('resize', onWindowResize, false);

		// mouse event
		df_Raycaster = new THREE.Raycaster();
		df_Mouse = new THREE.Vector2();
		thm.renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
		thm.renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
	}
	thm.animateArray = []; // 一直运行里面的材质  time+dt
	thm.rotateArray = [];
	thm.eventArray = [];
	function init3DMesh(opts) {
		/* var helper = new THREE.GridHelper(400, 20, 0x43908D, 0x3A3B3B);
		thm.scene.add(helper);
 */
		thm.group = new THREE.Group();
		thm.scene.add(thm.group);
	}

	// 添加平面 层
	function addPlane(Config) {
		// const map = new THREE.TextureLoader().load(Config.map);
		const colors = getColorArr(Config.color);
		const _config = {
			// map: map,
			color: colors[0],
			opacity: colors[1],
			transparent: true,
		};
		if (Config.img) {
			const map = new THREE.TextureLoader().load(df_Config.url + Config.img);
			_config.map = map;
		}
		const material = new THREE.MeshBasicMaterial(_config);

		const geometry = new THREE.PlaneGeometry(Config.size.x, Config.size.y);
		let mesh = new THREE.Mesh(geometry, material);

		return mesh;
	}
	// 添加平面 层
	function addBall(Config) {
		// const map = new THREE.TextureLoader().load(Config.map);
		const colors = getColorArr(Config.color);
		const _config = {
			// map: map,
			color: colors[0],
			opacity: colors[1],
			transparent: true,
		};
		if (Config.img) {
			const map = new THREE.TextureLoader().load(df_Config.url + Config.img);
			_config.map = map;
		}
		const material = new THREE.MeshBasicMaterial(_config);

		// const geometry = new THREE.PlaneGeometry(Config.size.x, Config.size.y);
		const geometry = new THREE.SphereBufferGeometry(Config.size.x, 32, 32)
		let mesh = new THREE.Mesh(geometry, material);

		return mesh;
	}
	// 添加精灵
	function addSprite(Config) {
		// const map = new THREE.TextureLoader().load(Config.map);
		const colors = getColorArr(Config.color);
		const _config = {
			// map: map,
			color: colors[0],
			opacity: colors[1],
			transparent: true,
		};
		if (Config.img) {
			const map = new THREE.TextureLoader().load(df_Config.url + Config.img);
			_config.map = map;
		}
		const material = new THREE.SpriteMaterial(_config);

		const mesh = new THREE.Sprite(material);
		mesh.scale.set(Config.size.x, Config.size.y, Config.size.y)
		return mesh;
	}

	// 添加轨道
	function addTrack(Config) {
		const group = new THREE.Group();

		const nodeGroup = new THREE.Group();
		const lineGroup = new THREE.Group();

		nodeGroup.name = "node";
		lineGroup.name = "line";

		group.add(nodeGroup, lineGroup);

		const { color, img, track, size } = Config;
		const data = track.data || [];
		if (!Array.isArray(data)) return group;

		const positions = creatCirclePath(track.radius, data.length, 0);

		const map = new THREE.TextureLoader().load(df_Config.url + img)

		const material = new THREE.SpriteMaterial({
			map: map,
			color: 0xffffff
		});


		const lineColors = getColorArr(track.lineColor);
		const lineMat = new THREE.LineBasicMaterial({
			color: lineColors[0],
			transparent: true,
			opacity: lineColors[1]
		});

		for (let i = 0; i < data.length; i++) {
			const elem = data[i];
			const vec2 = positions[i];

			const child = new THREE.Group();
			nodeGroup.add(child);
			child.position.set(vec2[0], 0, vec2[1]);

			const sprite = addTrackSprite(material, size);
			sprite.scale.set(size.x, size.y, size.z);
			child.add(sprite);
			// 添加字体 
			// 是否开启中间
			if (track.lineCenter) {
				const src = new THREE.Vector3();
				const dst = child.position.clone();
				let points = [
					src,
					dst
				];
				// 是曲线
				if (track.isCurve) {
					const _c = src.clone().lerp(dst, 0.5);
					_c.y += parseFloat(track.curveHeight) || 0;
					const curve = new THREE.QuadraticBezierCurve3(
						src,
						_c,
						dst
					);
					const _len = src.distanceTo(_c) + _c.distanceTo(dst);
					points = curve.getPoints(Math.round(_len));
				}

				const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

				const _line = new THREE.Line(lineGeo, lineMat);
				lineGroup.add(_line);

				if (!thm.flyInit && track.isFly) {
					const flyPoint = thm.flyInit.tranformPath(points, track.flyDpi);
					var flyMesh = thm.flyInit.addFly({
						color: track.flyColor,
						curve: flyPoint,
						width: track.flySize,
						length: Math.ceil(flyPoint.length / 6),
						speed: track.flySpeed,
						repeat: Infinity
					});

					lineGroup.add(flyMesh)
				}
			 

			}



			if (elem.name == '') continue;

			const textMap = addSpriteText(elem.name, parseFloat(track.fontSize), track.fontGap);
			const textMat = new THREE.SpriteMaterial({
				map: textMap.textur,
				color: new THREE.Color(color)
			});
			const title = addTrackSprite(textMat);
			title.scale.set(textMap.width / 4, textMap.height / 4, textMap.height / 4);
			title.center.set(0.5, 1);
			title.position.y = size.y / 8 + parseFloat(track.fontTop);
			child.add(title);
		}

		// 是否添加环线
		if (track.lineState) {
			const positions = creatCirclePath(track.radius, 720, 0).map(elem => new THREE.Vector3(elem[0], 0, elem[1]));

			const lineGeo = new THREE.Geometry();
			lineGeo.vertices = positions;

			const line = new THREE.LineLoop(lineGeo, lineMat);
			line.renderOrder = -1;

			lineGroup.add(line);

		}

		return group;
	}


	function addTrackSprite(mat, size) {
		const sprite = new THREE.Sprite(mat);

		return sprite;
	}

	// 上升粒子
	function addRisePoint(Config) {
		const size = Config.size.x;
		const pointConf = Config.point;
		const color = Config.color;

		const colors = getColorArr(color);
		const map = new THREE.TextureLoader().load(df_Config.url + Config.img)

		const position = [];
		const index = [];
		const loading = [];

		const pnumber = pointConf.number;
		const cnumber = pointConf.cnumber || 3;

		for (let i = 0; i < pnumber; i++) {
			const load = THREE.Math.randFloat(0, 1);;
			const x = THREE.Math.randFloat(0 - pointConf.rangeX / 2, pointConf.rangeX / 2);
			const y = THREE.Math.randFloat(0 - pointConf.rangeY / 2, pointConf.rangeY / 2);
			const z = THREE.Math.randFloat(0 - pointConf.rangeZ / 2, pointConf.rangeZ / 2);
			const number = cnumber;
			// 判断当前是否在镜头周围 

			for (let c = 0; c < number; c++) {
				index.push(c);
				loading.push(load);
				position.push(x, y, z);
			}
		}
		// 
		const geometry = new THREE.BufferGeometry();
		geometry.addAttribute("position", new THREE.Float32BufferAttribute(position, 3));
		geometry.addAttribute("v_index", new THREE.Float32BufferAttribute(index, 1));
		geometry.addAttribute("v_loading", new THREE.Float32BufferAttribute(loading, 1));

		const material = new THREE.ShaderMaterial({
			uniforms: {
				u_color: { value: colors[0] },
				u_opacity: { value: colors[1] },
				u_height: { value: pointConf.rangeY / 2 },
				u_minheight: { value: 0 - pointConf.rangeY / 2 },
				time: { value: 0 },
				u_map: { value: map },
				u_speed: { value: pointConf.speed },
				u_size: { value: size }
			},
			transparent: true,
			depthWrite: false,
			// blending: THREE.AdditiveBlending,
			vertexShader: PointShader.vertexShader,
			fragmentShader: PointShader.fragmentShader,
		});
		const point = new THREE.Points(geometry, material);

		return point;
	}


	function setMeshMaterial(mesh, matConf) {
		if (mesh && matConf) {
			Object.keys(matConf).forEach((key) => {
				mesh.traverse(function (child) {
					if (child.material && child.material.hasOwnProperty(key) && child.material.type != "ShaderMaterial") {
						child.material[key] = matConf[key];
					}
				})

			});
		}
	}
	var pointImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABuUlEQVRYR82XPy8EURTFf6fWUlD5k9ALhYLQkkgUJAql6HwFfAQqG6VCQiGR0BIKCaK3ibUVBSX1lSfzZGd3ZmdnZ2Z3XzLF5N177pm59913rkixzGweWAFmgIHgcQifwXMPnEu6aRVWSYZmNghsAevAeJJ9sF8GToCSpI9mPk0JmNkusAkMtRi43uwdOJLkcCJXLAEzuwVm2wxc73YnaS4KK5KAmbmc9ucU3MN8SXJ1E1oNBMzsDRjOObiHq0oaqcUOETCzU2C1oOAe9kzSmn/5JxAU3E7BwT38ni/MPwLBUXvKUO1pebvTMeWOqCfgjkmnvj70FzyBV2A07WdktK9IGpOZLQKXGcHadV9yBA6DVtsuSBa/kiPwAExnQcng++gIFNl4krhVHYFvoC/JsqD9n54g0PUUdL0I94HtgnKcBHvgasDpvOsky4L2F3wrfkmh9/LiUpY00TOXkVO+3buOA03QySs5LEh8UnNWwnG1ElLIUaK0CEXsyTQo4zhZXkR3bFDEjlWzwSRPhRxSwrGyvD5pXR3NagrTD6cbKXRjBTjOPJxG/BGnH5eByZjx/Bm4kHTVarv8BfUiqvAfUSxCAAAAAElFTkSuQmCC'
	thm.addEffect = function (Config) {
		let mesh = null;
		switch (Config.type) {
			case "plane":
				mesh = addPlane(Config);
				break;
			case "sprite":
				mesh = addSprite(Config);
				break;
			case "ball":
				mesh = addBall(Config);
				break;
			case "track":
				if (!thm.flyInit && Config.track.isFly) {
					thm.flyInit = new InitFly({
						texture: pointImg
					});
				}
				mesh = addTrack(Config);
				break;
			case "risePoint":
				mesh = addRisePoint(Config);
				thm.animateArray.push(mesh);
				break;
		}
		if (!mesh) return false;
		if (Config.material) {
			setMeshMaterial(mesh, Config.material);
		}
		const { position, rotation, rotate } = Config;
		mesh.position.copy(position);
		mesh.rotation.set(rotation.x, rotation.y, rotation.z);
		// 是否旋转
		const isRotate = rotate.x == 0 && rotate.y == 0 && rotate.z == 0;
		mesh._isRotate = !isRotate;
		mesh._rotate = rotate;
		mesh._type = Config.type;
		mesh._id = Config.id;
		thm.group.add(mesh);
	}
	thm.setEffect = function (Config) {
		thm.delEffect(Config.id);

		thm.addEffect(Config);
	}
	thm.delEffect = function (id) {
		const child = thm.group.children;
		for (let i = child.length - 1; i >= 0; i--) {
			if (child[i]._id == id) {
				thm.group.remove(child[i])
			}
		}
		thm.animateArray = thm.animateArray.filter(x => x._id != id);
	}
	thm.disposeEffect = function () {
		thm.group && thm.group.parent.remove(thm.group);

		thm.group = new THREE.Group();
		thm.scene.add(thm.group);
	}

	function addSpriteText(name, fontSize, gap) {
		// 生成map
		const _names = name.split("/n");

		const canvas = document.createElement('canvas');

		const ctx = canvas.getContext("2d");

		ctx.font = "bold " + fontSize + "px 微软雅黑";
		const tw = ctx.measureText(name).width;
		var width = THREE.Math.ceilPowerOfTwo(tw);
		var height = THREE.Math.ceilPowerOfTwo(fontSize) * _names.length + (gap * _names.length - 1);
		var bh = THREE.Math.ceilPowerOfTwo(fontSize);
		canvas.width = width;
		canvas.height = height;

		_names.forEach((n, i) => {
			ctx.font = "bold " + fontSize + "px 微软雅黑";
			ctx.fillStyle = "#fff";
			ctx.textAlign = "left";
			const ws = ctx.measureText(n).width;
			ctx.fillText(n, (width - ws) / 2, fontSize + fontSize * i + i * gap);
		})


		const textur = new THREE.Texture(canvas);
		textur.needsUpdate = true;

		return {
			width: width,
			height: height,
			textur: textur
		}
	}

	function creatCirclePath(r, len, start) {
		if (len < 1) return [];
		let total = 360;
		let arr = [];
		for (let i = 0; i < len; i++) {
			const index = (i / len) * total + start;
			let rad = (index * Math.PI) / 180 + Math.PI / 2;
			let cur = [r * Math.cos(rad), r * Math.sin(rad)];
			arr.push(cur);
		}
		return arr;
	}

	function getColorArr(str) {
		function pad2(c) {
			return c.length === 1 ? `0${c}` : `${c}`;
		}
		if (Array.isArray(str)) return str;
		const _arr = [];
		const nStr = (`${str}`).toLowerCase().replace(/\s/g, '');
		if (/^((?:rgba)?)\(\s*([^)]*)/.test(nStr)) {
			const arr = nStr.replace(/rgba\(|\)/gi, '').split(',');
			const hex = [
				pad2(Math.round(arr[0] - 0 || 0).toString(16)),
				pad2(Math.round(arr[1] - 0 || 0).toString(16)),
				pad2(Math.round(arr[2] - 0 || 0).toString(16))
			];
			_arr[0] = new THREE.Color(`#${hex.join('')}`);
			_arr[1] = Math.max(0, Math.min(1, (arr[3] - 0 || 0)));
		} else if (str === 'transparent') {
			_arr[0] = new THREE.Color();
			_arr[1] = 0;
		} else {
			_arr[0] = new THREE.Color(str);
			_arr[1] = 1;
		}
		return _arr;
	}

	function animation(dt) {
		if (dt > 1) return false;
		if (thm.group) {
			thm.group.children.forEach((child) => {
				if (!child._isRotate) return false;
				if (child._type == 'track') {
					const rotate = child._rotate;
					child.children.forEach(tc => {
						tc.rotation.x += dt * rotate.x;
						tc.rotation.y += dt * rotate.y;
						tc.rotation.z += dt * rotate.z;
					})
				} else {
					const rotate = child._rotate;
					child.rotation.x += dt * rotate.x;
					child.rotation.y += dt * rotate.y;
					child.rotation.z += dt * rotate.z;
				}
			})
		}
		if (thm.flyInit) {
			thm.flyInit.animation(dt);
		}

		if (thm.animateArray) {
			thm.animateArray.forEach((child) => {
				if (child.material && child.material.uniforms.time) {
					child.material.uniforms.time.value += dt;
				}
			})
		}
	}
	//-
	function loadTexture() {
		var txueLoader = new THREE.TextureLoader();
		var _n = df_Config.texture;
		for (var k in _n) {
			txues['_' + k] = txueLoader.load(df_Config.url + _n[k], function (tex) {
				tex.anisotropy = 10;
				tex.minFilter = tex.magFilter = THREE.LinearFilter;
			});
		}
	}

	// mouse event
	function onDocumentMouseMove(event) {
		event.preventDefault();

		if (!df_MouseEvent) {
			df_Mouse.x = (event.layerX / df_Width) * 2 - 1;
			df_Mouse.y = - (event.layerY / df_Height) * 2 + 1;
			df_Raycaster.setFromCamera(df_Mouse, thm.camera);

			//df_Intersects = df_Raycaster.intersectObject( gusMesh );
			/*
			if ( df_Intersects.length > 0 ) {
			thm.container[0].style.cursor = 'pointer';

			} else {
			removeTips();
			thm.container[0].style.cursor = 'auto';
			}
			 */
		}
	}

	function onDocumentMouseDown(event) {
		event.preventDefault();
		df_Mouse.x = (event.layerX / df_Width) * 2 - 1;
		df_Mouse.y = -(event.layerY / df_Height) * 2 + 1;
		df_Raycaster.setFromCamera(df_Mouse, thm.camera);
		var intersects = df_Raycaster.intersectObjects(thm.eventArray);
		if (intersects.length != 0 && event.buttons == 1) {
			if (isFunction(df_Config.onClick)) {
				df_Config.onClick(intersects[0].object.userData);
			}
		} else { }

	}

	function onWindowResize(event) {
		var wh = getWH();
		df_Width = wh.w;
		df_Height = wh.h;
		thm.camera.aspect = wh.w / wh.h;
		thm.renderer.setSize(wh.w, wh.h);
		thm.controls.reset();
	}

	function renderers(func) {
		var fnc = toFunction(func);
		var Animations = function () {
			if (is_Init) {
				fnc.bind(thm)();

				var delta = df_Clock.getDelta();
				if (delta > 0)
					animation(delta);

				thm.controls.update();
				if (is_Stats) df_Stats.update();
				//thm.camera.lookAt({ x: 0, y: 0, z: 100 });

				requestAnimationFrame(Animations);
				thm.renderer.render(thm.scene, thm.camera);
			}
		};
		Animations();
	}

	function testing() {
		return thm.renderer instanceof THREE.WebGLRenderer;
	}

	function rotateScene(angle, times) {
		var ay = thm.scene.rotation.y + angle;
		new TWEEN.Tween(thm.scene.rotation).to({
			y: ay
		}, times).start();
	}

	function initTween() {
		for (var k = thm.Tweens.length - 1; k >= 0; k--) {
			thm.Tweens[k].start(TWEEN.now());
		}
	}

	function getWH() {
		return {
			w: thm.container.width(),
			h: thm.container.height()
		};
	}

	function setControls(controls, opts) {
		controls.enablePan = opts.enablePan;
		controls.enableKeys = opts.enablePan;
		controls.enableZoom = opts.enableZoom;
		controls.enableRotate = opts.enableRotate;

		controls.enableDamping = opts.enableDamping;
		controls.dampingFactor = opts.dampingFactor;
		controls.keyPanSpeed = opts.keyPanSpeed;

		controls.panSpeed = opts.panSpeed;
		controls.zoomSpeed = opts.zoomSpeed;
		controls.rotateSpeed = opts.rotateSpeed;

		controls.minDistance = opts.distance[0];
		controls.maxDistance = opts.distance[1];
		controls.minPolarAngle = opts.polarAngle[0];
		controls.maxPolarAngle = opts.polarAngle[1];
		controls.minAzimuthAngle = opts.azimuthAngle[0];
		controls.maxAzimuthAngle = opts.azimuthAngle[1];
		// controls.mouseDownPrevent = opts.mouseDownPrevent;
	}

	function setLight(scene, opts) {
		scene.add(new THREE.AmbientLight(opts.Ambient.color, opts.Ambient.strength));
		if (opts.isHemisphere) {
			var lh = opts.hemisphere,
				hLight = new THREE.HemisphereLight(lh.color, lh.groundColor, lh.strength);
			hLight.position.set(lh.position[0], lh.position[2], lh.position[1]);
			scene.add(hLight);
		}
	}

	function detector() {
		try {
			return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
		} catch (e) {
			return false;
		}
	}

	function isFunction(a) {
		return Object.prototype.toString.call(a) === '[object Function]';
	}

	function toFunction(a) {
		var b = Object.prototype.toString.call(a) === '[object Function]';
		return b ? a : function (o) { };
	}

	function parseCts(cts) {
		var $dom = (typeof cts == 'object') ? $(cts) : $('#' + cts);
		if ($dom.length <= 0)
			return null;
		return $dom;
	}

	function removeEvent() {
		window.removeEventListener('resize', onWindowResize, false);
		thm.renderer.domElement.removeEventListener('mousemove', onDocumentMouseMove, false);
		thm.renderer.domElement.removeEventListener('mousedown', onDocumentMouseDown, false);
	}

	//tips
	function creatTips(container) {
		var tmp = {
			tipCont: '<div id="GM_tips"></div>',
			icon: '<i></i>',
			txt: '<span id="DM_txt"></span>',
			bage: '<div></div>'
		};
		var tipcont = $(tmp.tipCont).css({
			'position': 'absolute',
			'left': '0',
			'top': '0',
			'display': 'none',
			'z-index': '30000'
		});
		tipcont.append($(tmp.bage).css({
			'position': 'absolute',
			'background': '#000',
			'opacity': '0.3',
			'border-radius': '5px',
			'height': '100%',
			'width': '100%'
		}));
		tipcont.append($(tmp.bage).css({
			'position': 'relative',
			'padding': '4px 6px',
			'color': '#fff',
			'font-size': '12px',
			'margin-left': '10px'
		})
			.append($(tmp.icon).css({
				'border': '3px solid #fff',
				'position': 'absolute',
				'left': '-2px',
				'margin-top': '6px',
				'border-radius': '3px'
			}))
			.append($(tmp.txt).css({
				'position': 'relative',
				'padding': '4px 6px',
				'color': '#fff;',
				'font-size': '12px'
			}).html('')));
		thm.tipconts = tipcont;
		$(container).append(tipcont);
	}

	function removeTips() {
		thm.tipconts.css('display', 'none');
		thm.tipconts.find('span#DM_txt').html('');
	}

	function setTips(conts, position) {
		var vec2 = transCoord(position),
			tmx = Math.max(10, Math.min(df_Width - 40, vec2.x + 6)),
			tmy = Math.max(10, Math.min(df_Height - 34, vec2.y - 12));
		thm.tipconts.css({
			'left': tmx,
			'top': tmy,
			'display': 'block'
		});
		thm.tipconts.find('span#DM_txt').html(conts);
	}

	function transCoord(position) {
		var halfW = df_Width / 2,
			halfH = df_Height / 2,
			vec3 = position.clone().applyMatrix4(thm.scene.matrix).project(thm.camera),
			mx = Math.round(vec3.x * halfW + halfW),
			my = Math.round(-vec3.y * halfH + halfH);
		return new THREE.Vector2(mx, my);
	}

	// loading
	function loading(container) {
		var loading = $('<div id="t_loading"></div>');
		loading.css({
			'position': 'absolute',
			'top': 0,
			'left': 0,
			'right': 0,
			'bottom': 0,
			'z-index': 20000
		});
		var loadImg = 'data:image/gif;base64,R0lGODlhIAAgAPMAAAAAAP///zg4OHp6ekhISGRkZMjIyKioqCYmJhoaGkJCQuDg4Pr6+gAAAAAAAAAAACH+GkNyZWF0ZWQgd2l0aCBhamF4bG9hZC5pbmZvACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAIAAgAAAE5xDISWlhperN52JLhSSdRgwVo1ICQZRUsiwHpTJT4iowNS8vyW2icCF6k8HMMBkCEDskxTBDAZwuAkkqIfxIQyhBQBFvAQSDITM5VDW6XNE4KagNh6Bgwe60smQUB3d4Rz1ZBApnFASDd0hihh12BkE9kjAJVlycXIg7CQIFA6SlnJ87paqbSKiKoqusnbMdmDC2tXQlkUhziYtyWTxIfy6BE8WJt5YJvpJivxNaGmLHT0VnOgSYf0dZXS7APdpB309RnHOG5gDqXGLDaC457D1zZ/V/nmOM82XiHRLYKhKP1oZmADdEAAAh+QQACgABACwAAAAAIAAgAAAE6hDISWlZpOrNp1lGNRSdRpDUolIGw5RUYhhHukqFu8DsrEyqnWThGvAmhVlteBvojpTDDBUEIFwMFBRAmBkSgOrBFZogCASwBDEY/CZSg7GSE0gSCjQBMVG023xWBhklAnoEdhQEfyNqMIcKjhRsjEdnezB+A4k8gTwJhFuiW4dokXiloUepBAp5qaKpp6+Ho7aWW54wl7obvEe0kRuoplCGepwSx2jJvqHEmGt6whJpGpfJCHmOoNHKaHx61WiSR92E4lbFoq+B6QDtuetcaBPnW6+O7wDHpIiK9SaVK5GgV543tzjgGcghAgAh+QQACgACACwAAAAAIAAgAAAE7hDISSkxpOrN5zFHNWRdhSiVoVLHspRUMoyUakyEe8PTPCATW9A14E0UvuAKMNAZKYUZCiBMuBakSQKG8G2FzUWox2AUtAQFcBKlVQoLgQReZhQlCIJesQXI5B0CBnUMOxMCenoCfTCEWBsJColTMANldx15BGs8B5wlCZ9Po6OJkwmRpnqkqnuSrayqfKmqpLajoiW5HJq7FL1Gr2mMMcKUMIiJgIemy7xZtJsTmsM4xHiKv5KMCXqfyUCJEonXPN2rAOIAmsfB3uPoAK++G+w48edZPK+M6hLJpQg484enXIdQFSS1u6UhksENEQAAIfkEAAoAAwAsAAAAACAAIAAABOcQyEmpGKLqzWcZRVUQnZYg1aBSh2GUVEIQ2aQOE+G+cD4ntpWkZQj1JIiZIogDFFyHI0UxQwFugMSOFIPJftfVAEoZLBbcLEFhlQiqGp1Vd140AUklUN3eCA51C1EWMzMCezCBBmkxVIVHBWd3HHl9JQOIJSdSnJ0TDKChCwUJjoWMPaGqDKannasMo6WnM562R5YluZRwur0wpgqZE7NKUm+FNRPIhjBJxKZteWuIBMN4zRMIVIhffcgojwCF117i4nlLnY5ztRLsnOk+aV+oJY7V7m76PdkS4trKcdg0Zc0tTcKkRAAAIfkEAAoABAAsAAAAACAAIAAABO4QyEkpKqjqzScpRaVkXZWQEximw1BSCUEIlDohrft6cpKCk5xid5MNJTaAIkekKGQkWyKHkvhKsR7ARmitkAYDYRIbUQRQjWBwJRzChi9CRlBcY1UN4g0/VNB0AlcvcAYHRyZPdEQFYV8ccwR5HWxEJ02YmRMLnJ1xCYp0Y5idpQuhopmmC2KgojKasUQDk5BNAwwMOh2RtRq5uQuPZKGIJQIGwAwGf6I0JXMpC8C7kXWDBINFMxS4DKMAWVWAGYsAdNqW5uaRxkSKJOZKaU3tPOBZ4DuK2LATgJhkPJMgTwKCdFjyPHEnKxFCDhEAACH5BAAKAAUALAAAAAAgACAAAATzEMhJaVKp6s2nIkolIJ2WkBShpkVRWqqQrhLSEu9MZJKK9y1ZrqYK9WiClmvoUaF8gIQSNeF1Er4MNFn4SRSDARWroAIETg1iVwuHjYB1kYc1mwruwXKC9gmsJXliGxc+XiUCby9ydh1sOSdMkpMTBpaXBzsfhoc5l58Gm5yToAaZhaOUqjkDgCWNHAULCwOLaTmzswadEqggQwgHuQsHIoZCHQMMQgQGubVEcxOPFAcMDAYUA85eWARmfSRQCdcMe0zeP1AAygwLlJtPNAAL19DARdPzBOWSm1brJBi45soRAWQAAkrQIykShQ9wVhHCwCQCACH5BAAKAAYALAAAAAAgACAAAATrEMhJaVKp6s2nIkqFZF2VIBWhUsJaTokqUCoBq+E71SRQeyqUToLA7VxF0JDyIQh/MVVPMt1ECZlfcjZJ9mIKoaTl1MRIl5o4CUKXOwmyrCInCKqcWtvadL2SYhyASyNDJ0uIiRMDjI0Fd30/iI2UA5GSS5UDj2l6NoqgOgN4gksEBgYFf0FDqKgHnyZ9OX8HrgYHdHpcHQULXAS2qKpENRg7eAMLC7kTBaixUYFkKAzWAAnLC7FLVxLWDBLKCwaKTULgEwbLA4hJtOkSBNqITT3xEgfLpBtzE/jiuL04RGEBgwWhShRgQExHBAAh+QQACgAHACwAAAAAIAAgAAAE7xDISWlSqerNpyJKhWRdlSAVoVLCWk6JKlAqAavhO9UkUHsqlE6CwO1cRdCQ8iEIfzFVTzLdRAmZX3I2SfZiCqGk5dTESJeaOAlClzsJsqwiJwiqnFrb2nS9kmIcgEsjQydLiIlHehhpejaIjzh9eomSjZR+ipslWIRLAgMDOR2DOqKogTB9pCUJBagDBXR6XB0EBkIIsaRsGGMMAxoDBgYHTKJiUYEGDAzHC9EACcUGkIgFzgwZ0QsSBcXHiQvOwgDdEwfFs0sDzt4S6BK4xYjkDOzn0unFeBzOBijIm1Dgmg5YFQwsCMjp1oJ8LyIAACH5BAAKAAgALAAAAAAgACAAAATwEMhJaVKp6s2nIkqFZF2VIBWhUsJaTokqUCoBq+E71SRQeyqUToLA7VxF0JDyIQh/MVVPMt1ECZlfcjZJ9mIKoaTl1MRIl5o4CUKXOwmyrCInCKqcWtvadL2SYhyASyNDJ0uIiUd6GGl6NoiPOH16iZKNlH6KmyWFOggHhEEvAwwMA0N9GBsEC6amhnVcEwavDAazGwIDaH1ipaYLBUTCGgQDA8NdHz0FpqgTBwsLqAbWAAnIA4FWKdMLGdYGEgraigbT0OITBcg5QwPT4xLrROZL6AuQAPUS7bxLpoWidY0JtxLHKhwwMJBTHgPKdEQAACH5BAAKAAkALAAAAAAgACAAAATrEMhJaVKp6s2nIkqFZF2VIBWhUsJaTokqUCoBq+E71SRQeyqUToLA7VxF0JDyIQh/MVVPMt1ECZlfcjZJ9mIKoaTl1MRIl5o4CUKXOwmyrCInCKqcWtvadL2SYhyASyNDJ0uIiUd6GAULDJCRiXo1CpGXDJOUjY+Yip9DhToJA4RBLwMLCwVDfRgbBAaqqoZ1XBMHswsHtxtFaH1iqaoGNgAIxRpbFAgfPQSqpbgGBqUD1wBXeCYp1AYZ19JJOYgH1KwA4UBvQwXUBxPqVD9L3sbp2BNk2xvvFPJd+MFCN6HAAIKgNggY0KtEBAAh+QQACgAKACwAAAAAIAAgAAAE6BDISWlSqerNpyJKhWRdlSAVoVLCWk6JKlAqAavhO9UkUHsqlE6CwO1cRdCQ8iEIfzFVTzLdRAmZX3I2SfYIDMaAFdTESJeaEDAIMxYFqrOUaNW4E4ObYcCXaiBVEgULe0NJaxxtYksjh2NLkZISgDgJhHthkpU4mW6blRiYmZOlh4JWkDqILwUGBnE6TYEbCgevr0N1gH4At7gHiRpFaLNrrq8HNgAJA70AWxQIH1+vsYMDAzZQPC9VCNkDWUhGkuE5PxJNwiUK4UfLzOlD4WvzAHaoG9nxPi5d+jYUqfAhhykOFwJWiAAAIfkEAAoACwAsAAAAACAAIAAABPAQyElpUqnqzaciSoVkXVUMFaFSwlpOCcMYlErAavhOMnNLNo8KsZsMZItJEIDIFSkLGQoQTNhIsFehRww2CQLKF0tYGKYSg+ygsZIuNqJksKgbfgIGepNo2cIUB3V1B3IvNiBYNQaDSTtfhhx0CwVPI0UJe0+bm4g5VgcGoqOcnjmjqDSdnhgEoamcsZuXO1aWQy8KAwOAuTYYGwi7w5h+Kr0SJ8MFihpNbx+4Erq7BYBuzsdiH1jCAzoSfl0rVirNbRXlBBlLX+BP0XJLAPGzTkAuAOqb0WT5AH7OcdCm5B8TgRwSRKIHQtaLCwg1RAAAOwAAAAAAAAAAAA==';
		loading.css('background', '#000000 url(' + loadImg + ') center center no-repeat');
		$(container).append(loading);
	}

	function removeLoading(container) {
		$(container).children('div#t_loading').css({
			'background': 'none',
			'display': 'none'
		});
	}

	function creatContainer(id) {
		var containers = $('<div></div>');
		containers.css("cssText", "height:100%;width:100%;position:relative !important");
		containers.attr('id', id);
		return containers;
	}

	function creatError(conts, errorText) {
		var error = $('<div class="data-error"></div>'),
			error_text = errorText || '数据错误。。。';
		if (undefined != conts) {
			var ctxt = "color:#fff;position:absolute;top:49%;width:100%;text-align:center;";
			error.css("cssText", ctxt);
			conts.html(error.html(error_text));
		}
	}
	class InitFly {
		constructor({
			texture
		} = opt) {
			this.flyId = 0; //id
			this.flyArr = []; //存储所有飞线
			this.baicSpeed = 1; //基础速度
			this.texture = 0.0;
			if (texture && !texture.isTexture) {
				this.texture = new THREE.TextureLoader().load(df_Config.url + texture)
			} else {
				this.texture = texture;
			}
			this.flyShader = {
				vertexshader: ` 
                uniform float size; 
                uniform float time; 
                uniform float u_len; 
                attribute float u_index;
                varying float u_opacitys;
                void main() { 
                    if( u_index < time + u_len && u_index > time){
                        float u_scale = 1.0 - (time + u_len - u_index) /u_len;
                        u_opacitys = u_scale;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_Position = projectionMatrix * mvPosition;
                        gl_PointSize = size * u_scale * 300.0 / (-mvPosition.z);
                    } 
                }
                `,
				fragmentshader: ` 
                uniform sampler2D u_map;
                uniform float u_opacity;
                uniform vec3 color;
                uniform float isTexture;
                varying float u_opacitys;
                void main() {
                    vec4 u_color = vec4(color,u_opacity * u_opacitys);
                    if( isTexture != 0.0 ){
                        gl_FragColor = u_color * texture2D(u_map, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y));
                    }else{
                        gl_FragColor = u_color;
                    }
                }`
			}
		}
		/**
		 * [addFly description]
		 *
		 * @param   {String}  opt.color  [颜色_透明度]
		 * @param   {Array}   opt.curve  [线的节点]
		 * @param   {Number}  opt.width  [宽度]
		 * @param   {Number}  opt.length [长度]
		 * @param   {Number}  opt.speed  [速度]
		 * @param   {Number}  opt.repeat [重复次数]
		 * @return  {Mesh}               [return 图层]
		 */
		addFly({
			color = "rgba(255,255,255,1)",
			curve = [],
			width = 1,
			length = 10,
			speed = 1,
			repeat = 1,
			texture = null,
			callback
		} = opt) {
			let colorArr = this.getColorArr(color);
			let geometry = new THREE.BufferGeometry();
			let material = new THREE.ShaderMaterial({
				uniforms: {
					color: {
						value: colorArr[0],
						type: "v3"
					},
					size: {
						value: width,
						type: "f"
					},
					u_map: {
						value: texture ? texture : this.texture,
						type: "t2"
					},
					u_len: {
						value: length,
						type: "f"
					},
					u_opacity: {
						value: colorArr[1],
						type: "f"
					},
					time: {
						value: -length,
						type: "f"
					},
					isTexture: {
						value: 1.0,
						type: "f"
					}
				},
				transparent: true,
				depthTest: false,
				depthWrite: false,
				vertexShader: this.flyShader.vertexshader,
				fragmentShader: this.flyShader.fragmentshader
			});
			const [position, u_index] = [
				[],
				[]
			];
			curve.forEach(function (elem, index) {
				position.push(elem.x, elem.y, elem.z);
				u_index.push(index);
			})
			geometry.addAttribute("position", new THREE.Float32BufferAttribute(position, 3));
			geometry.addAttribute("u_index", new THREE.Float32BufferAttribute(u_index, 1));
			let mesh = new THREE.Points(geometry, material);
			mesh.name = "fly";
			mesh._flyId = this.flyId;
			mesh._speed = speed;
			mesh._repeat = repeat;
			mesh._been = 0;
			mesh._total = curve.length;
			mesh._callback = callback;
			this.flyId++;
			this.flyArr.push(mesh);
			return mesh
		}
		/**
		 * 根据线条组生成路径
		 * @param {*} arr 需要生成的线条组
		 * @param {*} dpi 密度
		 */
		tranformPath(arr, dpi = 1) {
			const vecs = [];
			for (let i = 1; i < arr.length; i++) {
				let src = arr[i - 1];
				let dst = arr[i];
				let s = new THREE.Vector3(src.x, src.y, src.z);
				let d = new THREE.Vector3(dst.x, dst.y, dst.z);
				let length = s.distanceTo(d) * dpi;
				let len = Math.ceil(length);
				for (let i = 0; i <= len; i++) {
					vecs.push(s.clone().lerp(d, i / len))
				}
			}
			return vecs;
		}
		/**
		 * [remove 删除]
		 * @param   {Object}  mesh  [当前飞线]
		 */
		remove(mesh) {
			mesh.material.dispose();
			mesh.geometry.dispose();
			this.flyArr = this.flyArr.filter(elem => elem._flyId != mesh._flyId);
			mesh.parent.remove(mesh);
			mesh = null;
		}
		/**
		 * [animation 动画] 
		 * @param   {Number}  delta  [执行动画间隔时间] 
		 */
		animation(delta = 0.015) {
			if (delta > 0.2) return;
			this.flyArr.forEach(elem => {
				if (!elem.parent) return;
				if (elem._been > elem._repeat) {
					elem.visible = false;
					if (typeof elem._callback === 'function') {
						elem._callback(elem);
					}
					this.remove(elem)
				} else {
					let uniforms = elem.material.uniforms;
					//完结一次
					if (uniforms.time.value < elem._total) {
						uniforms.time.value += delta * (this.baicSpeed / delta) * elem._speed;
					} else {
						elem._been += 1;
						uniforms.time.value = -uniforms.u_len.value;
					}
				}
			})
		}
		color(c) {
			return new THREE.Color(c);
		}
		getColorArr(str) {
			if (Array.isArray(str)) return str; //error
			var _arr = [];
			str = str + '';
			str = str.toLowerCase().replace(/\s/g, "");
			if (/^((?:rgba)?)\(\s*([^\)]*)/.test(str)) {
				var arr = str.replace(/rgba\(|\)/gi, '').split(',');
				var hex = [
					pad2(Math.round(arr[0] * 1 || 0).toString(16)),
					pad2(Math.round(arr[1] * 1 || 0).toString(16)),
					pad2(Math.round(arr[2] * 1 || 0).toString(16))
				];
				_arr[0] = this.color('#' + hex.join(""));
				_arr[1] = Math.max(0, Math.min(1, (arr[3] * 1 || 0)));
			} else if ('transparent' === str) {
				_arr[0] = this.color();
				_arr[1] = 0;
			} else {
				_arr[0] = this.color(str);
				_arr[1] = 1;
			}

			function pad2(c) {
				return c.length == 1 ? '0' + c : '' + c;
			}
			return _arr;
		}
	}

	const PointShader = {
		vertexShader: `
            uniform float time;
            uniform float u_size;
            uniform float u_speed;
            uniform float u_height;
            uniform float u_minheight;
            uniform float u_opacity;
            
            attribute float v_index;
            attribute float v_loading;

            varying float v_opacity;
	        float lerp (float x,float y,float t ) {

				return ( 1.0 - t ) * x + t * y;

			}
            void main() { 
                float u_time = u_speed * time;
                v_opacity = 1.0; 
                if (time < 3.0) {
                    v_opacity = 0.0;
                } else if (time < 10.0) {
                    v_opacity = time / 10.0;
                }
                float _index = mod(v_loading + u_time, 1.0);
                float y = lerp(u_minheight, u_height, _index) + u_size * 0.5 * v_index;
                float v_size = (v_index / 3.0) * (u_size / 2.0) + u_size / 2.0;
                vec3 v_position = vec3(position.x, y, position.z);

                vec4 mvPosition = modelViewMatrix * vec4(v_position, 1.0);
				gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = v_size * 300.0 / (-mvPosition.z);
            
            }
        `,
		fragmentShader: `
            uniform sampler2D u_map;
            uniform vec3 u_color;

            varying float v_opacity;
            
            void main() { 
                vec4 v_color = vec4(u_color, v_opacity);
                vec4 ture = texture2D(u_map, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y));
                gl_FragColor = v_color * ture;
            }
            `
	}
};
