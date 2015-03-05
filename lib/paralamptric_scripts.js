/* GLOBAL VARIABLES */
var SUBDIVISIONS = 50;
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
	setupRenderer();
	setupCamera();
	setupLights();
	setupGeometry();
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	// Adjust to window resizes
	window.addEventListener('resize',function(){
		renderer.setSize(window.innerWidth,window.innerHeight);
		camera.aspect = window.innerWidth/window.innerHeight;
		camera.updateProjectionMatrix();
	});
}

function animate(){
	requestAnimationFrame(animate);
	renderer.render(scene,camera);
	controls.update();
}

function setupRenderer(){
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setSize(window.innerWidth,window.innerHeight);
	document.body.appendChild(renderer.domElement);
}

function setupCamera(){
	camera = new THREE.PerspectiveCamera(
		45,         // Field of view
		window.innerWidth/window.innerHeight,  // Aspect ratio
		.1,         // Near
		10000       // Far
	);
	scene.add(camera);
	camera.position.z = 50;
}

function setupLights(){
	var light = new THREE.PointLight( 0xFFFF00 );
    light.position.set( 10, 50, 130 );
    scene.add(light);
}

function setupGeometry(){
	var neckCircle_center = new THREE.Vector3(0,0,0), neckCircle_radius = 1.6;
	var neckCircle = getCircle(neckCircle_center,neckCircle_radius,"blue");
	
	var topOfBody_t = .09, body_length = 10; // later change to be determined by height parameter
	var topOfBody_pt = toVector3(neckCircle.getPoint(topOfBody_t));
	var topOfBody_tan = toVector3(neckCircle.getTangent(topOfBody_t));
	var body = getLineByDirection(topOfBody_pt,topOfBody_tan,body_length);
	
	var topOfNeck_t = .74;
	var topOfNeck_pt = toVector3(neckCircle.getPoint(topOfNeck_t));
	var topOfNeck_tan = toVector3(neckCircle.getTangent(topOfNeck_t).multiplyScalar(-1));
	
	var neck = arcToGeometry(getArcByPoints(neckCircle_center,neckCircle_radius,topOfBody_pt,topOfNeck_pt));
	
	var head_length = 3.6;
	var head = getLineByDirection(topOfNeck_pt,topOfNeck_tan,head_length);
	
	var topOfHead_pt = head.vertices[1];
	var topOfBelly_pt = body.vertices[1];
	
	var bellyCircle_radius = .75;
	var bodyPerpendicular = getPerpedicular(topOfBody_tan);
	var bellyCircle_center = bodyPerpendicular.clone().multiplyScalar(bellyCircle_radius).add(topOfBelly_pt);
	var bellyCircle = getCircle(bellyCircle_center,bellyCircle_radius);
	
	var bottomOfBelly_t = .25, tail_length = 4;
	var bottomOfBelly_pt = toVector3(bellyCircle.getPoint(bottomOfBelly_t));
	var bottomOfBelly_tan = toVector3(bellyCircle.getTangent(bottomOfBelly_t).multiplyScalar(-1));
	var tail = getLineByDirection(bottomOfBelly_pt,bottomOfBelly_tan,tail_length);
	
	var belly = arcToGeometry(getArcByPoints(bellyCircle_center,bellyCircle_radius,topOfBelly_pt,bottomOfBelly_pt,true));
	
	var throat_fillet_t = .75;
	var throat_t = (topOfBody_t + (topOfNeck_t - 1))/2;
	var throat_pt = toVector3(neckCircle.getPoint(throat_t));
	var upperThroat = getLineByPoints(topOfHead_pt,throat_pt);
	var lowerThroat = getLineByPoints(topOfBelly_pt,throat_pt);
	var throat = fillet(upperThroat,lowerThroat,throat_fillet_t);
	
	var back_fillet_t = .75;
	var upperBack = getLineByPoints(topOfBody_pt,bellyCircle_center);
	var lowerBack = getLineByPoints(bellyCircle_center,tail.vertices[1]);
	var back = fillet(upperBack,lowerBack,back_fillet_t);
	
	
	drawLine(head,"white");
	drawLine(neck,"white");
	//drawLine(body,"white");
	drawLine(belly,"white");
	drawLine(tail,"white");
	drawLine(throat,"white");
	drawLine(back,"white");
		
	var extrusion_distance = 3;
	var extrusion_direction = new THREE.Vector3(0,0,-1);
	drawMesh(extrudePiece(head,extrusion_distance,extrusion_direction),"red");
	drawMesh(extrudePiece(neck,extrusion_distance,extrusion_direction),"red");
	drawMesh(extrudePiece(body,extrusion_distance,extrusion_direction),"red");
	drawMesh(extrudePiece(belly,extrusion_distance,extrusion_direction),"red");
	drawMesh(extrudePiece(tail,extrusion_distance,extrusion_direction),"red");
}


/* HELPER FUNCTIONS */
function drawPoint(pt,color){
	var material = new THREE.MeshBasicMaterial({color:new THREE.Color(color)});
	var circle_geometry = new THREE.CircleGeometry(.5,SUBDIVISIONS);
	var circle = new THREE.Mesh(circle_geometry,material);
	circle.position.set(pt.x,pt.y,pt.z);
	scene.add(circle);
}

function drawCircle(circle,color){
	var geometry = curveToGeometry(circle);
	var material = new THREE.LineBasicMaterial({color:new THREE.Color(color)});
	var object = new THREE.Line(geometry,material);
	scene.add(object);
}

function drawMesh(geometry,color){
	var material = new THREE.MeshBasicMaterial({color:new THREE.Color(color),side:THREE.DoubleSide});
	var object = new THREE.Mesh(geometry,material);
	scene.add(object);
}

function getCircle(center,radius,color){
	var circle = new THREE.EllipseCurve(center.x,center.y,radius,radius,2*Math.PI,0,true)
	return circle;
}

function getArcByAngles(center,radius,start,end,clockwise,color){
	var arc = new THREE.EllipseCurve(center.x,center.y,radius,radius,start,end,clockwise)
	return arc;
}

function arcToGeometry(arc){
	var geometry = curveToGeometry(arc);
	geometry.vertices = geometry.vertices.slice(0,geometry.vertices.length-1);
	return geometry;
}

function drawCurve(curve,color){
	var path = new THREE.Path(curve.getPoints(SUBDIVISIONS));
	var geometry = path.createPointsGeometry(SUBDIVISIONS);
	var material = new THREE.LineBasicMaterial({color:new THREE.Color(color)});
	var object = new THREE.Line(geometry,material);
	scene.add(object);
}

function drawLine(line,color){
	var material = new THREE.LineBasicMaterial({color:new THREE.Color(new THREE.Color(color))});
	var object = new THREE.Line(line,material);
	scene.add(object);
}

function toVector3(vec){
	return new THREE.Vector3(vec.x,vec.y,0);
}

function curveToGeometry(curve){
	var path = new THREE.Path(curve.getPoints(SUBDIVISIONS));
	return path.createPointsGeometry(SUBDIVISIONS);
}

function getLineByDirection(sPt,direction,length){
	var geometry = new THREE.Geometry();
	geometry.vertices.push(sPt.clone());
	geometry.vertices.push(direction.clone().normalize().multiplyScalar(length).add(sPt));
	return geometry;
}

function getLineByPoints(sPt,ePt){
	var geometry = new THREE.Geometry();
	geometry.vertices.push(sPt.clone());
	geometry.vertices.push(ePt.clone());
	return geometry;
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
	return getLineByDirection(intersection,m_vec.clone().normalize(),5);
}

function fillet(line1,line2,t){
	var line3 = getMidLine(line1,line2);
	var eq1 = getEquationOfLine(line1);
	var eq2 = getEquationOfLine(line2);
	var eq3 = getEquationOfLine(line3);
	var cPt = evaluateLine(line3,t);
	var a1 = Math.pow(eq1.m,2) + 1;
	var b1 = 2*(eq1.m*eq1.b - eq1.m*cPt.y - cPt.x);
	var x1 = (-b1)/(2*a1)
	var y1 = eq1.m*x1+eq1.b;
	var pt1 = new THREE.Vector3(x1,y1,0);
	r = cPt.distanceTo(pt1);
	var a2 = Math.pow(eq2.m,2) + 1;
	var b2 = 2*(eq2.m*eq2.b - eq2.m*cPt.y - cPt.x);
	var x2 = (-b2)/(2*a2)
	var y2 = eq2.m*x2+eq2.b;
	var pt2 = new THREE.Vector3(x2,y2,0);
	var arc = arcToGeometry(getArcByPoints(cPt,r, pt1,pt2));
	var segments = getFilletSegments(line1,line2,pt1,pt2);
	var fillet = new THREE.Geometry();
	fillet.vertices.push(segments[0].vertices[0],segments[0].vertices[1]);
	for (var i = 0; i < arc.vertices.length; i++){
		fillet.vertices.push(arc.vertices[i]);
	}
	fillet.vertices.push(segments[1].vertices[0],segments[1].vertices[1]);
	return fillet;
}

function getArcByPoints(cPt,r,pt1,pt2,changeDirection){
	var line1 = getLineByPoints(cPt,pt1);
	var line2 = getLineByPoints(cPt,pt2);
	var eq1 = getEquationOfLine(line1);
	var eq2 = getEquationOfLine(line2);
	var theta1, theta2;
	pt1.x < cPt.x ? theta1 = Math.PI+Math.atan(eq1.m) : theta1 = Math.atan(eq1.m);
	pt2.x < cPt.x ? theta2 = Math.PI+Math.atan(eq2.m) : theta2 = Math.atan(eq2.m);
	theta1 > theta2 ? clockwise = true : clockwise = false;
	if (changeDirection) clockwise = !clockwise;
	return getArcByAngles(cPt,r,theta1,theta2,clockwise);
}

function getFilletSegments(line1,line2,pt1,pt2){
	var intersection = getLineLineIntersection(line1,line2);
	Math.abs(line1.vertices[0].x-intersection.x) > Math.abs(line1.vertices[1].x-intersection.x) ? sPt1 = line1.vertices[0] : sPt1 = line1.vertices[1];
	Math.abs(line2.vertices[0].x-intersection.x) > Math.abs(line2.vertices[1].x-intersection.x) ? sPt2 = line2.vertices[0] : sPt2 = line2.vertices[1];
	var segment1 = getLineByPoints(sPt1,pt1);
	var segment2 = getLineByPoints(sPt2,pt2);
	return [segment1,segment2];
}


function joinCurves(curves){
	for (var i = 0; i < curves.length; i++){
		//do stuff
	}
}

function extrudePiece(geometry,distance,direction){
	var extrusion = geometry.clone();
	var num_vertices = geometry.vertices.length;
	for (var i = 0; i < num_vertices; i++){
		extrusion.vertices.push(extrusion.vertices[i].clone().add(direction.normalize().multiplyScalar(distance)));
	}
	for (var i = 0; i < num_vertices-1; i++){
		extrusion.faces.push(new THREE.Face3(i,i+1,num_vertices+i));
		extrusion.faces.push(new THREE.Face3(i+1,num_vertices+i,num_vertices+i+1));
	}
	return extrusion;
}