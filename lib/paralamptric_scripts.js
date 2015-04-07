 var solar_tilt=45, lamp_height=12, draw_construction = false, sheet_width=24, sheet_height=48, sheets=[], sheet_count = 0;
 
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
	$("#dial").knob({
		'width':dial_width,
		'height':dial_width,
		fgColor:"orange",
		min:-15,
		max:89,
		angleArc:104,
		angleOffset:255,
        change: function(v) {
			solar_tilt = v;
			updateScenes();
		}
	});
    $("#slider").slider({
      orientation: "vertical",
      range: "min",
      min: 7,
      max: 18,
      value: lamp_height,
      slide: function(event,ui) {
		lamp_height = ui.value;
		updateScenes();
		$("#height_label").html(lamp_height);
      }
    });
	$("#sheet_width_slider").slider({
		range: "min",
		min: 1,
		max: 48,
		value: sheet_width,
		slide: function(event,ui){
			sheet_width = ui.value;
			$("#sheet_width_value").val(sheet_width);
		}
	});
	$("#sheet_height_slider").slider({
		range: "min",
		min: 1,
		max: 96,
		value: sheet_height,
		slide: function(event,ui){
			sheet_height = ui.value;
			$("#sheet_height_value").val(sheet_height);
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
	$("#height_label").html(lamp_height);
	$('#height_label').css('fontSize',$('#dial').css('font-size'));
	$('#construction_button').css('margin-top',window.innerHeight/20);
	$('#construction_button').css('margin-bottom',window.innerHeight/10);
	$('#height_label').css('margin-top',window.innerHeight/20);
	$("#slider").height((window.innerHeight-$('#construction_button').outerHeight(true)-$('#dial').siblings().outerHeight(true)-$('#height_label').outerHeight(true))*.5);
	$('#sheet_maker').css('margin-top',window.innerHeight/20);
	$("#sheet_width_value").val(sheet_width);
	$("#sheet_height_value").val(sheet_height);
	
}

function updateSheets(){
	$("#sheet_list").empty();
	for (var i = 0; i < sheets.length; i++){
		$("#sheet_list").append("<p align='left'>Sheet "+sheets[i].id+": "+sheets[i].width+"x"+sheets[i].height+"</p><a class='close_button' data-index='"+i+"'></a>");
	}
}