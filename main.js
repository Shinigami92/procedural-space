// Project
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

var scene, camera, renderer, controls, stats;
var clock = new THREE.Clock();
var tick = 0;

var particleSystem, particleOption;
var particleTimeScale = 0.1, particleMax = 25000, particleSpawnRate = 15000;
var textureLoader;

var RAD_TO_DEG = 180 / Math.PI;
var DEG_TO_RAD = Math.PI / 180;

var hud, hudCamStats;

var UNIVERSE_RADIUS = 1e6;
var MAX_SOLAR_SYSTEMS = 25;
var solarSystems = [];

var currPlanet = null;

init();

// Gibt eine Zufallszahl zwischen min (inklusive) und max (exklusive) zurück
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function init() {
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x0d0d0d, 0.0000125);

	camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1e6);
	scene.add(camera);
	camera.rotation.reorder('YXZ');
	//camera.position.y = 5000;
	//camera.position.z = 1500;
	//camera.position.z = 15000;
	//camera.position.z = 10;
	camera.lookAt(scene.position);

	controls = new THREE.FlyControls(camera);
	controls.dragToLook = true;
	controls.movementSpeed = 250;
	controls.rollSpeed = Math.PI / 6;

	scene.add(new THREE.AmbientLight(0x404040));

	for (var i = 0; i < MAX_SOLAR_SYSTEMS; i++) {
		var solarSystem = SolarSystem.generate();
		solarSystem.position.set(randomInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS), randomInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS), randomInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS));
		solarSystem.rotation.set(randomInt(0, 360) * DEG_TO_RAD, randomInt(0, 360) * DEG_TO_RAD, randomInt(0, 360) * DEG_TO_RAD);
		solarSystems.push(solarSystem);
	}

	solarSystems.forEach(s => scene.add(s));
	//console.log(solarSystems[0].planets[1].mesh);
	//var pl = solarSystems[0].planets[1];
	//console.log('6', 'camPos:', camera.position, 'camWorldPos:', camera.getWorldPosition(), 'pPos:', pl.position, 'pWorldPos:', pl.getWorldPosition());
	//pl.mesh.add(camera);
	//console.log('7', 'camPos:', camera.position, 'camWorldPos:', camera.getWorldPosition(), 'pPos:', pl.position, 'pWorldPos:', pl.getWorldPosition());
	//camera.position.x = pl.radius + 20;
	//console.log('8', 'camPos:', camera.position, 'camWorldPos:', camera.getWorldPosition(), 'pPos:', pl.position, 'pWorldPos:', pl.getWorldPosition());

	textureLoader = new THREE.TextureLoader();
	textureLoader.crossOrigin = '';

	textureLoader.load('http://threejs.org/examples/textures/particle2.png', psTex => {
		textureLoader.load('http://threejs.org/examples/textures/perlin-512.png', pnTex => {
			particleSystem = new THREE.GPUParticleSystem({
				maxParticles: particleMax,
				particleSpriteTex: psTex,
				particleNoiseTex: pnTex
			});
			scene.add(particleSystem);
			animate();
		});
	});

	/*particleSystem = new THREE.GPUParticleSystem({
		maxParticles: particleMax,
		particleSpriteTex: textureLoader.load('http://threejs.org/examples/textures/particle2.png'),
		particleNoiseTex: textureLoader.load('http://threejs.org/examples/textures/perlin-512.png')
	});
	scene.add(particleSystem);*/

	particleOptions = {
		position: new THREE.Vector3(0, 0, 0),
		positionRandomness: 100,//.3,
		velocity: new THREE.Vector3(0, 0, 0),
		velocityRandomness: 0,//.5,
		color: 0xffffff,//0xaa88ff,
		colorRandomness: 0,//.2,
		turbulence: 0,//.5,
		lifetime: 1,//2,
		size: 1,//5,
		sizeRandomness: 0.2//1
	};

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
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

	composer = new THREE.EffectComposer(renderer);

	var renderPass = new THREE.RenderPass(scene, camera);
	renderPass.renderToScreen = true;
	composer.addPass(renderPass);
//	console.log(camera);

//	var dotScreenPass = new THREE.ShaderPass(THREE.DotScreenShader);
//	dotScreenPass.uniforms['scale'].value = 3;
//	dotScreenPass.renderToScreen = true;
//	composer.addPass(dotScreenPass);
	//attachCamToPlanet();
	//console.log(currPlanet);
	//currPlanet.mesh.add(camera);
	//camera.position.x = currPlanet.radius + 20;
/*
	console.time('nearest');
	nearest(camera.getWorldPosition(), scene, o => o instanceof SolarSystem, (ss, ssDist) => {
		console.log('Nearest SolarSystem was:', ss, 'Dist was:', ssDist);
		nearest(camera.getWorldPosition(), ss, o => o instanceof Planet, (p, pDist) => {
			console.timeEnd('nearest');
			console.log('Nearest Planet was:', p, 'Dist was:', pDist);
			console.log('Planet\'s distance to it\'s star was:', p.getWorldPosition().distanceTo(ss.getWorldPosition()));
		});
	});
*/
}

function nearest(pos, rootObj, filterCallback, callback) {
	var tmp = null;
	var tmpDistance = null;
	var traversedObjs = 0;
	rootObj.traverse(o => {
		if (filterCallback(o)) {
			if (tmp == null) {
				tmp = o;
				tmpDistance = pos.distanceTo(o.getWorldPosition());
				//console.log(o.getWorldPosition());
			} else {
				var tmpDistance2 = pos.distanceTo(o.getWorldPosition());
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

function attachCamToPlanet() {
	if (currPlanet == null) {
		var tmpPlanet = null;
		var tmpDistance = null;
		scene.traverse(o => {
			if (o instanceof Planet) {
				if (tmpPlanet == null) {
					tmpPlanet = o;
					tmpDistance = camera.position.distanceTo(tmpPlanet.position);
				} else {
					var tmpDistance2 = camera.position.distanceTo(o.position);
					if (tmpDistance2 < tmpDistance) {
						tmpPlanet = o;
						tmpDistance = tmpDistance2;
					}
				}
			}
		});
		currPlanet = tmpPlanet;
	}
}

var n = 0;
var nCalc = 0;
function animate() {
	requestAnimationFrame(animate);
	var delta = clock.getDelta();
	tick += delta * particleTimeScale;
	if (tick < 0) tick = 0;
	nCalc += delta;

	solarSystems.forEach(s => s.update(delta));

	if (delta > 0) {
		//particleOptions.position.x = camera.position.x;
		//particleOptions.position.y = camera.position.y;
		//particleOptions.position.z = camera.position.z;
		for (var i = 0; i < particleSpawnRate  * delta; i++) {
			particleOptions.position.set(randomInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS)*2, randomInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS)*2, randomInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS)*2);
			particleSystem.spawnParticle(particleOptions);
		}
	}
	particleSystem.update(tick);

//	var starRotationYSpeed = 0.2 * delta;
//	star.rotation.y += starRotationYSpeed;

	//planet1.rotation.x += 0.15 * delta;
//	planet1.rotation.y += -starRotationYSpeed + (0.4 * delta);

	controls.update(delta);
	composer.render(delta);
	stats.update();

	var pitch = camera.rotation.x * RAD_TO_DEG;
	var yaw = camera.rotation.y * -RAD_TO_DEG;
	var roll = camera.rotation.z * -RAD_TO_DEG;
	if (yaw <= 0) yaw += 360;
	if (roll <= 0) roll += 360;
	hudCamStats.innerHTML = 'Camera:'
	hudCamStats.innerHTML += '<br> Pos: x=' + camera.position.x.toFixed(2) + ', y=' + camera.position.y.toFixed(2) + ', z=' + camera.position.z.toFixed(2);// + '<br>'
	hudCamStats.innerHTML += '<br> Rot: pitch=' + pitch.toFixed(2) + ', yaw=' + yaw.toFixed(2) + ', roll=' + roll.toFixed(2);
	hudCamStats.innerHTML += '<br> Speed: ' + controls.movementSpeed;

	//console.log('nCalc:', nCalc);
	// 1.0 = wait for minimum one second
	if (nCalc >= 1.0) {
		nCalc = 0;
		if (camera.parent != null && camera.parent.parent != null && camera.parent.parent instanceof Planet) {
			var p = camera.parent.parent;
			var dist = camera.getWorldPosition().distanceTo(p.getWorldPosition());
			console.log('dist > p.radius+200 ==', dist > (p.radius + 200));
			if (dist > (p.radius + 200)) {
				//console.log('4', 'camPos:', camera.position, 'camWorldPos:', camera.getWorldPosition(), 'pPos:', p.position, 'pWorldPos:', p.getWorldPosition());
				var camWorldPosTmp = camera.getWorldPosition();
				scene.add(camera);
				camera.position.x = camWorldPosTmp.x;
				camera.position.y = camWorldPosTmp.y;
				camera.position.z = camWorldPosTmp.z;
				//console.log('5', 'camPos:', camera.position, 'camWorldPos:', camera.getWorldPosition(), 'pPos:', p.position, 'pWorldPos:', p.getWorldPosition());
			}
		} else {
			console.time('nearest');
			//var camWorldPos = camera.getWorldPosition();
			nearest(camera.position, scene, o => o instanceof SolarSystem, (ss, ssDist) => {
				//console.log('Nearest SolarSystem was:', ss, 'Dist was:', ssDist);
				nearest(camera.position, ss, o => o instanceof Planet, (p, pDist) => {
					console.log(n++);
					console.timeEnd('nearest');
					console.log('Nearest Planet was:', p, 'Dist was:', pDist);
					var dist = camera.position.distanceTo(p.getWorldPosition());
					//console.log('dist < p.radius+200 ==', dist < (p.radius + 200));
					if (camera.position.distanceTo(p.getWorldPosition()) < (p.radius + 200)) {
						//console.log('1', 'camPos:', camera.position, 'camWorldPos:', camera.getWorldPosition(), 'pPos:', p.position, 'pWorldPos:', p.getWorldPosition());
						p.mesh.add(camera);
						camera.position.x = p.radius + 20;
						camera.position.y = 0;
						camera.position.z = 0;
						//console.log('3', 'camPos:', camera.position, 'camWorldPos:', camera.getWorldPosition(), 'pPos:', p.position, 'pWorldPos:', p.getWorldPosition());
					}
					//console.log('Planet\'s distance to it\'s star was:', p.getWorldPosition().distanceTo(ss.getWorldPosition()));
				});
			});
		}
	}
}

function onWindowResize(event) {
	SCREEN_WIDTH = window.innerWidth;
	SCREEN_HEIGHT = window.innerHeight;
	aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

	camera.aspect = aspect;
	camera.updateProjectionMatrix();

	composer.reset();
}

function onKeyDown(event) {
	//console.log('keydown', event);
	switch(event.keyCode) {
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
	switch(event.keyCode) {
	}
}

function onKeyUp(event) {
	//console.log('keyup', event);
	switch(event.keyCode) {
		case 16: // ShiftLeft
			controls.movementSpeed /= 2;
			break;
	}
}
