 var solar_tilt=45, lamp_height=12, draw_construction = false;
 
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
		clearScene();
		drawModelGeometry(solar_tilt,lamp_height,draw_construction);
		drawCutGeometry();
    });
	$('#construction_button').width(dial_width);
	$('#construction_button').textfill();
	$("#dial").knob({
		'width':dial_width,
		fgColor:"orange",
		min:-15,
		max:89,
		angleArc:104,
		angleOffset:255,
        change: function(v) {
			solar_tilt = v;
			clearScene();
			drawModelGeometry(solar_tilt,lamp_height,draw_construction);
			drawCutGeometry();
		}
	});

    $( "#slider" ).slider({
      orientation: "vertical",
      range: "min",
      min: 7,
      max: 18,
      value: lamp_height,
      slide: function(event,ui) {
		lamp_height = ui.value;
		clearScene();
        drawModelGeometry(solar_tilt,lamp_height,draw_construction);
		drawCutGeometry();
		$( "#height_label" ).html(lamp_height);
      }
    });
	drawModelGeometry(solar_tilt,lamp_height,draw_construction);
	drawCutGeometry();
	$( "#height_label" ).html(lamp_height);
});

window.addEventListener('resize',function(){
	var dial_width = Math.round($('#slider_container').width()*.5);
	 $('#dial').trigger(
        'configure',
        {
            'width':dial_width
        }
    );
	$('#construction_button').width(dial_width);
});