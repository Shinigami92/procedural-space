import {
	MeshBasicMaterial,
	Object3D,
	Mesh,
	SphereGeometry,
	PointLight
} from 'three';

export default class Star extends Object3D {
	private mesh: Mesh;
	private rotationSpeed: number;

	constructor({ radius = 800, rotationSpeed = 0 }) {
		if (typeof radius !== 'number')
			throw new TypeError(
				'expected type of radius was Number, got ' + typeof radius
			);
		if (typeof rotationSpeed !== 'number')
			throw new TypeError(
				'expected type of rotationSpeed was Number, got ' +
					typeof rotationSpeed
			);
		super();
		this.rotationSpeed = rotationSpeed;
		this.mesh = new Mesh(
			new SphereGeometry(radius, 32, 32),
			new MeshBasicMaterial({ color: 0xfff5f2, wireframe: false })
		);
		this.add(new PointLight(0xffffff, 1, 3e4));
		this.add(this.mesh);
	}

	get radius() {
		return (this.mesh.geometry as SphereGeometry).parameters.radius;
	}

	update(delta: number) {
		this.mesh.rotation.y += this.rotationSpeed * delta;
	}
}
