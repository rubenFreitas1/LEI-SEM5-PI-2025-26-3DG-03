import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

import { createStorageAreaLabel } from './storageAreaLabel';

export async function createYard(labelText: string): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();

    const CDN_PATH = 'http://141.253.198.138/assets/models/yard/';


    mtlLoader.setPath(CDN_PATH);
    mtlLoader.load(
      'yard.mtl',
      (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.setPath(CDN_PATH);

        objLoader.load(
          'yard.obj',
          (object) => {
            object.scale.set(100, 50, 50);

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

            const label = createStorageAreaLabel(labelText);
            label.scale.x *= 0.5
            object.add(label);

            resolve(object as THREE.Group);

          },
          (xhr) => {
            if (xhr && xhr.total) {
              console.log(`Yard ${(xhr.loaded / xhr.total) * 100}% loaded`);
            }
          },
          (error) => {
            console.error('Erro ao carregar o modelo do yard:', error);
            reject(error);
          }
        );
      },
      undefined,
      (err) => {
        console.error('Erro ao carregar o MTL do yard:', err);
        reject(err);
      }
    );
  });
}
