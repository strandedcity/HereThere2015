var sheet_thickness=1/12, sheet_width=192, sheet_height=384, sheets=[], sheet_count = 0;
 
 $(window).load(function(){
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
	drawElements();
	loadJson();
	model_init();
	cut_init();
	updateScenes();
	animate();
});

window.addEventListener('resize',function(){
	drawElements();
});

function drawElements(){
	$("#sheet_thickness_value").val(toFractionString32(sheet_thickness*12*32)+"\"");
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