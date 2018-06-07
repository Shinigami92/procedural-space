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

/* tslint:disable */

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
	public DPR: number;
	public GPUParticleSystem: GPUParticleSystem;
	public particleUpdate: boolean;
	public particleShaderGeo: BufferGeometry;
	public particleShaderMat: ShaderMaterial;
	private _position: Vector3;
	private _velocity: Vector3;
	private _color: Color;
	public particleSystem: Points;

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

	spawnParticle(options: SpawnParticleOptions = {}) {
		var positionStartAttribute = this.particleShaderGeo.getAttribute('positionStart') as InterleavedBufferAttribute;
		var startTimeAttribute = this.particleShaderGeo.getAttribute('startTime') as InterleavedBufferAttribute;
		var velocityAttribute = this.particleShaderGeo.getAttribute('velocity') as InterleavedBufferAttribute;
		var turbulenceAttribute = this.particleShaderGeo.getAttribute('turbulence') as InterleavedBufferAttribute;
		var colorAttribute = this.particleShaderGeo.getAttribute('color') as InterleavedBufferAttribute;
		var sizeAttribute = this.particleShaderGeo.getAttribute('size') as InterleavedBufferAttribute;
		var lifeTimeAttribute = this.particleShaderGeo.getAttribute('lifeTime') as InterleavedBufferAttribute;

		// setup reasonable default values for all arguments

		this._position =
			options.position !== undefined ? this._position.copy(options.position) : this._position.set(0, 0, 0);
		this._velocity =
			options.velocity !== undefined ? this._velocity.copy(options.velocity) : this._velocity.set(0, 0, 0);
		this._color = options.color !== undefined ? this._color.set(options.color) : this._color.set(0xffffff);

		var positionRandomness = options.positionRandomness !== undefined ? options.positionRandomness : 0;
		var velocityRandomness = options.velocityRandomness !== undefined ? options.velocityRandomness : 0;
		var colorRandomness = options.colorRandomness !== undefined ? options.colorRandomness : 1;
		var turbulence = options.turbulence !== undefined ? options.turbulence : 1;
		var lifetime = options.lifetime !== undefined ? options.lifetime : 5;
		var size = options.size !== undefined ? options.size : 10;
		var sizeRandomness = options.sizeRandomness !== undefined ? options.sizeRandomness : 0;
		var smoothPosition = options.smoothPosition !== undefined ? options.smoothPosition : false;

		if (this.DPR !== undefined) size *= this.DPR;

		var i = this.PARTICLE_CURSOR;

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

		var maxVel = 2;

		var velX = this._velocity.x + this.GPUParticleSystem.random() * velocityRandomness;
		var velY = this._velocity.y + this.GPUParticleSystem.random() * velocityRandomness;
		var velZ = this._velocity.z + this.GPUParticleSystem.random() * velocityRandomness;

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

	init() {
		this.particleSystem = new Points(this.particleShaderGeo, this.particleShaderMat);
		this.particleSystem.frustumCulled = false;
		this.add(this.particleSystem);
	}

	update(time: number) {
		this.time = time;
		this.particleShaderMat.uniforms.uTime.value = time;

		this.geometryUpdate();
	}

	geometryUpdate() {
		if (this.particleUpdate === true) {
			this.particleUpdate = false;

			var positionStartAttribute = this.particleShaderGeo.getAttribute('positionStart') as BufferAttribute;
			var startTimeAttribute = this.particleShaderGeo.getAttribute('startTime') as BufferAttribute;
			var velocityAttribute = this.particleShaderGeo.getAttribute('velocity') as BufferAttribute;
			var turbulenceAttribute = this.particleShaderGeo.getAttribute('turbulence') as BufferAttribute;
			var colorAttribute = this.particleShaderGeo.getAttribute('color') as BufferAttribute;
			var sizeAttribute = this.particleShaderGeo.getAttribute('size') as BufferAttribute;
			var lifeTimeAttribute = this.particleShaderGeo.getAttribute('lifeTime') as BufferAttribute;

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

	dispose() {
		this.particleShaderGeo.dispose();
	}
}
