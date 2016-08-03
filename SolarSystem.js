SolarSystem = function(star, planets) {
	THREE.Object3D.apply(this, arguments);
	this.star = star;
	this.planets = planets;

	this.add(star);
	this.planets.forEach(p => p.setOrbitalPivot(this));
};

SolarSystem.prototype = Object.create(THREE.Object3D.prototype);
SolarSystem.prototype.constructor = SolarSystem;

SolarSystem.prototype.update = function(delta) {
	this.star.update(delta);
	this.planets.forEach(p => p.update(delta));
};

SolarSystem.generate = function(parameters) {
	parameters = parameters || {};
	parameters.star = parameters.star !== undefined ? parameters.star : {};

	var star;
	if (parameters.star instanceof Star) {
		star = parameters.star;
	} else {
		var starRadius = parameters.star.radius !== undefined ? parameters.star.radius : randomInt(600, 1600);
		var starRotationSpeed = parameters.star.rotationSpeed !== undefined ? parameters.star.rotationSpeed : 0;
		star = new Star({radius: starRadius, rotationSpeed: starRotationSpeed});
	}

	var rndInt = randomInt(3, 10);
	var nextPlanetPosX = star.getRadius();
	var planets = [];
	for (var i = 0; i < rndInt; i++) {
		var pos = i + 1;
		var planetRadius = randomInt(30, 80);
		var planetColor = new THREE.Color().setHSL(Math.random(), 1, 0.5);
		var p = new Planet({radius: planetRadius, color: planetColor, rotationSpeed: Math.random() * (0.3 - 0.05) + 0.05, orbitalSpeed: 0.1 * (rndInt / pos) + (Math.random() / 5 - 0.1)});
		nextPlanetPosX += planetRadius * 2 + randomInt(planetRadius + 50, 600);
		p.position.x = -nextPlanetPosX;
		planets[i] = p;
	}
	return new SolarSystem(star, planets);
};
