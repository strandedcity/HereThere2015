 var solar_tilt=45, lamp_height=12, draw_construction = false, sheet_width=192, sheet_height=384, sheets=[], sheet_count = 0;
 
 $(window).load(function(){
	var dial_width = Math.round($('#slider_container').width()*.5);
	$('#construction_button').click(function() {
		if ($(this).hasClass('active')){
			$(this).removeClass('active');
			draw_construction = false;
		} else {
			$(this).addClass('active');
			draw_construction = true;
		}
		updateScenes();
    });
	$('#construction_button').width(dial_width);
	$('#construction_button').textfill();

	var map_width = $('#map').width()
    var map_height = $('#map').height()

	$('#map_pin').draggable({
		containment:'parent'
		, drag: function(event, ui){
			// calculate geographic coordinates
			// from pointer position on map
            var offset = $(this).offset();
            var xPos = ui.position.left;
            var yPos = ui.position.top; 
        	var relative_pos = get_relative_position(
	        		xPos
	        		, yPos
	        		, map_width-20
	        		, map_height-20)
        	var coors = get_geo_coordinates_from_relative_coordinates(
						relative_pos.x
						, relative_pos.y)

        	// get solar noon from map angle
            solarNoon = get_sun_angles(coors.lat, coors.lng).solarNoon

            // naive assumption: set tilt to this angle
            // (original range was -15 to 89)
            solar_tilt = solarNoon
            updateScenes()
        }
	})

	// $("#dial").knob({
	// 	'width':dial_width,
	// 	'height':dial_width,
	// 	fgColor:"orange",
	// 	min:-15,
	// 	max:89,
	// 	angleArc:104,
	// 	angleOffset:255,
 //        change: function(v) {
	// 		solar_tilt = v;
	// 		updateScenes();
	// 	}
	// });
    $("#slider").slider({
      orientation: "vertical",
      range: "min",
      min: 7,
      max: 18,
      value: lamp_height,
      slide: function(event,ui) {
		lamp_height = ui.value;
		updateScenes();
		$("#height_label").html(lamp_height + " ft");
      }
    });
	$("#sheet_width_slider").slider({
		range: "min",
		min: 1,
		max: 576,
		value: sheet_width,
		slide: function(event,ui){
			sheet_width = ui.value;
			$("#sheet_width_value").val(Math.floor(sheet_width/12).toString()+"\' "+(sheet_width%12).toString()+"\"");
		}
	});
	$("#sheet_height_slider").slider({
		range: "min",
		min: 1,
		max: 576,
		value: sheet_height,
		slide: function(event,ui){
			sheet_height = ui.value;
			$("#sheet_height_value").val(Math.floor(sheet_height/12).toString()+"\' "+(sheet_height%12).toString()+"\"");
		}
	});
	$("#add_sheet_button").click(function(event){
		var sheet = {width:sheet_width, height:sheet_height, id:sheet_count};
		sheets.push(sheet);
		updateSheets();
		addSheet(sheet);
		updateScenes();
		sheet_count += 1;
	});
	$("#sheet_list").on('click','.close_button',function(){
		var index = this.getAttribute('data-index');
		var id = sheets[index].id;
		removeSheet(index);
		sheets.splice(index,1);
		updateSheets();
		updateScenes();
	});
	updateScenes();
	drawElements();
});

window.addEventListener('resize',function(){
	drawElements();
});

function drawElements(){
	var dial_width = Math.round($('#slider_container').width()*.5);
	 $('#dial').trigger(
        'configure',
        {
            'width':dial_width
        }
    );
	$('#construction_button').width(dial_width);
	$("#height_label").html(lamp_height + " ft");
	$('#height_label').css('fontSize',$('#dial').css('font-size'));
	$('#construction_button').css('margin-top',window.innerHeight/20);
	$('#construction_button').css('margin-bottom',window.innerHeight/20);
	$('#height_label').css('margin-top',window.innerHeight/20);
	$("#slider").height((window.innerHeight-$('#construction_button').outerHeight(true)-$('#dial').siblings().outerHeight(true)-$('#height_label').outerHeight(true))*.3);
	$('#sheet_maker').css('margin-top',window.innerHeight/20);
	$("#sheet_width_value").val(Math.floor(sheet_width/12).toString()+"\' "+(sheet_width%12).toString()+"\"");
	$("#sheet_height_value").val(Math.floor(sheet_height/12).toString()+"\' "+(sheet_height%12).toString()+"\"");
	$("#sheet_width_value").css('width',$("#sheet_width_value").parent().width()-$("#sheet_width_value").prev().width()-6);
	$("#sheet_height_value").css('width',$("#sheet_height_value").parent().width()-$("#sheet_height_value").prev().width()-6);
	
}

function updateSheets(){
	$("#sheet_list").empty();
	for (var i = 0; i < sheets.length; i++){
		$("#sheet_list").append("<p align='left'>Sheet "+sheets[i].id+": "+sheets[i].width+"x"+sheets[i].height+"</p><a class='close_button' data-index='"+i+"'></a>");
	}
}




//// -----
//// map pointer --> sun angles
//// -----

// takes x and y (which scale from 0 to 100)
// and returns geographic coordinates 
function get_geo_coordinates_from_relative_coordinates (x,y) {
	// if y is less than 50
	// , give a southern hemisphere lat
	var lng = y.map(0,100,-90,90)
	var lat = y.map(0,100,-90,90)

	return {
		lat:lat
		, lng: lng
	}
}

// find the date of the sunniest equinox at given latitude
function find_sunniest_equinox (lat) {
	var d = new Date()
	// if southern altitude, sunnier equinox is march 20
	if (lat<0) return d.setMonth(2,20)
	// if northern, september 23
	return d.setMonth(8,23)
}

// returns an object with three sun angles 
// 1. sunriseEnd (bottom edge of sun touches horizon)
// 2. solarNoon (sun's highest position)
// 3. sunsetStart (bottom edge of sun touches horizon)
function get_sun_angles (lat, lng) {

	var times = SunCalc.getTimes(
		// new Date(find_sunniest_equinox(lat))
		new Date()
		, lat
		, lng)

	return _.zipObject(
		// keys
		['sunriseEnd', 'solarNoon', 'sunriseStart']
		// values
		, _.map([times.sunriseEnd, times.solarNoon, times.sunsetStart], function (time) {
			return SunCalc.getPosition(time, lat, lng).altitude * (180 / Math.PI)
		}))
}

// returns an object with x, y
// where x and y scale from 0 (min) to 100 (max)
function get_relative_position (x,y,max_x,max_y) {
	return { 
		x: x.map(0, max_x, 0, 100)
		, y: y.map(0, max_y, 0, 100)
	}
}

Number.prototype.map = function ( in_min , in_max , out_min , out_max ) {
  return ( this - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
}


