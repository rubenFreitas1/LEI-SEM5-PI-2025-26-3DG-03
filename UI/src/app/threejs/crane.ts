import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function createCrane(): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    const CDN_PATH = 'http://141.253.198.138/assets/models/cranes/';


    loader.load(
        CDN_PATH + 'shipToShoreCrane.glb',
      (gltf) => {
        const object = gltf.scene;

        object.scale.set(4, 4, 4);
        object.position.set(18, 57, 0);
        object.rotation.y = 0;

        const brightRed = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: 0.1,
            roughness: 0.35,
            emissive: 0x222200,  
            emissiveIntensity: 0.2,
        });

        // 🧱 Aplica o material a todos os meshes
        object.traverse((child: any) => {
          if (child.isMesh) {
            child.material = brightRed;
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.side = THREE.DoubleSide;
            child.geometry.computeVertexNormals();
          }
        });

        resolve(object);
      },
      undefined,
      (error) => {
        console.error('Erro ao carregar modelo GLB:', error);
        reject(error);
      }
    );
  });
}
