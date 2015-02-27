/* GLOBAL VARIABLES */
var CIRCLE_SEGMENTS = 50;
var RED = new THREE.Color("red");
var GREEN = new THREE.Color("green");
var WHITE = new THREE.Color("white");
var BLUE = new THREE.Color("blue");
var scene, camera, controls, renderer;

/* MAIN */
$(function(){
	init();
	animate();
});

/* INIT */
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
	camera.position.z = 50;
	
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
	var neckCircle_center = new THREE.Vector3(0,0,0);
	var neckCircle = getCircle(neckCircle_center,neckCircle_radius,BLUE);
	
	var topOfBody_t = .09;
	var topOfBody_pt = toVector3(neckCircle.getPoint(topOfBody_t));
	drawPoint(topOfBody_pt);
	var topOfBody_tan = toVector3(neckCircle.getTangent(topOfBody_t));
	var body_length = 10; // later change to be determined by height parameter
	var body_geometry = getLineByDirection(topOfBody_pt,topOfBody_tan,body_length,WHITE);
	
	var topOfNeck_t = .74;
	var topOfNeck_pt = toVector3(neckCircle.getPoint(topOfNeck_t));
	drawPoint(topOfNeck_pt);
	var topOfNeck_tan = toVector3(neckCircle.getTangent(topOfNeck_t).multiplyScalar(-1));
	
	var head_length = 3.6;
	var head_geometry = getLineByDirection(topOfNeck_pt,topOfNeck_tan,head_length,WHITE);
	
	var topOfHead = head_geometry.vertices[1];
	drawPoint(topOfHead);
	
	var topOfBelly = body_geometry.vertices[1];
	drawPoint(topOfBelly);
	
	var bodyPerpendicular = getPerpedicular(topOfBody_tan);
	var bodyPerpendicular_geometry = getLineByDirection(topOfBelly,bodyPerpendicular,5,GREEN);
	
	var bellyCircle_radius = .75;
	var bellyCircle_center = bodyPerpendicular.clone().multiplyScalar(bellyCircle_radius).add(topOfBelly);
	drawPoint(bellyCircle_center);
	var bellyCircle = getCircle(bellyCircle_center,bellyCircle_radius,BLUE);
	
	var bottomOfBelly_t = .25;
	var bottomOfBelly_pt = toVector3(bellyCircle.getPoint(bottomOfBelly_t));
	drawPoint(bottomOfBelly_pt);
	var bottomOfBelly_tan = toVector3(bellyCircle.getTangent(bottomOfBelly_t).multiplyScalar(-1));
	var tail_length = 4;
	var tail_geometry = getLineByDirection(bottomOfBelly_pt,bottomOfBelly_tan,tail_length,WHITE);
	
	var throat_t = (topOfBody_t + (topOfNeck_t - 1))/2;
	var throat_pt = toVector3(neckCircle.getPoint(throat_t));
	drawPoint(throat_pt);
	
	var upperThroat = getLineByPoints(topOfHead,throat_pt,GREEN);
	var bottomOfThroat_t = .75;
	var bottomOfThroat = evaluateLine(body_geometry,bottomOfThroat_t);
	drawPoint(bottomOfThroat);
	var lowerThroat = getLineByPoints(bottomOfThroat,throat_pt,GREEN);
	
	
	
	// Set up material
	var white_material = new THREE.LineBasicMaterial({color:WHITE});
	var red_material = new THREE.LineBasicMaterial({color:RED});
	var blue_material = new THREE.LineBasicMaterial({color:BLUE});
	var green_material = new THREE.LineBasicMaterial({color:GREEN});
	
	// Set up objects

	// Add geometry
	
	// Set up controls
	controls = new THREE.OrbitControls(camera, renderer.domElement);
}

/* ANIMATE */
function animate(){
	requestAnimationFrame(animate);
	renderer.render(scene,camera);
	controls.update();
}

/* HELPER FUNCTIONS */
function drawPoint(pt){
	var material = new THREE.MeshBasicMaterial({color:RED});
	var circle_geometry = new THREE.CircleGeometry(.5,CIRCLE_SEGMENTS);
	var circle = new THREE.Mesh(circle_geometry,material);
	circle.position.set(pt.x,pt.y,0);
	scene.add(circle);
}

function getCircle(center,radius,color){
	var circle = new THREE.EllipseCurve(center.x,center.y,radius,radius,2*Math.PI,0,true)
	var circle_path = new THREE.Path(circle.getPoints(CIRCLE_SEGMENTS));
	var circle_geometry = circle_path.createPointsGeometry(CIRCLE_SEGMENTS);
	var material = new THREE.LineBasicMaterial({color:color});
	var circle_object = new THREE.Line(circle_geometry,material);
	scene.add(circle_object);
	return circle;
}

function drawCurve(curve,color){
	var path = new THREE.Path(curve.getPoints(CIRCLE_SEGMENTS));
	var geometry = path.createPointsGeometry(CIRCLE_SEGMENTS);
	var material = new THREE.LineBasicMaterial({color:color});
	var curve_object = new THREE.Line(geometry,material);
	scene.add(curve_object);
}

function toVector3(vec){
	return new THREE.Vector3(vec.x,vec.y,0);
}

function getLineByDirection(sPt,direction,length,color){
	var line_geometry = new THREE.Geometry();
	line_geometry.vertices.push(sPt.clone());
	line_geometry.vertices.push(direction.clone().multiplyScalar(length).add(sPt));
	var material = new THREE.LineBasicMaterial({color:color});
	var line_object = new THREE.Line(line_geometry,material);
	scene.add(line_object);
	return line_geometry;
}

function getLineByPoints(sPt,ePt,color){
	var line_geometry = new THREE.Geometry();
	line_geometry.vertices.push(sPt.clone());
	line_geometry.vertices.push(ePt.clone());
	var material = new THREE.LineBasicMaterial({color:color});
	var line_object = new THREE.Line(line_geometry,material);
	scene.add(line_object);
	return line_geometry;
}

function getPerpedicular(vec){
	return new THREE.Vector3(-vec.y,vec.x,0);
}

function evaluateLine(line,t){
	sPt = line.vertices[0];
	ePt = line.vertices[1];
	vec = ePt.clone().sub(sPt);
	pt = vec.clone().multiplyScalar(t).add(sPt);
	return pt;
}