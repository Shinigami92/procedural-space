Star = function(parameters) {
	THREE.Object3D.apply(this, arguments);
	parameters = parameters || {};
	var radius = parameters.radius !== undefined ? parameters.radius : 100;
	var rotationSpeed = parameters.rotationSpeed !== undefined ? parameters.rotationSpeed : 0;

	var light = new THREE.PointLight(0xffffff, 1, 3e5);
	var mesh = new THREE.Mesh(
		new THREE.SphereGeometry(radius, 32, 32),
		new THREE.MeshBasicMaterial({color: 0xfff5f2, wireframe: true})
	);
	this.add(light);
	this.add(mesh);

	// Add vars to instance
	this.mesh = mesh;
	this.rotationSpeed = rotationSpeed;
};

Star.prototype = Object.create(THREE.Object3D.prototype);
Star.prototype.constructor = Star;

Star.prototype.update = function(delta) {
	this.mesh.rotation.y += this.rotationSpeed * delta;
};
