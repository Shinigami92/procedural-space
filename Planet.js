class Planet extends THREE.Object3D {
	constructor({ radius = 10, color = new THREE.Color(0x87421f), orbitalSpeed = 0, rotationSpeed = 0 }) {
		if (typeof radius !== 'number') throw new TypeError('expected type of radius was Number, got ' + typeof radius);
		if (typeof color !== 'object' || !(color instanceof THREE.Color)) throw new TypeError('expected type of color was THREE.Color, got ' + typeof color);
		if (typeof orbitalSpeed !== 'number') throw new TypeError('expected type of orbitalSpeed was Number, got ' + typeof orbitalSpeed);
		if (typeof rotationSpeed !== 'number') throw new TypeError('expected type of rotationSpeed was Number, got ' + typeof rotationSpeed);
		super();
		this._orbitalPivot = null;
		this.rotationSpeed = rotationSpeed;
		this.orbitalSpeed = orbitalSpeed;
		this.radius = radius;

		this.mesh = new THREE.Mesh(
			new THREE.SphereGeometry(radius, 32, 32),
			new THREE.MeshStandardMaterial({ color: color, wireframe: false })
		);
		this.mesh.receiveShadow = true;
		this.mesh.castShadow = true;
		this.add(this.mesh);
	}

	get orbitalPivot() {
		return this._orbitalPivot;
	}

	set orbitalPivot(star) {
		this._orbitalPivot = new THREE.Object3D();
		star.add(this._orbitalPivot);
		this._orbitalPivot.add(this);
	}

	update(delta) {
		if (this.orbitalPivot !== null) {
			this._orbitalPivot.rotation.y += this.orbitalSpeed * delta;
		}
		this.mesh.rotation.y += this.rotationSpeed * delta;
	}
}
