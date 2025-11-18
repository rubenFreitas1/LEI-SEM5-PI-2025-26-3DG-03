import * as THREE from 'three';
import { TextureConfig } from '../models/texture.model';

export function createSeaBed(width: number ,lenght: number, centerX: number, textureConfig: TextureConfig ): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, lenght, 10);

  const loader = new THREE.TextureLoader();
  const colorMap = loader.load(textureConfig.colorMap);
  const normalMap = loader.load(textureConfig.normalMap);
  const roughnessMap = loader.load(textureConfig.roughnessMap);

  const tileSize = textureConfig.tileSize;
  const tilesX = Math.max(1, Math.round(width / tileSize));
  const tilesY = Math.max(1, Math.round(lenght / tileSize));

  [colorMap, normalMap, roughnessMap].forEach(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(tilesX, tilesY);
    t.needsUpdate = true;
  });

  const material = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    metalness: 0.0,
    roughness: 0.9,
  });

  const seabed = new THREE.Mesh(geometry, material);
  seabed.rotation.x = -Math.PI / 2;
  seabed.position.y = 5;
  seabed.position.z = 75;
  seabed.position.x = centerX;

  seabed.castShadow = false;
  seabed.receiveShadow = true;

  return seabed;
}
