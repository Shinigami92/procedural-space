// Project
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

var scene, camera, renderer, controls, stats;
var clock = new THREE.Clock();

var hud, hudCamStats;

var solarSystem1;

init();
animate();

// Gibt eine Zufallszahl zwischen min (inklusive) und max (exklusive) zurück
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function init() {
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(65, aspect, 1, 1e5);
	camera.position.y = 5000;
	camera.position.z = 1500;
	camera.lookAt(scene.position);

	controls = new THREE.FlyControls(camera);
	controls.dragToLook = true;
	controls.movementSpeed = 500;
	controls.rollSpeed = Math.PI / 6;

	scene.add(new THREE.AmbientLight(0x404040));

	var star = new Star({radius: randomInt(400, 1200), rotationSpeed: -0.1});

	var rndInt = randomInt(3, 10);
	var nextPlanetPosX = star.getRadius();
	var planets = [];
	for (var i = 0; i < rndInt; i++) {
		var pos = i + 1;
		var planetRadius = randomInt(30, 80);
		var planetColor = new THREE.Color().setHSL(Math.random(), 1, 0.5);
		var p = new Planet({radius: planetRadius, color: planetColor, rotationSpeed: Math.random() * (0.3 - 0.05) + 0.05, orbitalSpeed: 0.1 * (rndInt / pos) + (Math.random() / 5 - 0.1)});
		nextPlanetPosX += planetRadius * 2 + randomInt(planetRadius + 50, 600);
		p.position.x = -nextPlanetPosX;
		planets[i] = p;
	}
//	var p1 = new Planet({radius: 100, rotationSpeed: 0.1, orbitalSpeed: 0.1});
//	p1.position.x = -400;
//	var p2 = new Planet({orbitalSpeed: 0.2});
//	p2.position.x = -600;
//	var planets = [p1, p2];

	solarSystem1 = new SolarSystem(star, planets);

	scene.add(solarSystem1);

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

//var radToDeg = 180 / Math.PI;
function animate() {
	requestAnimationFrame(animate);
	var delta = clock.getDelta();

	solarSystem1.update(delta);

//	var starRotationYSpeed = 0.2 * delta;
//	star.rotation.y += starRotationYSpeed;

	//planet1.rotation.x += 0.15 * delta;
//	planet1.rotation.y += -starRotationYSpeed + (0.4 * delta);

	controls.update(delta);
	composer.render(delta);
	stats.update();

	var pitch = camera.rotation.x;
	var yaw = camera.rotation.y;
	var roll = camera.rotation.z;
	hudCamStats.innerHTML = 'Camera:<br>'
						+ ' Pos: x=' + camera.position.x.toFixed(2) + ', y=' + camera.position.y.toFixed(2) + ', z=' + camera.position.z.toFixed(2);// + '<br>'
//						+ ' Rot: x=' + (0).toFixed(2) + ', y=' + ((-Math.sin(yaw)*Math.sin(pitch)*Math.sin(roll)+Math.cos(yaw)*Math.cos(roll))*90).toFixed(2) + ', z=' + (Math.cos(pitch)*Math.sin(roll)).toFixed(2) + '<br>'
//						+ ' Rot: x=' + (camera.rotation.x * radToDeg).toFixed(2) + ', y=' + (-camera.rotation.y * radToDeg).toFixed(2) + ', z=' + (-camera.rotation.z * radToDeg + 180).toFixed(2);
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
	console.log(event);
	switch(event.keyCode) {
		case 107: // NumpadAdd | +
		case 187: // BracketRight | +
			controls.movementSpeed *= 2;
			break;
		case 109: // NumpadSubtract | -
		case 189: // Slash | -
			controls.movementSpeed /= 2;
			break;
	}
}
