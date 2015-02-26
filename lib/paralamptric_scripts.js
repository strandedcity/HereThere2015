var CIRCLE_SEGMENTS = 50;
var COLOR = 0xffffff;
var RED = 0xff0000;
var GREEN = 0x00ff00;
$(function(){
	var scene, camera, controls, renderer;
	init();
	animate();
});

function init(){
	// Set up scene
	scene = new THREE.Scene();
	var WIDTH = window.innerWidth,
		HEIGHT = window.innerHeight;
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setSize(WIDTH,HEIGHT);
	document.body.appendChild(renderer.domElement);
	
	// Set up camera
	camera = new THREE.PerspectiveCamera(
		45,         // Field of view
		WIDTH/HEIGHT,  // Aspect ratio
		.1,         // Near
		10000       // Far
	);
	scene.add(camera);
	camera.position.z = 300;
	
	// Adjust to window resizes
	window.addEventListener('resize',function(){
		var WIDTH = window.innerWidth;
			HEIGHT = window.innerHeight;
		renderer.setSize(WIDTH,HEIGHT);
		camera.aspect = WIDTH/HEIGHT;
		camera.updateProjectionMatrix();
	});
	
	// Set up lights
	var light = new THREE.PointLight( 0xFFFF00 );
    light.position.set( 10, 50, 130 );
    scene.add(light);
	
	// Set up geometry
	var neckCircle_radius = 1.6;
	var neckCircle_scaffold = new THREE.EllipseCurve(0,0,neckCircle_radius,neckCircle_radius,2*Math.PI,0,true)
	var neckCircle_path = new THREE.Path(neckCircle_scaffold.getPoints(CIRCLE_SEGMENTS));
	var neckCircle_geometry = neckCircle_path.createPointsGeometry(CIRCLE_SEGMENTS);
	
	var topOfBody_t = .09;
	var topOfBody_pt = neckCircle_scaffold.getPoint(topOfBody_t);
	var topOfBody_tan = neckCircle_scaffold.getTangent(topOfBody_t);
	//drawPoint(topOfBody_pt);
	var body_length = 10; // later change to be determined by height parameter
	var body = getLine(toVector3(topOfBody_pt),toVector3(topOfBody_tan),body_length);
	
	var topOfNeck_t = .74;
	var topOfNeck_pt = neckCircle_scaffold.getPoint(topOfNeck_t);
	var topOfNeck_tan = neckCircle_scaffold.getTangent(topOfNeck_t).multiplyScalar(-1);
	//drawPoint(topOfNeck_pt);
	var head_length = 3.6;
	var head = getLine(toVector3(topOfNeck_pt),toVector3(topOfNeck_tan),head_length);
	
	var topOfBelly = body.geometry.vertices[0];
	drawPoint(topOfBelly);
	
	var topOfHead = head.geometry.vertices[0];
	drawPoint(topOfHead);
	
	// Set up material
	var material = new THREE.LineBasicMaterial( { color: COLOR } );
	var neckCircle = new THREE.Line(neckCircle_geometry, material );

	// Add geometry
	scene.add(neckCircle);
	scene.add(body);
	scene.add(head);
	
	// Set up controls
	controls = new THREE.OrbitControls(camera, renderer.domElement);
}

function animate(){
	requestAnimationFrame(animate);
	renderer.render(scene,camera);
	controls.update();
}

function drawPoint(pt){
	var material = new THREE.MeshBasicMaterial({color:RED});
	var circle_geometry = new THREE.CircleGeometry(.5,CIRCLE_SEGMENTS);
	var circle = new THREE.Mesh(circle_geometry,material);
	circle.position.set(pt.x,pt.y,0);
	scene.add(circle);
}

function toVector3(vec){
	return new THREE.Vector3(vec.x,vec.y,0);
}

function getLine(sPt,direction,length){
	var line_geometry = new THREE.Geometry();
	line_geometry.vertices.push(new THREE.Vector3(0,0,0));
	line_geometry.vertices.push(direction.clone().multiplyScalar(length));
	var material = new THREE.LineBasicMaterial({color:GREEN});
	var line = new THREE.Line(line_geometry,material);
	line.position.set(sPt.x,sPt.y,sPt.z);
	return line;
}

function getPerpedicular(vec){
	return new THREE.Vector3(-vec.y,vec.x);
}