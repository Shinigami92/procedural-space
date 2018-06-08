import {
	AmbientLight,
	Clock,
	Color,
	FogExp2,
	Math as ThreeMath,
	Object3D,
	PerspectiveCamera,
	Scene,
	Texture,
	TextureLoader,
	Vector3,
	WebGLRenderer
} from 'three';
// import 'three/examples/js/libs/stats.min.js';
// import 'three/examples/js/controls/FlyControls.js';
// import 'three/examples/js/shaders/CopyShader.js';
// import 'three/examples/js/shaders/DotScreenShader.js';
// tslint:disable-next-line:ordered-imports
// import 'three/examples/js/postprocessing/EffectComposer.js';
// import 'three/examples/js/postprocessing/ShaderPass.js';
// tslint:disable-next-line:ordered-imports
// import 'three/examples/js/postprocessing/RenderPass.js';
// import 'three/examples/js/GPUParticleSystem.js';
import Planet from './Planet';
import SolarSystem from './SolarSystem';
import { FlyControls } from './three/examples/js/controls/FlyControls';
import { SpawnParticleOptions } from './three/examples/js/GPUParticleContainer';
import { GPUParticleSystem } from './three/examples/js/GPUParticleSystem';
import { EffectComposer } from './three/examples/js/postprocessing/EffectComposer';
import { RenderPass } from './three/examples/js/postprocessing/RenderPass';
import { SceneUtils } from './three/examples/js/utils/SceneUtils';

// Project
let screenWidth: number = window.innerWidth;
let screenHeight: number = window.innerHeight;
let aspect: number = screenWidth / screenHeight;

let scene: Scene;
let camera: PerspectiveCamera;
let renderer: WebGLRenderer;
let composer: EffectComposer;
let controls: FlyControls;
// var stats: any;

const CLOCK: Clock = new Clock();
let tick: number = 0;

let particleSystem: GPUParticleSystem;
let particleOptions: SpawnParticleOptions | undefined;
const particleTimeScale: number = 0.1;
const particleMax: number = 250_000;
const particleSpawnRate: number = 15_000;

let hud: HTMLDivElement;
let hudCamStats: HTMLPreElement;

const UNIVERSE_RADIUS: number = 1e6;
const MAX_SOLAR_SYSTEMS: number = 25;
const SOLAR_SYSTEMS: SolarSystem[] = [];

init();

function init(): void {
	scene = new Scene();
	scene.fog = new FogExp2(0x0d0d0d, 0.0000125);

	camera = new PerspectiveCamera(65, aspect, 0.1, 1e6);
	scene.add(camera);
	camera.rotation.reorder('YXZ');
	camera.lookAt(scene.position);

	controls = new FlyControls(camera);
	controls.dragToLook = true;
	controls.movementSpeed = 250;
	controls.rollSpeed = Math.PI / 6;

	scene.add(new AmbientLight(0x404040));

	for (let i: number = 0; i < MAX_SOLAR_SYSTEMS; i++) {
		const solarSystem: SolarSystem = SolarSystem.generate();
		solarSystem.position.set(
			ThreeMath.randInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS),
			ThreeMath.randInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS),
			ThreeMath.randInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS)
		);
		solarSystem.rotation.set(
			ThreeMath.degToRad(ThreeMath.randInt(0, 360)),
			ThreeMath.degToRad(ThreeMath.randInt(0, 360)),
			ThreeMath.degToRad(ThreeMath.randInt(0, 360))
		);
		SOLAR_SYSTEMS.push(solarSystem);
	}

	SOLAR_SYSTEMS.forEach((s: SolarSystem) => scene.add(s));

	const TEXTURE_LOADER: TextureLoader = new TextureLoader();
	TEXTURE_LOADER.crossOrigin = '';

	TEXTURE_LOADER.load('textures/particle2.png', (psTex: Texture) => {
		TEXTURE_LOADER.load('textures/perlin-512.png', (pnTex: Texture) => {
			particleSystem = new GPUParticleSystem({
				maxParticles: particleMax,
				particleNoiseTex: pnTex,
				particleSpriteTex: psTex
			});
			scene.add(particleSystem);
			animate();
		});
	});

	/*particleSystem = new GPUParticleSystem({
		maxParticles: particleMax,
		particleSpriteTex: TEXTURE_LOADER.load('textures/particle2.png'),
		particleNoiseTex: TEXTURE_LOADER.load('textures/perlin-512.png')
	});
	scene.add(particleSystem);*/

	particleOptions = {
		color: new Color(0xffffff),
		colorRandomness: 0,
		lifetime: 1,
		position: new Vector3(0, 0, 0),
		positionRandomness: 100,
		size: 4,
		sizeRandomness: 0.2,
		turbulence: 0,
		velocity: new Vector3(0, 0, 0),
		velocityRandomness: 0
	};

	renderer = new WebGLRenderer({
		antialias: true
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(screenWidth, screenHeight);
	// renderer.sortObjects = false;
	renderer.domElement.id = 'viewport';

	// stats = new Stats();

	hud = document.createElement('div');
	hud.id = 'hud';
	hudCamStats = document.createElement('pre');
	hud.appendChild(hudCamStats);

	document.body.appendChild(renderer.domElement);
	// document.body.appendChild(stats.dom);
	document.body.appendChild(hud);
	window.addEventListener('resize', onWindowResize, false);
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keypress', onKeyPress, false);
	document.addEventListener('keyup', onKeyUp, false);

	composer = new EffectComposer(renderer);

	const renderPass: RenderPass = new RenderPass(scene, camera);
	renderPass.renderToScreen = true;
	composer.addPass(renderPass);

	// const dotScreenPass: ShaderPass = new ShaderPass(DotScreenShader);
	// dotScreenPass.uniforms.scale.value = 3;
	// dotScreenPass.renderToScreen = true;
	// composer.addPass(dotScreenPass);

	// animate();
}

function nearest(
	pos: Vector3,
	rootObj: Scene | SolarSystem,
	filterCallback: (o: Object3D) => boolean,
	callback: (obj: SolarSystem | Planet, distance: number) => void
): void {
	let tmp: SolarSystem | Planet | null = null;
	let tmpDistance: number | null = null;
	// let traversedObjs: number = 0;
	rootObj.traverse((o: SolarSystem | Planet) => {
		if (filterCallback(o)) {
			if (tmp === null) {
				tmp = o;
				tmpDistance = pos.distanceTo(o.getWorldPosition(new Vector3()));
				// console.log(o.getWorldPosition());
			} else {
				const tmpDistance2: number = pos.distanceTo(o.getWorldPosition(new Vector3()));
				// console.log(o.getWorldPosition());
				if (tmpDistance2 < tmpDistance!) {
					tmp = o;
					tmpDistance = tmpDistance2;
				}
			}
			// traversedObjs++;
		}
	});
	// console.log('Traversed objects:', traversedObjs);
	callback(
		(tmp || new Planet({ radius: 0, color: new Color(), orbitalSpeed: 0, rotationSpeed: 0 })) as
			| SolarSystem
			| Planet,
		(tmpDistance || 0xffffffffffffff) as number
	);
}

// var n = 0;
// tslint:disable-next-line:no-var-keyword
var nCalc: number = 0;

function animate(): void {
	requestAnimationFrame(animate);
	const delta: number = CLOCK.getDelta();
	tick += delta * particleTimeScale;
	if (tick < 0) {
		tick = 0;
	}
	nCalc += delta;

	SOLAR_SYSTEMS.forEach((s: SolarSystem) => s.update(delta));

	if (delta > 0) {
		particleOptions!.position!.x = camera.position.x;
		particleOptions!.position!.y = camera.position.y;
		particleOptions!.position!.z = camera.position.z;
		for (let i: number = 0; i < particleSpawnRate * delta; i++) {
			particleOptions!.position!.set(
				ThreeMath.randInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS) * 2,
				ThreeMath.randInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS) * 2,
				ThreeMath.randInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS) * 2
			);
			particleSystem.spawnParticle(particleOptions);
		}
	}
	particleSystem.update(tick);

	controls.update(delta);
	composer.render(delta);
	// stats.update();

	const pitch: number = ThreeMath.radToDeg(camera.rotation.x);
	let yaw: number = -ThreeMath.radToDeg(camera.rotation.y);
	let roll: number = -ThreeMath.radToDeg(camera.rotation.z);
	if (yaw <= 0) {
		yaw += 360;
	}
	if (roll <= 0) {
		roll += 360;
	}
	hudCamStats.innerHTML = `Camera:
 Pos: x=${camera.position.x.toFixed(2)}, y=${camera.position.y.toFixed(2)}, z=${camera.position.z.toFixed(2)}
 Rot: pitch=${pitch.toFixed(2)}, yaw=${yaw.toFixed(2)}, roll=${roll.toFixed(2)}
 Speed: ${controls.movementSpeed}`;

	// console.log('nCalc:', nCalc);
	// 1.0 = wait for minimum one second
	if (nCalc >= 1.0) {
		nCalc = 0;
		if (camera.parent.parent instanceof Planet) {
			const p: Planet = camera.parent.parent;
			const dist: number = camera.getWorldPosition(new Vector3()).distanceTo(p.getWorldPosition(new Vector3()));
			if (dist > p.radius + 200) {
				SceneUtils.detach(camera, camera.parent, scene);
			}
		} else {
			// console.time('nearest');
			nearest(
				camera.position,
				scene,
				(o: any) => o instanceof SolarSystem,
				(ss: SolarSystem, ssDist: number) => {
					console.debug('Nearest SolarSystem was:', ss, 'Dist was:', ssDist);
					nearest(
						camera.position,
						ss,
						(o: any) => o instanceof Planet,
						(p: Planet, pDist: number) => {
							// console.log(n++);
							// console.timeEnd('nearest');
							console.debug('Nearest Planet was:', p, 'Dist was:', pDist);
							const dist: number = camera.position.distanceTo(p.getWorldPosition(new Vector3()));
							if (dist < p.radius + 200) {
								SceneUtils.attach(camera, scene, p.mesh);
							}
							// console.log('Planet\'s distance to it\'s star was:', p.getWorldPosition().distanceTo(ss.getWorldPosition()));
						}
					);
				}
			);
		}
	}
}

function onWindowResize(): void {
	screenWidth = window.innerWidth;
	screenHeight = window.innerHeight;
	aspect = screenWidth / screenHeight;

	renderer.setSize(screenWidth, screenHeight);

	camera.aspect = aspect;
	camera.updateProjectionMatrix();

	composer.reset();
}

function onKeyDown(event: KeyboardEvent): void {
	// console.log('keydown', event);
	switch (event.keyCode) {
		case 107: // NumpadAdd | +
		case 187: // BracketRight | +
			controls.movementSpeed *= 2;
			break;
		case 109: // NumpadSubtract | -
		case 189: // Slash | -
			controls.movementSpeed /= 2;
			break;
		case 16: // ShiftLeft
			if (!event.repeat) {
				controls.movementSpeed *= 2;
			}
			break;
	}
}

function onKeyPress(event: KeyboardEvent): void {
	// console.log('keypress', event);
	switch (event.keyCode) {
	}
}

function onKeyUp(event: KeyboardEvent): void {
	// console.log('keyup', event);
	switch (event.keyCode) {
		case 16: // ShiftLeft
			controls.movementSpeed /= 2;
			break;
	}
}
