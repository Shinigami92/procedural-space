import { Mesh, MeshBasicMaterial, Object3D, PointLight, SphereGeometry } from 'three';

export default class Star extends Object3D {
	private mesh: Mesh;
	private rotationSpeed: number;

	constructor({ radius = 800, rotationSpeed = 0 }: { radius: number; rotationSpeed: number }) {
		super();
		this.rotationSpeed = rotationSpeed;
		this.mesh = new Mesh(
			new SphereGeometry(radius, 32, 32),
			new MeshBasicMaterial({ color: 0xfff5f2, wireframe: false })
		);
		this.add(new PointLight(0xffffff, 1, 3e4));
		this.add(this.mesh);
	}

	get radius(): number {
		return (this.mesh.geometry as SphereGeometry).parameters.radius;
	}

	public update(delta: number): void {
		this.mesh.rotation.y += this.rotationSpeed * delta;
	}
}
