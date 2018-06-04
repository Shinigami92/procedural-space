import {
	Clock,
	Scene,
	FogExp2,
	PerspectiveCamera,
	FlyControls,
	AmbientLight,
	Math as ThreeMath,
	TextureLoader,
	Vector3,
	WebGLRenderer,
	EffectComposer,
	RenderPass
} from 'three';
import SolarSystem from './SolarSystem';
import Planet from './Planet';

// Project
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
var aspect = screenWidth / screenHeight;

var scene: Scene,
	camera: PerspectiveCamera,
	renderer: WebGLRenderer,
	controls,
	stats;
const CLOCK = new Clock();
var tick = 0;

var particleSystem, particleOption;
var particleTimeScale = 0.1,
	particleMax = 25000,
	particleSpawnRate = 15000;

var hud, hudCamStats;

const UNIVERSE_RADIUS = 1e6;
const MAX_SOLAR_SYSTEMS = 25;
const SOLAR_SYSTEMS: SolarSystem[] = [];

init();

function init() {
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

	for (let i = 0; i < MAX_SOLAR_SYSTEMS; i++) {
		let solarSystem = SolarSystem.generate();
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

	SOLAR_SYSTEMS.forEach((s) => scene.add(s));

	const TEXTURE_LOADER = new TextureLoader();
	TEXTURE_LOADER.crossOrigin = '';

	TEXTURE_LOADER.load(
		'http://threejs.org/examples/textures/particle2.png',
		(psTex) => {
			TEXTURE_LOADER.load(
				'http://threejs.org/examples/textures/perlin-512.png',
				(pnTex) => {
					particleSystem = new GPUParticleSystem({
						maxParticles: particleMax,
						particleSpriteTex: psTex,
						particleNoiseTex: pnTex
					});
					scene.add(particleSystem);
					animate();
				}
			);
		}
	);

	/*particleSystem = new GPUParticleSystem({
		maxParticles: particleMax,
		particleSpriteTex: TEXTURE_LOADER.load('http://threejs.org/examples/textures/particle2.png'),
		particleNoiseTex: TEXTURE_LOADER.load('http://threejs.org/examples/textures/perlin-512.png')
	});
	scene.add(particleSystem);*/

	particleOptions = {
		position: new Vector3(0, 0, 0),
		positionRandomness: 100, //.3,
		velocity: new Vector3(0, 0, 0),
		velocityRandomness: 0, //.5,
		color: 0xffffff, //0xaa88ff,
		colorRandomness: 0, //.2,
		turbulence: 0, //.5,
		lifetime: 1, //2,
		size: 1, //5,
		sizeRandomness: 0.2 //1
	};

	renderer = new WebGLRenderer({
		antialias: true
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(screenWidth, screenHeight);
	//renderer.sortObjects = false;
	renderer.domElement.id = 'viewport';

	stats = new Stats();

	hud = document.createElement('div');
	hud.id = 'hud';
	hudCamStats = document.createElement('pre');
	hud.appendChild(hudCamStats);

	document.body.appendChild(renderer.domElement);
	document.body.appendChild(stats.dom);
	document.body.appendChild(hud);
	window.addEventListener('resize', onWindowResize, false);
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keypress', onKeyPress, false);
	document.addEventListener('keyup', onKeyUp, false);

	composer = new EffectComposer(renderer);

	var renderPass = new RenderPass(scene, camera);
	renderPass.renderToScreen = true;
	composer.addPass(renderPass);

	//	var dotScreenPass = new ShaderPass(DotScreenShader);
	//	dotScreenPass.uniforms['scale'].value = 3;
	//	dotScreenPass.renderToScreen = true;
	//	composer.addPass(dotScreenPass);
}

function nearest(pos, rootObj, filterCallback, callback) {
	let tmp = null;
	let tmpDistance = null;
	let traversedObjs = 0;
	rootObj.traverse((o) => {
		if (filterCallback(o)) {
			if (tmp === null) {
				tmp = o;
				tmpDistance = pos.distanceTo(o.getWorldPosition());
				//console.log(o.getWorldPosition());
			} else {
				let tmpDistance2 = pos.distanceTo(o.getWorldPosition());
				//console.log(o.getWorldPosition());
				if (tmpDistance2 < tmpDistance) {
					tmp = o;
					tmpDistance = tmpDistance2;
				}
			}
			traversedObjs++;
		}
	});
	//console.log('Traversed objects:', traversedObjs);
	callback(tmp, tmpDistance);
}

var n = 0;
var nCalc = 0;

function animate() {
	requestAnimationFrame(animate);
	var delta = CLOCK.getDelta();
	tick += delta * particleTimeScale;
	if (tick < 0) tick = 0;
	nCalc += delta;

	SOLAR_SYSTEMS.forEach((s) => s.update(delta));

	if (delta > 0) {
		//particleOptions.position.x = camera.position.x;
		//particleOptions.position.y = camera.position.y;
		//particleOptions.position.z = camera.position.z;
		for (let i = 0; i < particleSpawnRate * delta; i++) {
			particleOptions.position.set(
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
	stats.update();

	let pitch = ThreeMath.radToDeg(camera.rotation.x);
	let yaw = -ThreeMath.radToDeg(camera.rotation.y);
	let roll = -ThreeMath.radToDeg(camera.rotation.z);
	if (yaw <= 0) yaw += 360;
	if (roll <= 0) roll += 360;
	hudCamStats.innerHTML = `Camera:
 Pos: x=${camera.position.x.toFixed(2)}, y=${camera.position.y.toFixed(
		2
	)}, z=${camera.position.z.toFixed(2)}
 Rot: pitch=${pitch.toFixed(2)}, yaw=${yaw.toFixed(2)}, roll=${roll.toFixed(2)}
 Speed: ${controls.movementSpeed}`;

	//console.log('nCalc:', nCalc);
	// 1.0 = wait for minimum one second
	if (nCalc >= 1.0) {
		nCalc = 0;
		if (
			camera.parent !== null &&
			camera.parent.parent !== null &&
			camera.parent.parent instanceof Planet
		) {
			let p = camera.parent.parent;
			let dist = camera
				.getWorldPosition()
				.distanceTo(p.getWorldPosition());
			if (dist > p.radius + 200) {
				SceneUtils.detach(camera, camera.parent, scene);
			}
		} else {
			console.time('nearest');
			nearest(
				camera.position,
				scene,
				(o) => o instanceof SolarSystem,
				(ss, ssDist) => {
					//console.log('Nearest SolarSystem was:', ss, 'Dist was:', ssDist);
					nearest(
						camera.position,
						ss,
						(o) => o instanceof Planet,
						(p, pDist) => {
							console.log(n++);
							console.timeEnd('nearest');
							//console.log('Nearest Planet was:', p, 'Dist was:', pDist);
							let dist = camera.position.distanceTo(
								p.getWorldPosition()
							);
							if (dist < p.radius + 200) {
								SceneUtils.attach(camera, scene, p.mesh);
							}
							//console.log('Planet\'s distance to it\'s star was:', p.getWorldPosition().distanceTo(ss.getWorldPosition()));
						}
					);
				}
			);
		}
	}
}

function onWindowResize(event) {
	screenWidth = window.innerWidth;
	screenHeight = window.innerHeight;
	aspect = screenWidth / screenHeight;

	renderer.setSize(screenWidth, screenHeight);

	camera.aspect = aspect;
	camera.updateProjectionMatrix();

	composer.reset();
}

function onKeyDown(event) {
	//console.log('keydown', event);
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
			if (!event.repeat) controls.movementSpeed *= 2;
			break;
	}
}

function onKeyPress(event) {
	//console.log('keypress', event);
	switch (event.keyCode) {
	}
}

function onKeyUp(event) {
	//console.log('keyup', event);
	switch (event.keyCode) {
		case 16: // ShiftLeft
			controls.movementSpeed /= 2;
			break;
	}
}
