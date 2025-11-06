import * as THREE from 'three';

export function createSeaBed(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(1000, 1000);
  
  
  const material = new THREE.MeshStandardMaterial({
    color: 0x1a242d, 
    roughness: 0.9,
    metalness: 0.0,
  });

  const seabed = new THREE.Mesh(geometry, material);
  seabed.rotation.x = -Math.PI / 2;
  seabed.position.y = -10; 

  seabed.castShadow = false;
  seabed.receiveShadow = true;

  return seabed;
}
