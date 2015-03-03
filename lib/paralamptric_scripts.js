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

	fillet(upperThroat,lowerThroat,.75);
	
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
	var path = new THREE.Path(circle.getPoints(CIRCLE_SEGMENTS));
	var geometry = path.createPointsGeometry(CIRCLE_SEGMENTS);
	var material = new THREE.LineBasicMaterial({color:color});
	var object = new THREE.Line(geometry,material);
	scene.add(object);
	return circle;
}

function getArc(center,radius,start,end,clockwise,color){
	var arc = new THREE.EllipseCurve(center.x,center.y,radius,radius,start,end,clockwise)
	var path = new THREE.Path(arc.getPoints(CIRCLE_SEGMENTS));
	var geometry = path.createPointsGeometry(CIRCLE_SEGMENTS);
	geometry.vertices = geometry.vertices.slice(0,geometry.vertices.length-1);
	var material = new THREE.LineBasicMaterial({color:color});
	var object = new THREE.Line(geometry,material);
	scene.add(object);
	return arc;
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
	line_geometry.vertices.push(direction.clone().normalize().multiplyScalar(length).add(sPt));
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
	var sPt = line.vertices[0];
	var ePt = line.vertices[1];
	var vec = ePt.clone().sub(sPt);
	var pt = vec.clone().multiplyScalar(t).add(sPt);
	return pt;
}

function getEquationOfLine(line){
	var pt1 = line.vertices[0];
	var pt2 = line.vertices[1];
	var m = (pt2.y-pt1.y)/(pt2.x-pt1.x);
	var b = -m*pt1.x + pt1.y;
	return {'m':m,'b':b};
}

function getLineLineIntersection(line1,line2){
	var eq1 = getEquationOfLine(line1);
	var eq2 = getEquationOfLine(line2);
	var x = (eq2.b-eq1.b)/(eq1.m-eq2.m);
	var y = eq1.m*x + eq1.b;
	return new THREE.Vector3(x,y,0);
}

function getMidLine(line1,line2){
	var eq1 = getEquationOfLine(line1);
	var eq2 = getEquationOfLine(line2);
	var intersection = getLineLineIntersection(line1,line2);
	var m = Math.tan((Math.atan(eq1.m)+Math.atan(eq2.m))/2);
	var m_vec = new THREE.Vector3(1,m,0);
	if (intersection.x > line1.vertices[0].x || intersection.x > line1.vertices[1].x){
		m_vec = m_vec.clone().negate();
	}
	return getLineByDirection(intersection,m_vec.clone().normalize(),5,RED);
}

function fillet(line1,line2,t){
	var line3 = getMidLine(line1,line2);
	var eq1 = getEquationOfLine(line1);
	var eq2 = getEquationOfLine(line2);
	var eq3 = getEquationOfLine(line3);
	var cPt = evaluateLine(line3,t);
	drawPoint(cPt);
	var a1 = Math.pow(eq1.m,2) + 1;
	var b1 = 2*(eq1.m*eq1.b - eq1.m*cPt.y - cPt.x);
	var x1 = (-b1)/(2*a1)
	var y1 = eq1.m*x1+eq1.b;
	var pt1 = new THREE.Vector3(x1,y1,0);
	drawPoint(pt1);
	r = cPt.distanceTo(pt1);
	//getCircle(cPt,r,BLUE);
	var a2 = Math.pow(eq2.m,2) + 1;
	var b2 = 2*(eq2.m*eq2.b - eq2.m*cPt.y - cPt.x);
	var x2 = (-b2)/(2*a2)
	var y2 = eq2.m*x2+eq2.b;
	var pt2 = new THREE.Vector3(x2,y2,0);
	drawPoint(pt2);
	arc = getFilletArc(cPt,pt1,pt2);
	segments = getFilletSegments(line1,line2,pt1,pt2);
}

function getFilletArc(cPt,pt1,pt2){
	var line1 = getLineByPoints(cPt,pt1,RED);
	var line2 = getLineByPoints(cPt,pt2,RED);
	var eq1 = getEquationOfLine(line1);
	var eq2 = getEquationOfLine(line2);
	var theta1 = Math.atan(eq1.m);
	var theta2 = Math.atan(eq2.m);
	return getArc(cPt,r,theta1,theta2,true,RED);
}

function getFilletSegments(line1,line2,pt1,pt2){
	var intersection = getLineLineIntersection(line1,line2);
	if (line1.vertices[0].x-intersection.x > line1.vertices[1].x-intersection.x){
		sPt1 = line1.vertices[1];
	} else {
		sPt1 = line1.vertices[0];
	}
	if (line2.vertices[0].x-intersection.x > line2.vertices[1].x-intersection.x){
		sPt2 = line2.vertices[1];
	} else {
		sPt2 = line2.vertices[0];
	}
	var segment1 = getLineByPoints(sPt1,pt1,RED);
	var segment2 = getLineByPoints(sPt2,pt2,RED);
	return [segment1,segment2];
}