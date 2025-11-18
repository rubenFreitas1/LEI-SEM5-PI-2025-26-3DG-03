import * as THREE from 'three';
import { createCrane } from './crane';
import { TextureConfig } from '../models/texture.model';

export async function createDock(name: string, textureConfig: TextureConfig): Promise<THREE.Group> {
  const group = new THREE.Group();

  const loader = new THREE.TextureLoader();

  const width = 60;
  const height = 20;
  const depth = 150;

  const geometry = new THREE.BoxGeometry(width, height, depth);

  const colorMap = loader.load(textureConfig.colorMap);
  const roughnessMap = loader.load(textureConfig.roughnessMap);
  const normalMap = loader.load(textureConfig.normalMap);

  const tileSize = textureConfig.tileSize;

  function textureForTiles(orig: THREE.Texture, tilesX: number, tilesY: number) {
    const t = orig.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(tilesX, tilesY);
    t.needsUpdate = true;
    return t;
  }


  const tiles_for_side = { x: depth / tileSize, y: height / tileSize };
  const tiles_for_top = { x: width / tileSize, y: depth / tileSize };
  const tiles_for_front = { x: width / tileSize, y: height / tileSize };

  const materials: THREE.Material[] = [
    // +X
    new THREE.MeshStandardMaterial({
      map: textureForTiles(colorMap, tiles_for_side.x, tiles_for_side.y),
      roughnessMap: textureForTiles(roughnessMap, tiles_for_side.x, tiles_for_side.y),
      normalMap: textureForTiles(normalMap, tiles_for_side.x, tiles_for_side.y),
      metalness: 0,
      roughness: 1,
    }),
    // -X
    new THREE.MeshStandardMaterial({
      map: textureForTiles(colorMap, tiles_for_side.x, tiles_for_side.y),
      roughnessMap: textureForTiles(roughnessMap, tiles_for_side.x, tiles_for_side.y),
      normalMap: textureForTiles(normalMap, tiles_for_side.x, tiles_for_side.y),
      metalness: 0,
      roughness: 1,
    }),
    // +Y (top)
    new THREE.MeshStandardMaterial({
      map: textureForTiles(colorMap, tiles_for_top.x, tiles_for_top.y),
      roughnessMap: textureForTiles(roughnessMap, tiles_for_top.x, tiles_for_top.y),
      normalMap: textureForTiles(normalMap, tiles_for_top.x, tiles_for_top.y),
      metalness: 0,
      roughness: 1,
    }),
    // +Z
    new THREE.MeshStandardMaterial({
      map: textureForTiles(colorMap, tiles_for_front.x, tiles_for_front.y),
      roughnessMap: textureForTiles(roughnessMap, tiles_for_front.x, tiles_for_front.y),
      normalMap: textureForTiles(normalMap, tiles_for_front.x, tiles_for_front.y),
      metalness: 0,
      roughness: 1,
    }),
    // -Z
    new THREE.MeshStandardMaterial({
      map: textureForTiles(colorMap, tiles_for_front.x, tiles_for_front.y),
      roughnessMap: textureForTiles(roughnessMap, tiles_for_front.x, tiles_for_front.y),
      normalMap: textureForTiles(normalMap, tiles_for_front.x, tiles_for_front.y),
      metalness: 0,
      roughness: 1,
    }),
  ];

  const dock = new THREE.Mesh(geometry, materials);
  dock.castShadow = true;
  dock.receiveShadow = true;
  dock.position.y = 5;


  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.font = '28px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const labelMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const label = new THREE.Sprite(labelMat);
  label.scale.set(60, 20, 1);
  label.position.set(0, 20, 50);

  group.add(dock);
  group.add(label);

try {
    const crane = await createCrane();
    group.add(crane);
  } catch (err) {
    console.error('Erro ao carregar grua:', err);
  }



  return group;
}
