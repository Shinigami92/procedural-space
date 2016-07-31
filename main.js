var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

var scene, camera, renderer, controls, stats;
var clock = new THREE.Clock();

var cube;
var star;

init();
animate();

function init() {
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(65, aspect, 1, 1e5);
	camera.position.z = 1000;

	controls = new THREE.FlyControls(camera);
	controls.dragToLook = true;
	controls.movementSpeed = 150;
	controls.rollSpeed = Math.PI / 6;

//	scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1));
	scene.add(new THREE.AmbientLight(0x404040));
//	var light1 = new THREE.PointLight(0xffffff, 1, 3e5);
	//light1.position.set(0, 0, 0);
	//scene.add(light1);

//	star = new THREE.Mesh(
//		new THREE.SphereGeometry(100, 32, 32),
//		new THREE.MeshBasicMaterial({color: 0xfff5f2/*, wireframe: true*/})
//	);
//	star.add(light1);
	//scene.add(star);

	cube = new THREE.Mesh(
		new THREE.BoxGeometry(100, 100, 100),
		//new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true})
		//new THREE.MeshNormalMaterial()
		new THREE.MeshStandardMaterial({color: 0xff0000})
	);
	cube.position.x = -400;
//	star.add(cube);

	star = new Star();
	star.mesh.add(cube);

	scene.add(star.mesh);

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	//renderer.sortObjects = false;

	stats = new Stats();

	document.body.appendChild(renderer.domElement);
	document.body.appendChild(stats.dom);
	window.addEventListener('resize', onWindowResize, false);

	composer = new THREE.EffectComposer(renderer);

	var renderPass = new THREE.RenderPass(scene, camera);
	renderPass.renderToScreen = true;
	composer.addPass(renderPass);

//	var dotScreenPass = new THREE.ShaderPass(THREE.DotScreenShader);
//	dotScreenPass.uniforms['scale'].value = 3;
//	dotScreenPass.renderToScreen = true;
//	composer.addPass(dotScreenPass);
}

function animate() {
	requestAnimationFrame(animate);
	var delta = clock.getDelta();

	var starRotationYSpeed = 0.2 * delta;
	star.mesh.rotation.y += starRotationYSpeed;

	//cube.rotation.x += 0.15 * delta;
	cube.rotation.y += -starRotationYSpeed + (0.4 * delta);

	controls.update(delta);
	composer.render(delta);
	stats.update();
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

// My objects
function Star() {
	var _star = {};
	console.log('Constructor of Star');
	_star.light = new THREE.PointLight(0xffffff, 1, 3e5);
	_star.mesh = new THREE.Mesh(
		new THREE.SphereGeometry(100, 32, 32),
		new THREE.MeshBasicMaterial({color: 0xfff5f2})
	);
	_star.mesh.add(_star.light);
	return _star;
}

//function SolarSystem() {
//	console.log('Constructor of SolarSystem');
//	this.star = new Star();
//}