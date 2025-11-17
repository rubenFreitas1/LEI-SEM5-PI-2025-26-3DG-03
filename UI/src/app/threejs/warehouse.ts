import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

export async function createWarehouse(): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();

    mtlLoader.setPath('assets/models/');
    mtlLoader.load(
      'warehouse.mtl',
      (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.setPath('assets/models/');

        objLoader.load(
          'warehouse.obj',
          (object) => {
            // Keep neutral transform; the caller sets position
            object.scale.set(50, 50, 50);

            
            object.rotation.y = Math.PI;

            

            object.traverse((child: any) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((mat: any) => {
                  if (!mat) return;
                  if (typeof mat.transparent === 'boolean') mat.transparent = false;
                  if (typeof mat.opacity === 'number') mat.opacity = 1;
                  mat.side = THREE.DoubleSide;
                  mat.needsUpdate = true;
                  if ('metalness' in mat) mat.metalness = mat.metalness ?? 0.1;
                  if ('roughness' in mat) mat.roughness = mat.roughness ?? 0.8;
                });

                child.geometry?.computeVertexNormals?.();
              }
            });

            resolve(object as THREE.Group);
          },
          (xhr) => {
            if (xhr && xhr.total) {
              console.log(`Warehouse ${(xhr.loaded / xhr.total) * 100}% loaded`);
            }
          },
          (error) => {
            console.error('Erro ao carregar o modelo do warehouse:', error);
            reject(error);
          }
        );
      },
      undefined,
      (err) => {
        console.error('Erro ao carregar o MTL do warehouse:', err);
        reject(err);
      }
    );
  });
}
