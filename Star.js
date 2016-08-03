Star = function(parameters) {
	THREE.Object3D.apply(this, arguments);
	parameters = parameters || {};
	var radius = parameters.radius !== undefined ? parameters.radius : 800;
	var rotationSpeed = parameters.rotationSpeed !== undefined ? parameters.rotationSpeed : 0;

	var light = new THREE.PointLight(0xffffff, 1, 3e4);
	var mesh = new THREE.Mesh(
		new THREE.SphereGeometry(radius, 32, 32),
		new THREE.MeshBasicMaterial({color: 0xfff5f2, wireframe: false})
	);
	this.add(light);
	this.add(mesh);

	// Add vars to instance
	this.mesh = mesh;
	this.rotationSpeed = rotationSpeed;
};

Star.prototype = Object.create(THREE.Object3D.prototype);
Star.prototype.constructor = Star;

Star.prototype.getRadius = function() {
	return this.mesh.geometry.parameters.radius;
};

Star.prototype.update = function(delta) {
	this.mesh.rotation.y += this.rotationSpeed * delta;
};
