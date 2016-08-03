// Project
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

var scene, camera, renderer, controls, stats;
var clock = new THREE.Clock();

var RAD_TO_DEG = 180 / Math.PI;
var DEG_TO_RAD = Math.PI / 180;

var hud, hudCamStats;

var UNIVERSE_RADIUS = 1e5;
var MAX_SOLAR_SYSTEMS = 25;
var solarSystems = [];

init();
animate();

// Gibt eine Zufallszahl zwischen min (inklusive) und max (exklusive) zurück
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function init() {
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(65, aspect, 1, 1e6);
	camera.rotation.reorder('YXZ');
	//camera.position.y = 5000;
	//camera.position.z = 1500;
	//camera.position.z = 15000;
	camera.lookAt(scene.position);

	controls = new THREE.FlyControls(camera);
	controls.dragToLook = true;
	controls.movementSpeed = 2000;
	controls.rollSpeed = Math.PI / 6;

	scene.add(new THREE.AmbientLight(0x404040));

	for (var i = 0; i < MAX_SOLAR_SYSTEMS; i++) {
		solarSystem = SolarSystem.generate();
		solarSystem.position.set(randomInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS), randomInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS), randomInt(-UNIVERSE_RADIUS, UNIVERSE_RADIUS));
		solarSystem.rotation.set(randomInt(0, 360) * DEG_TO_RAD, randomInt(0, 360) * DEG_TO_RAD, randomInt(0, 360) * DEG_TO_RAD);
		solarSystems.push(solarSystem);
	}

	solarSystems.forEach(s => scene.add(s));

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
}

function animate() {
	requestAnimationFrame(animate);
	var delta = clock.getDelta();

	solarSystems.forEach(s => s.update(delta));

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
