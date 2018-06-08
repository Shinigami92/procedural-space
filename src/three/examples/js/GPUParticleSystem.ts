import { AdditiveBlending, Object3D, RepeatWrapping, ShaderMaterial, Texture, TextureLoader } from 'three';
import { GPUParticleContainer, SpawnParticleOptions } from './GPUParticleContainer';

/**
 * GPU Particle System
 * @author flimshaw - Charlie Hoey - http://charliehoey.com
 * @author Christopher Quadflieg / converted to typescript
 *
 * A simple to use, general purpose GPU system. Particles are spawn-and-forget with
 * several options available, and do not require monitoring or cleanup after spawning.
 * Because the paths of all particles are completely deterministic once spawned, the scale
 * and direction of time is also variable.
 *
 * Currently uses a static wrapping perlin noise texture for turbulence, and a small png texture for
 * particles, but adding support for a particle texture atlas or changing to a different type of turbulence
 * would be a fairly light day's work.
 *
 * Shader and javascript packing code derrived from several Stack Overflow examples.
 *
 */
export class GPUParticleSystem extends Object3D {
	public PARTICLE_COUNT: number;
	public PARTICLE_CONTAINERS: any;
	public PARTICLE_NOISE_TEXTURE: any;
	public PARTICLE_SPRITE_TEXTURE: any;
	public PARTICLES_PER_CONTAINER: number;
	public PARTICLE_CURSOR: number;
	public time: number;
	public particleContainers: GPUParticleContainer[];
	public rand: number[];
	public random: () => number;
	public particleNoiseTex: any;
	public particleSpriteTex: any;
	public particleShaderMat: ShaderMaterial;

	constructor(
		options: {
			maxParticles?: number;
			containerCount?: number;
			particleNoiseTex?: Texture | null;
			particleSpriteTex?: Texture | null;
		} = {}
	) {
		super();
		this.PARTICLE_COUNT = options.maxParticles || 1_000_000;
		this.PARTICLE_CONTAINERS = options.containerCount || 1;

		this.PARTICLE_NOISE_TEXTURE = options.particleNoiseTex || null;
		this.PARTICLE_SPRITE_TEXTURE = options.particleSpriteTex || null;

		this.PARTICLES_PER_CONTAINER = Math.ceil(this.PARTICLE_COUNT / this.PARTICLE_CONTAINERS);
		this.PARTICLE_CURSOR = 0;
		this.time = 0;
		this.particleContainers = [];
		this.rand = [];

		// custom vertex and fragement shader

		// tslint:disable-next-line:variable-name
		const GPUParticleShader: {
			vertexShader: string;
			fragmentShader: string;
		} = {
			vertexShader: [
				'uniform float uTime;',
				'uniform float uScale;',
				'uniform sampler2D tNoise;',

				'attribute vec3 positionStart;',
				'attribute float startTime;',
				'attribute vec3 velocity;',
				'attribute float turbulence;',
				'attribute vec3 color;',
				'attribute float size;',
				'attribute float lifeTime;',

				'varying vec4 vColor;',
				'varying float lifeLeft;',

				'void main() {',

				// unpack things from our attributes'

				'	vColor = vec4( color, 1.0 );',

				// convert our velocity back into a value we can use'

				'	vec3 newPosition;',
				'	vec3 v;',

				'	float timeElapsed = uTime - startTime;',

				'	lifeLeft = 1.0 - ( timeElapsed / lifeTime );',

				'	gl_PointSize = ( uScale * size ) * lifeLeft;',

				'	v.x = ( velocity.x - 0.5 ) * 3.0;',
				'	v.y = ( velocity.y - 0.5 ) * 3.0;',
				'	v.z = ( velocity.z - 0.5 ) * 3.0;',

				'	newPosition = positionStart + ( v * 10.0 ) * timeElapsed;',

				// tslint:disable-next-line:max-line-length
				'	vec3 noise = texture2D( tNoise, vec2( newPosition.x * 0.015 + ( uTime * 0.05 ), newPosition.y * 0.02 + ( uTime * 0.015 ) ) ).rgb;',
				'	vec3 noiseVel = ( noise.rgb - 0.5 ) * 30.0;',

				// tslint:disable-next-line:max-line-length
				'	newPosition = mix( newPosition, newPosition + vec3( noiseVel * ( turbulence * 5.0 ) ), ( timeElapsed / lifeTime ) );',

				'	if( v.y > 0. && v.y < .05 ) {',

				'		lifeLeft = 0.0;',

				'	}',

				'	if( v.x < - 1.45 ) {',

				'		lifeLeft = 0.0;',

				'	}',

				'	if( timeElapsed > 0.0 ) {',

				'		gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );',

				'	} else {',

				'		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
				'		lifeLeft = 0.0;',
				'		gl_PointSize = 0.;',

				'	}',

				'}'
			].join('\n'),

			fragmentShader: [
				'float scaleLinear( float value, vec2 valueDomain ) {',

				'	return ( value - valueDomain.x ) / ( valueDomain.y - valueDomain.x );',

				'}',

				'float scaleLinear( float value, vec2 valueDomain, vec2 valueRange ) {',

				'	return mix( valueRange.x, valueRange.y, scaleLinear( value, valueDomain ) );',

				'}',

				'varying vec4 vColor;',
				'varying float lifeLeft;',

				'uniform sampler2D tSprite;',

				'void main() {',

				'	float alpha = 0.;',

				'	if( lifeLeft > 0.995 ) {',

				'		alpha = scaleLinear( lifeLeft, vec2( 1.0, 0.995 ), vec2( 0.0, 1.0 ) );',

				'	} else {',

				'		alpha = lifeLeft * 0.75;',

				'	}',

				'	vec4 tex = texture2D( tSprite, gl_PointCoord );',
				'	gl_FragColor = vec4( vColor.rgb * tex.a, alpha * tex.a );',

				'}'
			].join('\n')
		};

		// preload a million random numbers

		let i: number;

		for (i = 1e5; i > 0; i--) {
			this.rand.push(Math.random() - 0.5);
		}

		this.random = function(): number {
			return ++i >= this.rand.length ? this.rand[(i = 1)] : this.rand[i];
		};

		const textureLoader: TextureLoader = new TextureLoader();

		this.particleNoiseTex = this.PARTICLE_NOISE_TEXTURE || textureLoader.load('textures/perlin-512.png');
		this.particleNoiseTex.wrapS = this.particleNoiseTex.wrapT = RepeatWrapping;

		this.particleSpriteTex = this.PARTICLE_SPRITE_TEXTURE || textureLoader.load('textures/particle2.png');
		this.particleSpriteTex.wrapS = this.particleSpriteTex.wrapT = RepeatWrapping;

		this.particleShaderMat = new ShaderMaterial({
			blending: AdditiveBlending,
			depthWrite: false,
			fragmentShader: GPUParticleShader.fragmentShader,
			transparent: true,
			uniforms: {
				tNoise: {
					value: this.particleNoiseTex
				},
				tSprite: {
					value: this.particleSpriteTex
				},
				uScale: {
					value: 1.0
				},
				uTime: {
					value: 0.0
				}
			},
			vertexShader: GPUParticleShader.vertexShader
		});

		// define defaults for all values

		this.particleShaderMat.defaultAttributeValues.particlePositionsStartTime = [0, 0, 0, 0];
		this.particleShaderMat.defaultAttributeValues.particleVelColSizeLife = [0, 0, 0, 0];

		this.init();
	}

	public init(): void {
		for (let i: number = 0; i < this.PARTICLE_CONTAINERS; i++) {
			const c: GPUParticleContainer = new GPUParticleContainer(this.PARTICLES_PER_CONTAINER, this);
			this.particleContainers.push(c);
			this.add(c);
		}
	}

	public spawnParticle(options: SpawnParticleOptions = {}): void {
		this.PARTICLE_CURSOR++;

		if (this.PARTICLE_CURSOR >= this.PARTICLE_COUNT) {
			this.PARTICLE_CURSOR = 1;
		}

		const currentContainer: GPUParticleContainer = this.particleContainers[
			Math.floor(this.PARTICLE_CURSOR / this.PARTICLES_PER_CONTAINER)
		];

		currentContainer.spawnParticle(options);
	}

	public update(time: number): void {
		for (let i: number = 0; i < this.PARTICLE_CONTAINERS; i++) {
			this.particleContainers[i].update(time);
		}
	}

	public dispose(): void {
		this.particleShaderMat.dispose();
		this.particleNoiseTex.dispose();
		this.particleSpriteTex.dispose();

		for (let i: number = 0; i < this.PARTICLE_CONTAINERS; i++) {
			this.particleContainers[i].dispose();
		}
	}
}
