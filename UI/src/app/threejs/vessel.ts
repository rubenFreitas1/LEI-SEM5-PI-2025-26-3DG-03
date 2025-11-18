import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

export async function createVessel(): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const objLoader = new OBJLoader();

    const CDN_PATH = 'http://141.253.198.138/assets/models/ships/';


    // ⚙️ (opcional) Se tiveres materiais .mtl
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(CDN_PATH);
    mtlLoader.load('ship-cargo-a.mtl', (materials) => {
      materials.preload();
      objLoader.setMaterials(materials);
      objLoader.setPath(CDN_PATH);
      objLoader.load(
        'ship-cargo-a.obj',
        (object) => {
          object.scale.set(11, 11, 11); // ajusta escala conforme necessário
          object.position.set(11, 15, 110);
          resolve(object);
        },
        (xhr) => {
          console.log(`Vessel ${(xhr.loaded / xhr.total) * 100}% loaded`);
        },
        (error) => {
          console.error('Erro ao carregar o modelo do vessel:', error);
          reject(error);
        }
      );

    });
  });
}
