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
		var starRadius = parameters.star.radius !== undefined ? parameters.star.radius : randomInt(1500, 6000);
		var starRotationSpeed = parameters.star.rotationSpeed !== undefined ? parameters.star.rotationSpeed : 0;
		star = new Star({radius: starRadius, rotationSpeed: starRotationSpeed});
	}

	var planetCount = randomInt(3, 10);
	var planetRadiusMin = 300;
	var planetRadiusMax = 800;
	var nextPlanetPosX = star.getRadius();
	var planets = [];
	for (var i = 0; i < planetCount; i++) {
		var pos = i + 1;
		var planetRadius = randomInt(planetRadiusMin, planetRadiusMax);
		var planetColor = new THREE.Color().setHSL(Math.random(), 1, 0.5);
		var p = new Planet({radius: planetRadius, color: planetColor, rotationSpeed: (Math.random() * (0.3 - 0.05) + 0.05) * 0.1, orbitalSpeed: (0.1 * (planetCount / pos) + (Math.random() / 5 - 0.1)) * 0.01});
		nextPlanetPosX += planetRadius * 2 + randomInt(planetRadiusMax * 5, planetRadiusMax * 15);
		p.position.x = -nextPlanetPosX;
		planets[i] = p;
	}
	return new SolarSystem(star, planets);
};
