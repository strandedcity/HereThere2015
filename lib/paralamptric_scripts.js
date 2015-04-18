 var solar_tilt=45, lamp_height=12, lamp_width=3, draw_construction = false, sheet_thickness=1/12, sheet_width=192, sheet_height=384, sheets=[], sheet_count = 0;
 
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

	var map_width = $('#map').width()
    var map_height = $('#map').height()

	$('#map_pin').draggable({
		containment:'parent'
		, drag: function(event, ui){
			// calculate geographic coordinates from pointer position on map
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
            solarNoon = get_solar_noon(coors.lat, coors.lng)

            // naive assumption: set tilt to this angle (original range was -15 to 89)
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
	//       change: function(v) {
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
	$("#width_slider").slider({
		range: "min",
		min: 12,
		max: 72,
		value: lamp_width*12,
		slide: function(event,ui){
			lamp_width = ui.value/12;
			updateScenes();
			$("#width_value").val(Math.floor(ui.value/12).toString()+"\' "+(ui.value%12).toString()+"\"");
		}
	});
	$("#sheet_thickness_slider").slider({
		range: "min",
		min: 1,
		max: 32,
		value: sheet_thickness*32*12, //convert from feet to 1/32"
		slide: function(event,ui){
			sheet_thickness = ui.value/32/12;
			updateScenes();
			$("#sheet_thickness_value").val(toFractionString32(ui.value)+"\"");
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
		var sheet = {width:sheet_width/12, height:sheet_height/12, id:sheet_count};
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
	$("#download_button").click(function(event){
		createSVG();
	});
	$(".unclick").mouseup(function(event){
		$(this).blur();
	});
	$("#sheet_width_value").change(function(event){
		sheet_width = $(this).val();
		$("#sheet_width_slider").slider("value",$(this).val());
		$("#sheet_width_value").val(Math.floor(sheet_width/12).toString()+"\' "+(sheet_width%12).toString()+"\"");
		$("#sheet_width_value").blur();
	});
	$("#sheet_height_value").change(function(event){
		sheet_height = $(this).val();
		$("#sheet_height_slider").slider("value",$(this).val());
		$("#sheet_height_value").val(Math.floor(sheet_height/12).toString()+"\' "+(sheet_height%12).toString()+"\"");
		$("#sheet_height_value").blur();
	});
	drawElements();
	model_init();
	cut_init();
	animate();
	updateScenes();
});

window.addEventListener('resize',function(){
	drawElements();
});

function drawElements(){
	var dial_width = Math.round($('#slider_container').width()*.5);
	 // $('#dial').trigger(
        // 'configure',
        // {
            // 'width':dial_width
        // }
    // );
	$("#height_label").html(lamp_height + " ft");
	$("#slider").height((window.innerHeight-$('#construction_button').outerHeight(true)-$('#dial').siblings().outerHeight(true)-$('#height_label').outerHeight(true))*.2);
	$("#sheet_thickness_value").val(toFractionString32(sheet_thickness*12*32)+"\"");
	$("#width_value").val(Math.floor(lamp_width).toString()+"\' "+(lamp_width%1*12).toString()+"\"");
	$("#sheet_width_value").val(Math.floor(sheet_width/12).toString()+"\' "+(sheet_width%12).toString()+"\"");
	$("#sheet_height_value").val(Math.floor(sheet_height/12).toString()+"\' "+(sheet_height%12).toString()+"\"");
	$("#sheet_width_value").css('width',$("#sheet_width_value").parent().width()-$("#sheet_width_value").prev().width()-6);
	$("#sheet_height_value").css('width',$("#sheet_height_value").parent().width()-$("#sheet_height_value").prev().width()-6);
	$(".geometry_super_container").css('height',window.innerHeight);
	$("#download_button").css('position','absolute');
	$("#download_button").css('left',$("#cut_container").width()-$("#download_button").width()-40);
	$("#download_button").css('top',$("#cut_container").height());
}

function updateSheets(){
	$("#sheet_list").empty();
	for (var i = 0; i < sheets.length; i++){
		$("#sheet_list").append("<p align='left'>Sheet "+sheets[i].id+": "+Math.floor(sheets[i].width).toString()+"\' "+(sheets[i].width*12%12).toString()+"\" x "+Math.floor(sheets[i].height).toString()+"\' "+(sheets[i].height*12%12).toString()+"\"</p><a class='close_button' data-index='"+i+"'></a>");
	}
}

function toFractionString32(numerator){
	var whole = Math.floor(numerator/32);
	var top=numerator-whole*32, bottom=32;
	if (numerator%32 == 0){
		return whole.toString();
	} else if(numerator%16 == 0){
		top = numerator/16;
		bottom = 2;
	} else if (numerator%8 == 0){
		top = numerator/8;
		bottom = 4;
	} else if (numerator%4 == 0){
		top = numerator/4;
		bottom = 8;	
	} else if (numerator%2 == 0){
		top = numerator/2;
		bottom = 16;
	}
	if (whole > 0){
		return whole.toString()+" "+top.toString()+"/"+bottom.toString();
	} else { 
		return top.toString()+"/"+bottom.toString();
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
function get_solar_noon (lat, lng) {

	var times = SunCalc.getTimes(
		// new Date(find_sunniest_equinox(lat))
		new Date()
		, lat
		, lng)

	// get altitude at solar noon
	return SunCalc.getPosition(times.solarNoon, lat, lng)
		//convert radians to degrees
		.altitude * (180 / Math.PI)

	// return _.zipObject(
	// 	// keys
	// 	['sunriseEnd', 'solarNoon', 'sunriseStart']
	// 	// values
	// 	, _.map([times.sunriseEnd, times.solarNoon, times.sunsetStart], function (time) {
			
	// 	}))
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


