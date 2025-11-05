import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


export function createScene(){

    const clock = new THREE.Clock();
    const window = document.getElementById('render-target')
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x777777)

    const camera = new THREE.PerspectiveCamera(71, window!.offsetWidth / window!.offsetHeight, 0.1, 2000);
    
    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window!.offsetWidth, window!.offsetHeight)
    window?.appendChild(renderer.domElement)

    function initialize(portStructure: THREE.Group, sea: THREE.Mesh, seaBed: THREE.Mesh) {
        for (let i = scene.children.length - 1; i >= 0; i--) {
            const child = scene.children[i];
            if (!(child instanceof THREE.Light)) {
                scene.remove(child);
            }
        }

    
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

    
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(200, 200, 200);
        scene.add(directionalLight);

    
        scene.add(portStructure);

        scene.add(sea);

        scene.add(seaBed);

    
        camera.position.set(400, 200, 400);
        camera.lookAt(0, 0, 0);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;


    function draw(){
        
    const delta = clock.getDelta();
    (scene as any).traverse((obj: any) => {
        if (obj.material && obj.material.uniforms && obj.material.uniforms.time) {
                obj.material.uniforms.time.value += delta;
            }
    });
        controls.update();
        renderer.render(scene, camera);
    }


    function start(){
        renderer.setAnimationLoop(draw)
    }

    function stop(){
        renderer.setAnimationLoop(null)
    }

    return {
        initialize,
        start,
        stop
    }
}

