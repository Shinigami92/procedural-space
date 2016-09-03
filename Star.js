class Star extends THREE.Object3D {
	constructor({ radius = 800, rotationSpeed = 0 }) {
		if (typeof radius !== 'number') throw new TypeError('expected type of radius was Number, got ' + typeof radius);
		if (typeof rotationSpeed !== 'number') throw new TypeError('expected type of rotationSpeed was Number, got ' + typeof rotationSpeed);
		super();
		this.rotationSpeed = rotationSpeed;
		this.mesh = new THREE.Mesh(
			new THREE.SphereGeometry(radius, 32, 32),
			new THREE.MeshBasicMaterial({ color: 0xfff5f2, wireframe: false })
		);
		this.add(new THREE.PointLight(0xffffff, 1, 3e4));
		this.add(this.mesh);
	}

	get radius() {
		return this.mesh.geometry.parameters.radius;
	}

	update(delta) {
		this.mesh.rotation.y += this.rotationSpeed * delta;
	}
}
