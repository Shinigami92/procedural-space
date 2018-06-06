import { Color, Mesh, MeshStandardMaterial, Object3D, SphereGeometry } from 'three';
import Star from './Star';

export default class Planet extends Object3D {
	public radius: number;
	public mesh: Mesh;

	// tslint:disable-next-line:variable-name
	private _orbitalPivot: Object3D | null;
	private rotationSpeed: number;
	private orbitalSpeed: number;

	constructor({
		radius = 10,
		color = new Color(0x87421f),
		orbitalSpeed = 0,
		rotationSpeed = 0
	}: {
		radius: number;
		color: Color;
		orbitalSpeed: number;
		rotationSpeed: number;
	}) {
		super();
		this._orbitalPivot = null;
		this.rotationSpeed = rotationSpeed;
		this.orbitalSpeed = orbitalSpeed;
		this.radius = radius;

		this.mesh = new Mesh(new SphereGeometry(radius, 32, 32), new MeshStandardMaterial({ color, wireframe: false }));
		this.mesh.receiveShadow = true;
		this.mesh.castShadow = true;
		this.add(this.mesh);
	}

	get orbitalPivot(): Object3D | null {
		return this._orbitalPivot;
	}

	set orbitalPivot(star: Object3D | null) {
		this._orbitalPivot = new Object3D();
		(star as Star).add(this._orbitalPivot);
		this._orbitalPivot.add(this);
	}

	public update(delta: number): void {
		if (this._orbitalPivot !== null) {
			this._orbitalPivot.rotation.y += this.orbitalSpeed * delta;
		}
		this.mesh.rotation.y += this.rotationSpeed * delta;
	}
}
