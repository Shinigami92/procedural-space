import {
	BufferAttribute,
	BufferGeometry,
	Color,
	InterleavedBufferAttribute,
	Math as ThreeMath,
	Object3D,
	Points,
	ShaderMaterial,
	Vector3
} from 'three';
import { GPUParticleSystem } from './GPUParticleSystem';

export interface SpawnParticleOptions {
	position?: Vector3;
	velocity?: Vector3;
	color?: Color;
	positionRandomness?: number;
	velocityRandomness?: number;
	colorRandomness?: number;
	turbulence?: number;
	lifetime?: number;
	size?: number;
	sizeRandomness?: number;
	smoothPosition?: boolean;
}

/**
 * GPU Particle Container
 * @author flimshaw - Charlie Hoey - http://charliehoey.com
 * @author Christopher Quadflieg / converted to typescript
 *
 * Subclass for particle containers, allows for very large arrays to be spread out
 */
export class GPUParticleContainer extends Object3D {
	public PARTICLE_COUNT: number;
	public PARTICLE_CURSOR: number;
	public time: number;
	public offset: number;
	public count: number;
	public DPR?: number;
	// tslint:disable-next-line:variable-name
	public GPUParticleSystem: GPUParticleSystem;
	public particleUpdate: boolean;
	public particleShaderGeo: BufferGeometry;
	public particleShaderMat: ShaderMaterial;
	public particleSystem: Points;

	private _position: Vector3;
	private _velocity: Vector3;
	private _color: Color;

	constructor(maxParticles: number = 100_000, particleSystem: GPUParticleSystem) {
		super();

		this.PARTICLE_COUNT = maxParticles;
		this.PARTICLE_CURSOR = 0;
		this.time = 0;
		this.offset = 0;
		this.count = 0;
		this.DPR = window.devicePixelRatio;
		this.GPUParticleSystem = particleSystem;
		this.particleUpdate = false;

		// geometry

		this.particleShaderGeo = new BufferGeometry();

		this.particleShaderGeo.addAttribute(
			'position',
			new BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true)
		);
		this.particleShaderGeo.addAttribute(
			'positionStart',
			new BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true)
		);
		this.particleShaderGeo.addAttribute(
			'startTime',
			new BufferAttribute(new Float32Array(this.PARTICLE_COUNT), 1).setDynamic(true)
		);
		this.particleShaderGeo.addAttribute(
			'velocity',
			new BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true)
		);
		this.particleShaderGeo.addAttribute(
			'turbulence',
			new BufferAttribute(new Float32Array(this.PARTICLE_COUNT), 1).setDynamic(true)
		);
		this.particleShaderGeo.addAttribute(
			'color',
			new BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true)
		);
		this.particleShaderGeo.addAttribute(
			'size',
			new BufferAttribute(new Float32Array(this.PARTICLE_COUNT), 1).setDynamic(true)
		);
		this.particleShaderGeo.addAttribute(
			'lifeTime',
			new BufferAttribute(new Float32Array(this.PARTICLE_COUNT), 1).setDynamic(true)
		);

		// material

		this.particleShaderMat = this.GPUParticleSystem.particleShaderMat;

		this._position = new Vector3();
		this._velocity = new Vector3();
		this._color = new Color();

		this.init();
	}

	public spawnParticle(options: SpawnParticleOptions = {}): void {
		const positionStartAttribute: InterleavedBufferAttribute = this.particleShaderGeo.getAttribute(
			'positionStart'
		) as InterleavedBufferAttribute;
		const startTimeAttribute: InterleavedBufferAttribute = this.particleShaderGeo.getAttribute(
			'startTime'
		) as InterleavedBufferAttribute;
		const velocityAttribute: InterleavedBufferAttribute = this.particleShaderGeo.getAttribute(
			'velocity'
		) as InterleavedBufferAttribute;
		const turbulenceAttribute: InterleavedBufferAttribute = this.particleShaderGeo.getAttribute(
			'turbulence'
		) as InterleavedBufferAttribute;
		const colorAttribute: InterleavedBufferAttribute = this.particleShaderGeo.getAttribute(
			'color'
		) as InterleavedBufferAttribute;
		const sizeAttribute: InterleavedBufferAttribute = this.particleShaderGeo.getAttribute(
			'size'
		) as InterleavedBufferAttribute;
		const lifeTimeAttribute: InterleavedBufferAttribute = this.particleShaderGeo.getAttribute(
			'lifeTime'
		) as InterleavedBufferAttribute;

		// setup reasonable default values for all arguments

		this._position =
			options.position !== undefined ? this._position.copy(options.position) : this._position.set(0, 0, 0);
		this._velocity =
			options.velocity !== undefined ? this._velocity.copy(options.velocity) : this._velocity.set(0, 0, 0);
		this._color = options.color !== undefined ? this._color.set(options.color) : this._color.set(0xffffff);

		const positionRandomness: number = options.positionRandomness !== undefined ? options.positionRandomness : 0;
		const velocityRandomness: number = options.velocityRandomness !== undefined ? options.velocityRandomness : 0;
		const colorRandomness: number = options.colorRandomness !== undefined ? options.colorRandomness : 1;
		const turbulence: number = options.turbulence !== undefined ? options.turbulence : 1;
		const lifetime: number = options.lifetime !== undefined ? options.lifetime : 5;
		let size: number = options.size !== undefined ? options.size : 10;
		const sizeRandomness: number = options.sizeRandomness !== undefined ? options.sizeRandomness : 0;
		const smoothPosition: boolean = options.smoothPosition !== undefined ? options.smoothPosition : false;

		if (this.DPR !== undefined) {
			size *= this.DPR;
		}

		const i: number = this.PARTICLE_CURSOR;

		// position

		positionStartAttribute.array[i * 3 + 0] =
			this._position.x + this.GPUParticleSystem.random() * positionRandomness;
		positionStartAttribute.array[i * 3 + 1] =
			this._position.y + this.GPUParticleSystem.random() * positionRandomness;
		positionStartAttribute.array[i * 3 + 2] =
			this._position.z + this.GPUParticleSystem.random() * positionRandomness;

		if (smoothPosition === true) {
			positionStartAttribute.array[i * 3 + 0] += -(this._velocity.x * this.GPUParticleSystem.random());
			positionStartAttribute.array[i * 3 + 1] += -(this._velocity.y * this.GPUParticleSystem.random());
			positionStartAttribute.array[i * 3 + 2] += -(this._velocity.z * this.GPUParticleSystem.random());
		}

		// velocity

		const maxVel: number = 2;

		let velX: number = this._velocity.x + this.GPUParticleSystem.random() * velocityRandomness;
		let velY: number = this._velocity.y + this.GPUParticleSystem.random() * velocityRandomness;
		let velZ: number = this._velocity.z + this.GPUParticleSystem.random() * velocityRandomness;

		velX = ThreeMath.clamp((velX - -maxVel) / (maxVel - -maxVel), 0, 1);
		velY = ThreeMath.clamp((velY - -maxVel) / (maxVel - -maxVel), 0, 1);
		velZ = ThreeMath.clamp((velZ - -maxVel) / (maxVel - -maxVel), 0, 1);

		velocityAttribute.array[i * 3 + 0] = velX;
		velocityAttribute.array[i * 3 + 1] = velY;
		velocityAttribute.array[i * 3 + 2] = velZ;

		// color

		this._color.r = ThreeMath.clamp(this._color.r + this.GPUParticleSystem.random() * colorRandomness, 0, 1);
		this._color.g = ThreeMath.clamp(this._color.g + this.GPUParticleSystem.random() * colorRandomness, 0, 1);
		this._color.b = ThreeMath.clamp(this._color.b + this.GPUParticleSystem.random() * colorRandomness, 0, 1);

		colorAttribute.array[i * 3 + 0] = this._color.r;
		colorAttribute.array[i * 3 + 1] = this._color.g;
		colorAttribute.array[i * 3 + 2] = this._color.b;

		// turbulence, size, lifetime and starttime

		turbulenceAttribute.array[i] = turbulence;
		sizeAttribute.array[i] = size + this.GPUParticleSystem.random() * sizeRandomness;
		lifeTimeAttribute.array[i] = lifetime;
		startTimeAttribute.array[i] = this.time + this.GPUParticleSystem.random() * 2e-2;

		// offset

		if (this.offset === 0) {
			this.offset = this.PARTICLE_CURSOR;
		}

		// counter and cursor

		this.count++;
		this.PARTICLE_CURSOR++;

		if (this.PARTICLE_CURSOR >= this.PARTICLE_COUNT) {
			this.PARTICLE_CURSOR = 0;
		}

		this.particleUpdate = true;
	}

	public init(): void {
		this.particleSystem = new Points(this.particleShaderGeo, this.particleShaderMat);
		this.particleSystem.frustumCulled = false;
		this.add(this.particleSystem);
	}

	public update(time: number): void {
		this.time = time;
		this.particleShaderMat.uniforms.uTime.value = time;

		this.geometryUpdate();
	}

	public geometryUpdate(): void {
		if (this.particleUpdate === true) {
			this.particleUpdate = false;

			const positionStartAttribute: BufferAttribute = this.particleShaderGeo.getAttribute(
				'positionStart'
			) as BufferAttribute;
			const startTimeAttribute: BufferAttribute = this.particleShaderGeo.getAttribute(
				'startTime'
			) as BufferAttribute;
			const velocityAttribute: BufferAttribute = this.particleShaderGeo.getAttribute(
				'velocity'
			) as BufferAttribute;
			const turbulenceAttribute: BufferAttribute = this.particleShaderGeo.getAttribute(
				'turbulence'
			) as BufferAttribute;
			const colorAttribute: BufferAttribute = this.particleShaderGeo.getAttribute('color') as BufferAttribute;
			const sizeAttribute: BufferAttribute = this.particleShaderGeo.getAttribute('size') as BufferAttribute;
			const lifeTimeAttribute: BufferAttribute = this.particleShaderGeo.getAttribute(
				'lifeTime'
			) as BufferAttribute;

			if (this.offset + this.count < this.PARTICLE_COUNT) {
				positionStartAttribute.updateRange.offset = this.offset * positionStartAttribute.itemSize;
				startTimeAttribute.updateRange.offset = this.offset * startTimeAttribute.itemSize;
				velocityAttribute.updateRange.offset = this.offset * velocityAttribute.itemSize;
				turbulenceAttribute.updateRange.offset = this.offset * turbulenceAttribute.itemSize;
				colorAttribute.updateRange.offset = this.offset * colorAttribute.itemSize;
				sizeAttribute.updateRange.offset = this.offset * sizeAttribute.itemSize;
				lifeTimeAttribute.updateRange.offset = this.offset * lifeTimeAttribute.itemSize;

				positionStartAttribute.updateRange.count = this.count * positionStartAttribute.itemSize;
				startTimeAttribute.updateRange.count = this.count * startTimeAttribute.itemSize;
				velocityAttribute.updateRange.count = this.count * velocityAttribute.itemSize;
				turbulenceAttribute.updateRange.count = this.count * turbulenceAttribute.itemSize;
				colorAttribute.updateRange.count = this.count * colorAttribute.itemSize;
				sizeAttribute.updateRange.count = this.count * sizeAttribute.itemSize;
				lifeTimeAttribute.updateRange.count = this.count * lifeTimeAttribute.itemSize;
			} else {
				positionStartAttribute.updateRange.offset = 0;
				startTimeAttribute.updateRange.offset = 0;
				velocityAttribute.updateRange.offset = 0;
				turbulenceAttribute.updateRange.offset = 0;
				colorAttribute.updateRange.offset = 0;
				sizeAttribute.updateRange.offset = 0;
				lifeTimeAttribute.updateRange.offset = 0;

				// Use -1 to update the entire buffer, see #11476
				positionStartAttribute.updateRange.count = -1;
				startTimeAttribute.updateRange.count = -1;
				velocityAttribute.updateRange.count = -1;
				turbulenceAttribute.updateRange.count = -1;
				colorAttribute.updateRange.count = -1;
				sizeAttribute.updateRange.count = -1;
				lifeTimeAttribute.updateRange.count = -1;
			}

			positionStartAttribute.needsUpdate = true;
			startTimeAttribute.needsUpdate = true;
			velocityAttribute.needsUpdate = true;
			turbulenceAttribute.needsUpdate = true;
			colorAttribute.needsUpdate = true;
			sizeAttribute.needsUpdate = true;
			lifeTimeAttribute.needsUpdate = true;

			this.offset = 0;
			this.count = 0;
		}
	}

	public dispose(): void {
		this.particleShaderGeo.dispose();
	}
}
