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
