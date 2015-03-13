 $(window).load(function(){
    $( "#slider" ).slider({
      orientation: "vertical",
      range: "min",
      min: 7,
      max: 18,
      value: 12,
      slide: function( event, ui ) {
		clearScene();
        drawModelGeometry(45,ui.value);
      }
    });
	drawModelGeometry(45,$("#slider").slider("value"));
});