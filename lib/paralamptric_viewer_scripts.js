/* TODO */
/* add sheet thickness parameter controlled by user
/* add dynamic diagram to show what the sun angle is doing
*/

/* GLOBAL VARIABLES */
var SUBDIVISIONS = 50;
var TOLERANCE = .001;
var model_renderer, model_scene, model_camera, model_controls;
var cut_renderer, cut_scene, cut_camera, cut_controls, cut_objects;
var svg_renderer, svg_scene, svg_camera, svg_geometry;
var cut_sheets = [];
var CLOSENESS = 32;
var NUBBIN_LENGTH = .25;
var skin_object = {origin:new THREE.Vector3(0,0,0)}, rib_object = {origin:new THREE.Vector3(0,0,0)};
var current_object, original_coords, model_movement;
var construction_color = "rgb(210,210,210)";

/* CREATE SVG */
function createSVG(){
	for (var i=0; i < sheets.length; i++){
		svg_scene = new THREE.Scene();
		svg_renderer = new THREE.SVGRenderer({antialias:true});
		svg_renderer.setSize(sheets[i].width,sheets[i].height);
		svg_camera = new THREE.OrthographicCamera(
			0,					// Left
			sheets[i].width,	// Right
			0,					// Top
			-sheets[i].height,	// Bottom
			.1,					// Near
			10000				// Far
		);	
		svg_camera.position.set(0,0,1);
		for (var j = 0; j < svg_geometry.length; j++){
			var remapped_geometry = subtractVectorFromGeometry(svg_geometry[j],cut_sheets[i].vertices[0]);
			drawLine(svg_scene,remapped_geometry,"black");
		}
		svg_renderer.render(svg_scene,svg_camera);
		exportSVG(svg_renderer,"Sheet"+sheets[i].id+"-"+Math.floor(sheets[i].width).toString()+"\'"+(sheets[i].width*12%12).toString()+"\"x"+Math.floor(sheets[i].height).toString()+"\'"+(sheets[i].height*12%12).toString());
	}
}

function exportSVG(renderer,id) {
	var XMLS = new XMLSerializer();
	var svgfile = XMLS.serializeToString(renderer.domElement);
	downloadBlob(svgfile,"TheTwo-" + id);
}

function downloadBlob(stringData,filename){
	var processedFilename = filename || "halftone";
	processedFilename += ".svg";
	window.URL = window.URL || window.webkitURL;
	var blob = new Blob([stringData], {type: 'image/svg+xml'});
	var link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.innerHTML = "Download";
	link.download = processedFilename;
	link.click();
}

function subtractVectorFromGeometry(geometry,vector){
	var new_geometry = new THREE.Geometry();
	for (var i = 0; i < geometry.vertices.length; i++){
		new_geometry.vertices.push(geometry.vertices[i].clone().sub(vector));
	}
	return new_geometry;
}

/* INIT */
function updateScenes(){
	clearScene(model_scene);
	clearScene(cut_scene);
	drawModelGeometry(solar_tilt,lamp_height,draw_construction);
	drawCutGeometry();
	model_controls.target = new THREE.Vector3(0,11,0);
	model_controls.update();
	animate();
}

function clearScene(scene){
	for (var i = scene.children.length - 1; i >= 0 ; i -- ) {
		var obj = scene.children[i];
		if (!THREE.HemisphereLight.prototype.isPrototypeOf(obj)) {
			scene.remove(obj);
		}
	}
	animate();
}

function model_init(){
	model_scene = new THREE.Scene();
	model_renderer = setupRenderer(document.getElementById('model_container'),"white");
	model_camera = setupPerspectiveCamera(model_scene,document.getElementById('model_container'));
	setupLights(model_scene);
	model_controls = new THREE.OrbitControls(model_camera, model_renderer.domElement,false);
	model_controls.addEventListener( 'change', animate );
	setupWindowResizes(model_scene,model_renderer,model_camera,document.getElementById('model_container'));
}

function cut_init(){
	cut_scene = new THREE.Scene();
	cut_renderer = setupRenderer(document.getElementById('cut_container'),"white",true);
	cut_camera = setupOrthographicCamera(cut_scene,document.getElementById('cut_container'));
	setupLights(cut_scene);
	cut_controls = new THREE.OrbitControls(cut_camera, cut_renderer.domElement,true);
	cut_controls.noRotate = true;
	cut_controls.addEventListener( 'change', animate );
	setupWindowResizes(cut_scene,cut_renderer,cut_camera,document.getElementById('cut_container'));
}

function animate(){
	model_renderer.render(model_scene,model_camera);
	cut_renderer.render(cut_scene,cut_camera);
}

function setupRenderer(container,color,isSVG){
	var renderer = isSVG ? new THREE.SVGRenderer({antialias:true}) : new THREE.WebGLRenderer({antialias:true});
	renderer.setSize($("#"+container.id).width(),$("#"+container.id).height());
	renderer.setClearColor(new THREE.Color(color)); 
	container.appendChild(renderer.domElement);
	return renderer;
}

function setupPerspectiveCamera(scene,container){
	var camera = new THREE.PerspectiveCamera(
		45,         // Field of view
		$("#"+container.id).width()/$("#"+container.id).height(),  // Aspect ratio
		.1,         // Near
		10000       // Far
	);
	camera.position.set(10,12,20);
	return camera;
}

function setupOrthographicCamera(scene,container){
	var camera = new THREE.OrthographicCamera(
		$("#"+container.id).width()/-CLOSENESS, // Left
		$("#"+container.id).width()/CLOSENESS,  // Right
		$("#"+container.id).height()/CLOSENESS, // Top
		$("#"+container.id).height()/-CLOSENESS, // Bottom
		.1,			// Near
		10000 		// Far
	);	
	camera.position.set(0,0,1);
	return camera;
}

function setupLights(scene){
	var hemisphere_light = new THREE.HemisphereLight(0xffffff,0x8c8c8c,1);
	scene.add(hemisphere_light);
}

function setupWindowResizes(scene,renderer,camera,container){
	window.addEventListener('resize',function(){
		width = $("#"+container.id).width();
		height = $("#"+container.id).height();
		renderer.setSize(width,height);
		camera.aspect = width/height;
		camera.left = width/-CLOSENESS;
		camera.right = width/CLOSENESS;
		camera.top = height/CLOSENESS;
		camera.bottom = height/-CLOSENESS;
		camera.updateProjectionMatrix();
		renderer.render(scene,camera);
	});
}

/* DRAW GEOMETRY */

function drawCutGeometry(){
	svg_geometry = [];
	updateVertices(skin_object);
	updateVertices(rib_object);
	
	// Draw skin
	drawLine(cut_scene,skin_object.geometry,"black");
	svg_geometry.push(skin_object.geometry);
	
	// Draw rib
	drawLine(cut_scene,rib_object.geometry,"black");
	svg_geometry.push(rib_object.geometry);
	
	// Draw stipples
	var stipples = [];
	stipples.push(getStipple(skin_object.geometry.vertices[0].clone(),getLength(skin_object.pieces[0]),getLength(skin_object.pieces[1])));
	stipples.push(getStipple(skin_object.geometry.vertices[0].clone(),getLength(skin_object.pieces[0])+getLength(skin_object.pieces[1])+getLength(skin_object.pieces[2]),getLength(skin_object.pieces[3])));
	for (var i = 0; i < stipples.length; i++){
		for (var j = 0; j < stipples[i].length; j++){
			drawLine(cut_scene,stipples[i][j],"black");
			svg_geometry.push(stipples[i][j]);
		}
	}
	
	/* Draw slot */
	var slot_pt = skin_object.geometry.vertices[0].clone().add(new THREE.Vector3(lamp_width/2-sheet_thickness/2,-(getLength(skin_object.pieces[0])+getLength(skin_object.pieces[1])),0));
	var slot = getRectangle(slot_pt,sheet_thickness,getLength(skin_object.pieces[2]));
	drawLine(cut_scene,slot,"black");
	svg_geometry.push(slot);
	
	// Draw nubbin holes
	var nubbin_holes = [];
	nubbin_holes.push(getRectangle(skin_object.geometry.vertices[0].clone().add(new THREE.Vector3(lamp_width/2-sheet_thickness/2,-getLength(skin_object.pieces[0])*skin_object.nubbin_ts[0]+NUBBIN_LENGTH/2,0)),sheet_thickness,NUBBIN_LENGTH));
	nubbin_holes.push(getRectangle(skin_object.geometry.vertices[0].clone().add(new THREE.Vector3(lamp_width/2-sheet_thickness/2,-getLength(skin_object.pieces[0])*skin_object.nubbin_ts[1]+NUBBIN_LENGTH/2,0)),sheet_thickness,NUBBIN_LENGTH));
	nubbin_holes.push(getRectangle(skin_object.geometry.vertices[3].clone().add(new THREE.Vector3(lamp_width/2-sheet_thickness/2,getLength(skin_object.pieces[skin_object.pieces.length-1])*skin_object.nubbin_ts[0]+NUBBIN_LENGTH/2,0)),sheet_thickness,NUBBIN_LENGTH));
	nubbin_holes.push(getRectangle(skin_object.geometry.vertices[3].clone().add(new THREE.Vector3(lamp_width/2-sheet_thickness/2,getLength(skin_object.pieces[skin_object.pieces.length-1])*skin_object.nubbin_ts[1]+NUBBIN_LENGTH/2,0)),sheet_thickness,NUBBIN_LENGTH));
	for (var i = 0; i < nubbin_holes.length; i++){
		drawLine(cut_scene,nubbin_holes[i],"black");
		svg_geometry.push(nubbin_holes[i]);
	}

	// Draw cut sheets
	for (var i = 0; i < cut_sheets.length; i++){
		drawLine(cut_scene,cut_sheets[i],"gray");
	}
	
	// Render
	cut_renderer.render(cut_scene,cut_camera);
}

function drawModelGeometry(solar_tilt,lamp_height,draw_construction){
	var neckCircle_center = new THREE.Vector3(0,0,0), neckCircle_radius = 1.6;
	var neckCircle = getCircle(neckCircle_center,neckCircle_radius,"blue");
	
	var topOfBody_t = .09;
	var topOfBody_pt = toVector3(neckCircle.getPoint(topOfBody_t));
	var topOfBody_tan = toVector3(neckCircle.getTangent(topOfBody_t));
	
	var topOfNeck_t = 1-(Math.PI/2-degreesToRadians(solar_tilt))/(2*Math.PI);
	var topOfNeck_pt = toVector3(neckCircle.getPoint(topOfNeck_t));
	var topOfNeck_tan = toVector3(neckCircle.getTangent(topOfNeck_t).multiplyScalar(-1));
	
	var neck = arcToGeometry(getArcByPoints(neckCircle_center,neckCircle_radius,topOfNeck_pt,topOfBody_pt));
	
	var head_length = 3.6;
	var head = getLineByDirection(topOfNeck_pt,topOfNeck_tan,head_length);
	
	var topOfHead_pt = head.vertices[1];
	
	var bellyCircle_radius = .75;
	var body_angle = Math.PI-topOfBody_tan.angleTo(new THREE.Vector3(1,0,0));
	var belly_height = bellyCircle_radius*Math.sin(Math.PI/2-body_angle)+bellyCircle_radius;
	var head_height = topOfHead_pt.y-topOfBody_pt.y;
	var body_height = lamp_height-belly_height-head_height;
	var body_length = body_height/Math.sin(body_angle);
	var body = getLineByDirection(topOfBody_pt,topOfBody_tan,body_length);
	
	var topOfBelly_pt = body.vertices[1];
	
	var bodyPerpendicular = getPerpendicular(topOfBody_tan);
	var bellyCircle_center = bodyPerpendicular.clone().multiplyScalar(bellyCircle_radius).add(topOfBelly_pt);
	var bellyCircle = getCircle(bellyCircle_center,bellyCircle_radius);
	
	var bottomOfBelly_t = .25, tail_length = 4;
	var bottomOfBelly_pt = toVector3(bellyCircle.getPoint(bottomOfBelly_t));
	var bottomOfBelly_tan = toVector3(bellyCircle.getTangent(bottomOfBelly_t).multiplyScalar(-1));
	var tail = getLineByDirection(bottomOfBelly_pt,bottomOfBelly_tan,tail_length);
	
	var belly = arcToGeometry(getArcByPoints(bellyCircle_center,bellyCircle_radius,bottomOfBelly_pt,topOfBelly_pt));
	
	var throat_fillet_t = Math.max(solar_tilt/90*2,.5);
	var throat_t = (topOfBody_t + (topOfNeck_t - 1))/2;
	var throat_pt = toVector3(neckCircle.getPoint(throat_t));
	var upperThroat = getLineByPoints(topOfHead_pt,throat_pt);
	var lowerThroat = getLineByPoints(topOfBelly_pt,throat_pt);
	var throat = fillet(upperThroat,lowerThroat,throat_fillet_t,draw_construction);
	
	var back_fillet_t = .25;
	var upperBack = getLineByPoints(topOfBody_pt,bellyCircle_center);
	var lowerBack = getLineByPoints(tail.vertices[1],bellyCircle_center);
	var back = fillet(lowerBack,upperBack,back_fillet_t,draw_construction);
	
	model_movement = new THREE.Vector3(0,lamp_height,0);
	/* Draw Construction */
	if (draw_construction){
		drawPoint(model_scene,neckCircle_center,construction_color,model_movement);
		drawCircle(model_scene,neckCircle,construction_color,model_movement);
		drawPoint(model_scene,topOfBody_pt,construction_color,model_movement);
		drawTangent(model_scene,topOfBody_pt,topOfBody_tan.clone().negate(),construction_color,model_movement);
		drawPoint(model_scene,topOfNeck_pt,construction_color,model_movement);
		drawTangent(model_scene,topOfNeck_pt,topOfNeck_tan.clone().negate(),construction_color,model_movement);
		drawPoint(model_scene,topOfHead_pt,construction_color,model_movement);
		drawPoint(model_scene,topOfBelly_pt,construction_color,model_movement);
		drawPoint(model_scene,bellyCircle_center,construction_color,model_movement);
		drawCircle(model_scene,bellyCircle,construction_color,model_movement);
		drawPoint(model_scene,bottomOfBelly_pt,construction_color,model_movement);
		drawTangent(model_scene,bottomOfBelly_pt,bottomOfBelly_tan,construction_color,model_movement);
	}
	
	var extrusion_direction = new THREE.Vector3(0,0,-1);
	var skin_color = 'rgb(230,230,230)';
	var head_extrusion = extrudePiece(head,lamp_width,extrusion_direction,true);
	var neck_extrusion = extrudePiece(neck,lamp_width,extrusion_direction,true);
	var body_extrusion = extrudePiece(body,lamp_width,extrusion_direction,true);
	var belly_extrusion = extrudePiece(belly,lamp_width,extrusion_direction,true);
	var tail_extrusion = extrudePiece(tail,lamp_width,extrusion_direction,true);
	drawMesh(model_scene,head_extrusion,skin_color,model_movement,true);
	drawMesh(model_scene,neck_extrusion,skin_color,model_movement,true);
	drawMesh(model_scene,body_extrusion,skin_color,model_movement,true);
	drawMesh(model_scene,belly_extrusion,skin_color,model_movement,true);
	drawMesh(model_scene,tail_extrusion,skin_color,model_movement,true);
	
	
	// var plane = new THREE.PlaneBufferGeometry( 20000, 20000 );
	// drawPlane(model_scene,plane,bottomOfBelly_pt.y,"gray");
	
	var rib = makeShape([head,neck,back,tail,belly,throat]);
	var rib_extrusion = new THREE.ExtrudeGeometry(rib,{amount:sheet_thickness, curveSegments:3,bevelEnabled: false});
	drawMesh(model_scene,rib_extrusion,skin_color,new THREE.Vector3(0,lamp_height,-sheet_thickness/2),false);
	
	var nubbin_ts = [.25,.75]
	var nubbin_tail = addNubbins(tail.clone(),tail.vertices[0].clone(),tail.vertices[1].clone(),nubbin_ts,NUBBIN_LENGTH);
	var nubbin_head = addNubbins(head.clone(),head.vertices[0].clone(),head.vertices[1].clone(),nubbin_ts,NUBBIN_LENGTH);
	skin_object.pieces = [head.clone(),neck.clone(),body.clone(),belly.clone(),tail.clone()]
	rib_object.geometry = joinGeometry([nubbin_head.clone(),neck.clone(),back.clone(),nubbin_tail.clone(),belly.clone(),throat.clone()]);
	var skin_length = 0;
	for (var i = 0; i < skin_object.pieces.length; i++){
		skin_length += getLength(skin_object.pieces[i]);
	}
	var pt = new THREE.Vector3(0,0,0);
	skin_object.geometry = getRectangle(pt,lamp_width,skin_length);
	skin_object.original_vertices = skin_object.geometry.vertices.slice();
	rib_object.original_vertices = rib_object.geometry.vertices.slice();
	skin_object.nubbin_ts = nubbin_ts;
	cut_objects = [skin_object,rib_object];
}

/* HELPER FUNCTIONS */
function addSheet(sheet){
	var pt;
	if (cut_sheets.length < 1){
		pt = new THREE.Vector3(cut_camera.left+1,cut_camera.top-1,0);
	} else {
		pt = cut_sheets[cut_sheets.length-1].vertices[1].clone().add(new THREE.Vector3(1,0,0));
	}
	var rect = getRectangle(pt,sheet.width,sheet.height);
	cut_sheets.push(rect);
}

function removeSheet(index){
	cut_sheets.splice(index,1);
}

function updateVertices(object){
	for (var i = 0; i < object.geometry.vertices.length; i++){
		object.geometry.vertices[i] = object.original_vertices[i].clone().sub(object.origin);
	}
	object.geometry.verticesNeedUpdate = true;
}

/* GRAB EVENTS */
function onMouseLeft(event){
	grabObject(event);
	if (typeof current_object !== 'undefined'){
		document.body.style.cursor = 'move';
		document.addEventListener( 'mousemove', moveObject, false );
		document.addEventListener( 'mouseup', releaseObject, false );
		document.addEventListener( 'touchmove', moveObject, false );
		document.addEventListener( 'touchend', releaseObject, false );
	}
}

function grabObject(event){
	var coords = screenToWorld(event);
	for (var i = 0; i < cut_objects.length; i++){
		cut_objects[i].geometry.computeBoundingBox();
		var bounding_box = cut_objects[i].geometry.boundingBox;
		if (inBox(coords,bounding_box)){
			original_coords = coords;
			current_object = cut_objects[i];
		}
	}
}

function moveObject(event){
	var new_coords = screenToWorld(event);
	var movement = original_coords.clone().sub(new_coords);
	current_object.origin.add(movement)
	updateVertices(current_object);
	original_coords = new_coords;
	clearScene(cut_scene);
	drawCutGeometry();
}

function releaseObject(){
	document.body.style.cursor = 'default';
	document.removeEventListener('mousemove',moveObject,false);
	original_coords = undefined;
	current_object = undefined;
}

/* GEOMETRY HELPER FUNCTIONS */
function inBox(coords,box){
	return (coords.x >= box.min.x && coords.x <= box.max.x && coords.y >= box.min.y && coords.y <= box.max.y);
}

function screenToWorld(event){
	var elem = cut_renderer.domElement;
	var boundingRect = elem.getBoundingClientRect();
	var container_vector = new THREE.Vector3(event.clientX - boundingRect.left,boundingRect.top-event.clientY,0);
	var world_vector = new THREE.Vector3((container_vector.x/boundingRect.width)*(cut_camera.right-cut_camera.left)/cut_camera.zoom+cut_camera.left/cut_camera.zoom+cut_camera.position.x,(container_vector.y/boundingRect.height)*(cut_camera.top-cut_camera.bottom)/cut_camera.zoom+cut_camera.top/cut_camera.zoom+cut_camera.position.y,0);
	return world_vector;
}

function drawPoint(scene,pt,color,movement){
	var movement = movement ? movement : new THREE.Vector3(0,0,0); 
	var material = new THREE.MeshBasicMaterial({color:new THREE.Color(color),side:THREE.DoubleSide});
	var geometry = moveGeometry(new THREE.CircleGeometry(.2,SUBDIVISIONS),movement);
	var object = new THREE.Mesh(geometry,material);
	object.position.set(pt.x,pt.y,pt.z);
	scene.add(object);
}

function drawLine(scene,line,color,movement){
	var movement = movement ? movement : new THREE.Vector3(0,0,0); 
	var material = new THREE.LineBasicMaterial({color:new THREE.Color(color)});
	var geometry = moveGeometry(line,movement);
	var object = new THREE.Line(geometry,material);
	scene.add(object);
}

function drawTangent(scene,sPt,tan,color,movement){
	var movement = movement ? movement : new THREE.Vector3(0,0,0); 
	var tan_length = 5;
	drawLine(scene,getLineByDirection(sPt,tan,tan_length),color,movement);
}

function drawCurve(scene,curve,color,movement){
	var movement = movement ? movement : new THREE.Vector3(0,0,0); 
	var path = new THREE.Path(curve.getPoints(SUBDIVISIONS));
	var geometry = moveGeometry(path.createPointsGeometry(SUBDIVISIONS),movement);
	var material = new THREE.LineBasicMaterial({color:new THREE.Color(color)});
	var object = new THREE.Line(geometry,material);
	scene.add(object);
}

function drawCircle(scene,circle,color,movement){
	var movement = movement ? movement : new THREE.Vector3(0,0,0); 
	var geometry = moveGeometry(curveToGeometry(circle),movement);
	var material = new THREE.LineBasicMaterial({color:new THREE.Color(color)});
	var object = new THREE.Line(geometry,material);
	scene.add(object);
}

function drawMesh(scene,mesh,color,movement,flip){
	var movement = movement ? movement : new THREE.Vector3(0,0,0); 
	// var material = new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture('./lib/textures/plywood.jpg'),side:THREE.DoubleSide } );
	var geometry = moveGeometry(mesh,movement);
	var material = new THREE.MeshLambertMaterial({specular: 0xF5F5F5,color: new THREE.Color(color),shininess: 5,side: THREE.DoubleSide});
	var object = new THREE.Mesh(geometry,material);
	if (flip){
		changeFaceOrientation(object.geometry);
	}
	scene.add(object);
}

function drawPlane(scene,geometry,y,color){
	var material = new THREE.MeshLambertMaterial({color:new THREE.Color(color),side:THREE.DoubleSide});
	var object = new THREE.Mesh(geometry,material);
	object.position.set(0,y-.1,0);
	object.rotation.x = - Math.PI / 2;
	object.receiveShadow = true;
	scene.add(object);
}

function toVector3(vec){
	return new THREE.Vector3(vec.x,vec.y,0);
}

function getLength(geometry){
	var length = 0;
	for (var i = 0; i < geometry.vertices.length-1; i++){
		length += geometry.vertices[i].distanceTo(geometry.vertices[i+1]);
	}
	return length;
}

function curveToGeometry(curve){
	var path = new THREE.Path(curve.getPoints(SUBDIVISIONS));
	return path.createPointsGeometry(SUBDIVISIONS);
}

function arcToGeometry(arc){
	var geometry = curveToGeometry(arc);
	geometry.vertices = geometry.vertices.slice(0,geometry.vertices.length-1);
	return geometry;
}

function addNubbins(line,sPt,ePt,ts,length){
	var new_vertices = [sPt];
	for (var i = 0; i < ts.length; i++){
		var cPt = evaluateLine(line,ts[i]);
		var tan = getLineTangent(line).normalize().multiplyScalar(length/2);
		var perp = getPerpendicular(tan).normalize().multiplyScalar(sheet_thickness);
		new_vertices.push(cPt.clone().sub(tan));
		new_vertices.push(cPt.clone().sub(tan).sub(perp));
		new_vertices.push(cPt.clone().add(tan).sub(perp));
		new_vertices.push(cPt.clone().add(tan));
	}
	new_vertices.push(ePt);
	var nubbin_line = new THREE.Geometry();
	nubbin_line.vertices = new_vertices;
	return nubbin_line;
}

function getStipple(sPt,offset,length){
	var stipple = [];
	var stipple_spacing_y = .1, stipple_spacing_x = .1, num_stipples = 3;
	var stipple_width = (lamp_width-(stipple_spacing_x)*(num_stipples-1))/num_stipples;
	for (var i = 0; i < Math.floor(length/stipple_spacing_y); i++){
		if (i%2 == 0){
			for (var j = 0; j < num_stipples; j++){
				stipple.push(getLineByDirection(sPt.clone().add(new THREE.Vector3(j*(stipple_width+stipple_spacing_x),-(offset+i*stipple_spacing_y),0)),new THREE.Vector3(1,0,0),stipple_width));
			}
		} else {
			var partial_stipple_width = (lamp_width-stipple_spacing_x*num_stipples-stipple_width*(num_stipples-1))/2;
			stipple.push(getLineByDirection(sPt.clone().add(new THREE.Vector3(0,-(offset+i*stipple_spacing_y),0)),new THREE.Vector3(1,0,0),partial_stipple_width));
			for (var j = 0; j < num_stipples-1; j++){
				stipple.push(getLineByDirection(sPt.clone().add(new THREE.Vector3(j*(stipple_width+stipple_spacing_x)+partial_stipple_width+stipple_spacing_x,-(offset+i*stipple_spacing_y),0)),new THREE.Vector3(1,0,0),stipple_width));
			}
			stipple.push(getLineByDirection(sPt.clone().add(new THREE.Vector3(lamp_width-partial_stipple_width,-(offset+i*stipple_spacing_y),0)),new THREE.Vector3(1,0,0),partial_stipple_width));
		}
	}
	return stipple;
}

function getRectangle(sPt,width,height){
	var vertices = [sPt.clone(),sPt.clone().add(new THREE.Vector3(width,0,0)),sPt.clone().add(new THREE.Vector3(width,-height,0)),sPt.clone().add(new THREE.Vector3(0,-height,0)),sPt.clone()];
	var rect = new THREE.Geometry();
	rect.vertices = vertices;
	rect.verticesNeedUpdate = true;
	return rect;
}

function getCircle(center,radius){
	var circle = new THREE.EllipseCurve(center.x,center.y,radius,radius,2*Math.PI,0,true)
	return circle;
}

function getArcByAngles(center,radius,start,end,clockwise){
	var arc = new THREE.EllipseCurve(center.x,center.y,radius,radius,start,end,clockwise)
	return arc;
}

function getArcByPoints(cPt,r,pt1,pt2){
	var line1 = getLineByPoints(cPt,pt1);
	var line2 = getLineByPoints(cPt,pt2);
	var eq1 = getEquationOfLine(line1);
	var eq2 = getEquationOfLine(line2);
	var theta1, theta2;
	pt1.x < cPt.x ? theta1 = Math.PI+Math.atan(eq1.m) : theta1 = Math.atan(eq1.m);
	pt2.x < cPt.x ? theta2 = Math.PI+Math.atan(eq2.m) : theta2 = Math.atan(eq2.m);
	return getArcByAngles(cPt,r,theta1,theta2,true);
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

function getPerpendicular(vec){
	return new THREE.Vector3(-vec.y,vec.x,0);
}

function getLineTangent(line){
	return line.vertices[1].clone().sub(line.vertices[0]).normalize();
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
	if (intersection.x > line1.vertices[0].x){
		m_vec = m_vec.clone().negate();
	}
	return getLineByDirection(intersection,m_vec.clone().normalize(),5);
}

function moveGeometry(geometry,movement){
	var moved_geometry = geometry.clone();
	moved_geometry.applyMatrix(new THREE.Matrix4().makeTranslation(movement.x,movement.y,movement.z));
	return moved_geometry;
}

function fillet(line1,line2,t,draw_construction){
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
	if (draw_construction){
		drawLine(model_scene,line3,construction_color,model_movement);
		drawPoint(model_scene,cPt,construction_color,model_movement);
		drawPoint(model_scene,pt1,construction_color,model_movement);
		drawPoint(model_scene,pt2,construction_color,model_movement);
		drawCircle(model_scene,getCircle(cPt,r),construction_color,model_movement);
	}
	return fillet;
}


function getFilletSegments(line1,line2,pt1,pt2){
	var intersection = getLineLineIntersection(line1,line2);
	Math.abs(line1.vertices[0].x-intersection.x) > Math.abs(line1.vertices[1].x-intersection.x) ? sPt1 = line1.vertices[0] : sPt1 = line1.vertices[1];
	Math.abs(line2.vertices[0].x-intersection.x) > Math.abs(line2.vertices[1].x-intersection.x) ? sPt2 = line2.vertices[0] : sPt2 = line2.vertices[1];
	var segment1 = getLineByPoints(sPt1,pt1);
	var segment2 = getLineByPoints(sPt2,pt2);
	return [segment1,segment2];
}

function joinGeometry(geometries){
	var vertices = [];
	if (samePlace(geometries[0].vertices[0],geometries[1].vertices[0]) || samePlace(geometries[0].vertices[0],geometries[1].vertices[geometries[1].vertices.length-1])){
		vertices.push.apply(vertices,geometries[0].vertices.slice(0).reverse());
	} else {
		vertices.push.apply(vertices,geometries[0].vertices);
	}
	for (var i = 1; i < geometries.length; i++){
		if (samePlace(geometries[i].vertices[0],vertices[vertices.length-1])){
			vertices.push.apply(vertices,geometries[i].vertices);
		} else {
			vertices.push.apply(vertices,geometries[i].vertices.slice(0).reverse());
		}
	}
	var geometry = new THREE.Geometry();
	geometry.vertices = vertices;
	return geometry;
}

function makeShape(geometries){
	var vertices = [];
	if (samePlace(geometries[0].vertices[0],geometries[1].vertices[0]) || samePlace(geometries[0].vertices[0],geometries[1].vertices[geometries[1].vertices.length-1])){
		vertices.push.apply(vertices,geometries[0].vertices.slice(0).reverse());
	} else {
		vertices.push.apply(vertices,geometries[0].vertices.slice(0));
	}
	for (var i = 1; i < geometries.length; i++){
		if (samePlace(geometries[i].vertices[0],vertices[vertices.length-1])){
			vertices.push.apply(vertices,geometries[i].vertices.slice(1));
		} else {
			vertices.push.apply(vertices,geometries[i].vertices.slice(0,-1).reverse());
		}
	}
	var new_vertices = [];
	for (var i = 0; i < vertices.length-1; i++){
		if (!samePlace(vertices[i],vertices[i+1])){
			new_vertices.push(vertices[i]);
		}
	}

	var shape = new THREE.Shape(new_vertices);
	var points = shape.createPointsGeometry();
	var geometry = new THREE.ShapeGeometry( shape );
	// return geometry;
	return shape;
}

function extrudePiece(geometry,distance,direction){
	var extrusion = geometry.clone();
	var num_vertices = geometry.vertices.length;
	for (var i = 0; i < num_vertices; i++){
		extrusion.vertices[i].sub(direction.normalize().multiplyScalar(distance/2));
	}
	for (var i = 0; i < num_vertices; i++){
		extrusion.vertices.push(extrusion.vertices[i].clone().add(direction.normalize().multiplyScalar(distance)));
	}
	for (var i = 0; i < num_vertices-1; i++){
		extrusion.faces.push(new THREE.Face3(i,i+1,num_vertices+i));
		extrusion.faces.push(new THREE.Face3(i+1,num_vertices+i+1,num_vertices+i));
	}
	return extrusion;
}

function samePlace(pt1,pt2){
	return pt1.distanceTo(pt2) <= TOLERANCE;
}

function degreesToRadians(degrees){
	return degrees * Math.PI/180;
}

function changeFaceOrientation(geom){
     for(var i = 0;i<geom.faces.length;i++){
        var face = geom.faces[ i ];
        if ( face instanceof THREE.Face3 ) {
            var tmp = face.b;
            face.b = face.c;
            face.c = tmp;

        } else if ( face instanceof THREE.Face4 ) {
            var tmp = face.b;
            face.b = face.d;
            face.d = tmp;                
        }
    }
    geom.computeFaceNormals();
    geom.computeVertexNormals();  	
}


// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix); //pre-multiply
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
}