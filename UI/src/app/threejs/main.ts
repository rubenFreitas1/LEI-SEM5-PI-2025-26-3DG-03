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

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    window?.appendChild(renderer.domElement)

    function initialize(portStructure: THREE.Group, sea: THREE.Mesh, seaBed: THREE.Mesh) {
        for (let i = scene.children.length - 1; i >= 0; i--) {
            const child = scene.children[i];
            if (!(child instanceof THREE.Light)) {
                scene.remove(child);
            }
        }

        scene.add(portStructure);

        scene.add(sea);

        const shadowPlaneGeo = new THREE.PlaneGeometry(1200, 1200);
        const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.2 });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        const seaY = (sea.position && typeof (sea.position.y) === 'number') ? sea.position.y : 0;
        shadowPlane.position.y = seaY + 0.1;
        shadowPlane.receiveShadow = true;
        shadowPlane.castShadow = false;
        scene.add(shadowPlane);

        scene.add(seaBed);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(300, 300, 300);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.set(2048, 2048);
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 2000;

        const d = 800;
        const sc = directionalLight.shadow.camera as THREE.OrthographicCamera;
        sc.left = -d; sc.right = d; sc.top = d; sc.bottom = -d;
        sc.updateProjectionMatrix();
        directionalLight.shadow.bias = -0.0005;

        directionalLight.target.position.set(0, 0, 0);
        scene.add(directionalLight.target);
        scene.add(ambientLight, directionalLight);
    
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

