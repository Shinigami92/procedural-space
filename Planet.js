Planet = function(parameters) {
	THREE.Object3D.apply(this, arguments);

	parameters = parameters || {};
	var radius = parameters.radius !== undefined ? parameters.radius : 10;
	var orbitalSpeed = parameters.orbitalSpeed !== undefined ? parameters.orbitalSpeed : 0;
	var rotationSpeed = parameters.rotationSpeed !== undefined ? parameters.rotationSpeed : 0;

	var mesh = new THREE.Mesh(
		new THREE.SphereGeometry(radius, 32, 32),
		new THREE.MeshStandardMaterial({color: 0xff0000, wireframe: true})
	);
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	this.add(mesh);

	// Add vars to instance
	this.mesh = mesh;
	this.rotationSpeed = rotationSpeed;
	this.orbitalPivot = null;
	this.orbitalSpeed = orbitalSpeed;
};

Planet.prototype = Object.create(THREE.Object3D.prototype);
Planet.prototype.constructor = Planet;

Planet.prototype.setOrbitalPivot = function(star) {
	this.orbitalPivot = new THREE.Object3D();
	star.add(this.orbitalPivot);
	this.orbitalPivot.add(this);
};

Planet.prototype.update = function(delta) {
	if (this.orbitalPivot !== null) {
		this.orbitalPivot.rotation.y += this.orbitalSpeed * delta;
	}
	this.mesh.rotation.y += this.rotationSpeed * delta;
};
