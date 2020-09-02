
class CreateEarth extends EffectBase {
    constructor(config) {
        super(config);

        this.group = new THREE.Group();

        this.events = config.events || [];

        this.eventArray = [];

        this.keyType = false;

        this.createLines();

        this.__uuid = 0;
        // 用于存储当前已经打点好的线条
        this.endLine = [];
        this.starLine = [];
    }

    createLines() {
        // 创建所有线条
        const group = new THREE.Group();

        // 创建时的线
        this.inLine = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xee0000, depthWrite: false })
        )
        // 创建时的线
        this.allLine = new THREE.LineSegments(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xffffff, depthWrite: false })
        )
        // 创建辅助线
        // 创建时的线
        this.helpLine = new THREE.LineSegments(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xffff00, depthWrite: false })
        )

        this.inLine.renderOrder = 1;
        this.allLine.renderOrder = 1;
        this.helpLine.renderOrder = 1;
        group.add(this.inLine, this.allLine, this.helpLine);

        this.group.add(group);
    }

    updateInLine() {
        const position = [];
        for (let i = 0; i < this.starLine.length; i++) {
            const elem = this.starLine[i];
            position.push(elem.x, 0, elem.z);
        };
        this.inLine.geometry.addAttribute("position", new THREE.Float32BufferAttribute(position, 3));
    }

    updateHelpLine(vec) {
        const position = [];
        if (this.starLine.length != 0) {
            const v = this.starLine[this.starLine.length - 1];
            position.push(v.x, 0, v.z);
            position.push(vec.x, 0, vec.z);
        }

        this.helpLine.geometry.addAttribute("position", new THREE.Float32BufferAttribute(position, 3));
    }

    updateAllLine() {
        const position = [];
        for (let i = 0; i < this.endLine.length; i++) {
            for (let x = 0; x < this.endLine[i].length - 1; x++) {
                const elem = this.endLine[i][x];
                const next = this.endLine[i][x + 1];
                position.push(elem.x, 0, elem.z);
                position.push(next.x, 0, next.z);
            }
        };
        this.allLine.geometry.addAttribute("position", new THREE.Float32BufferAttribute(position, 3));

        // 把所有线条更新到UI
        VM.updateLine(this.endLine);
    }

    // 创建地板图
    createFoot(opts) {
        const txueLoader = new THREE.TextureLoader();

        txueLoader.load(opts.img, (texture) => {
            this.createBackground(texture, opts.width, opts.height);
        })
    }
    // 背景图
    createBackground(texture, width, height) {

        if (this.foot) {
            THREE_UTILS.disposeNode(this.foot);
            this.events = this.events.filter(child => child.name != "foot");
        }


        const geometry = new THREE.PlaneBufferGeometry(width, height, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            opacity: 1,
            // transparent: true,
            side: THREE.DoubleSide,
            map: texture
        });

        this.foot = new THREE.Mesh(geometry, material);
        this.foot.rotation.x = -Math.PI / 2;
        this.foot.position.y = -1;
        this.foot.name = "foot";
        this.foot.__uuid = this.group.uuid;

        this.events.push(this.foot)

        this.group.add(this.foot);

    }

    onClick = (intersect, event) => {
        if (!intersect || event.buttons != 1) return false;
        // 加入
        if (this.keyType) {
            this.starLine.push(intersect.point);
            this.updateInLine();
        }
    }

    onMove = (intersect, event) => {
        if (!intersect) return false;
        // 加入
        if (this.keyType) {
            this.updateHelpLine(intersect.point);
        }
    }

    onKey = (code, status) => {
        if (this.keyType === status) return false;
        this.keyType = status;
        if (this.keyType == false) {
            if (this.starLine.length > 1) {
                this.endLine.push(this.starLine);
            }
            this.starLine = [];
            this.updateAllLine();
            this.updateHelpLine();
        } else {

        }
        this.updateInLine();
    }

    animate = (dt, clock) => {

    }
}