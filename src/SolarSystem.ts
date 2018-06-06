import { Color, Math as ThreeMath, Object3D } from 'three';
import Planet from './Planet';
import Star from './Star';

export default class SolarSystem extends Object3D {
	// tslint:disable-next-line:typedef
	public static generate({ star = { radius: ThreeMath.randInt(1500, 6000), rotationSpeed: 0 } } = {}): SolarSystem {
		// tslint:disable-next-line:variable-name
		let _star: Star;
		if (!(star instanceof Star)) {
			_star = new Star(star);
		} else {
			_star = star;
		}

		const planetCount: number = ThreeMath.randInt(3, 10);
		const planetRadiusMin: number = 300;
		const planetRadiusMax: number = 800;
		let nextPlanetPosX: number = _star.radius;
		const planets: Planet[] = [];
		for (let i: number = 0; i < planetCount; i++) {
			const pos: number = i + 1;
			const planetRadius: number = ThreeMath.randInt(planetRadiusMin, planetRadiusMax);
			const planetColor: Color = new Color().setHSL(Math.random(), 1, 0.5);
			const p: Planet = new Planet({
				radius: planetRadius,
				color: planetColor,
				orbitalSpeed: (Math.random() * (0.3 - 0.05) + 0.05) * 0.1,
				rotationSpeed: (0.1 * (planetCount / pos) + (Math.random() / 5 - 0.1)) * 0.01
			});
			nextPlanetPosX += planetRadius * 2 + ThreeMath.randInt(planetRadiusMax * 5, planetRadiusMax * 15);
			p.position.x = -nextPlanetPosX;
			planets[i] = p;
		}
		return new SolarSystem(_star, planets);
	}

	private star: any;
	private planets: any[];

	constructor(star: Star, planets: Planet[]) {
		super();
		this.star = star;
		this.planets = planets;

		this.add(this.star);
		this.planets.forEach((p: Planet) => (p.orbitalPivot = this.star));
	}

	public update(delta: number): void {
		this.star.update(delta);
		this.planets.forEach((p: Planet) => p.update(delta));
	}
}
