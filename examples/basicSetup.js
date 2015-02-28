function sceneMaker(){
    this.init()
};

sceneMaker.prototype.init = function(){
    var camera, controls, renderer, container, scene;

    var c = document.createElement("div");
    c.id = "container";
    document.body.appendChild(c);

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 500;

    controls = new THREE.OrbitControls( camera );
    controls.damping = 0.2;
    controls.addEventListener( 'change', render );

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    function render() {
        renderer.render( scene, camera );
    }

    this.scene = scene;
    this.render = render;
};


