import * as THREE from "three";
import { TextureConfig } from '../models/texture.model';

export function createPortStructure(textureConfig: TextureConfig)
{
    const portStructure = new THREE.Group();

    const loader = new THREE.TextureLoader();
    const colorMap = loader.load(textureConfig.colorMap);
    const roughnessMap = loader.load(textureConfig.roughnessMap);
    const normalMap = loader.load(textureConfig.normalMap);

    const width = 400;
    const height = 30;
    const depth = 200;

    const tileSize = textureConfig.tileSize;

    function textureForTiles(orig: THREE.Texture, tilesX: number, tilesY: number) {
        const t = orig.clone();
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(tilesX, tilesY);
        t.needsUpdate = true;
        return t;
    }

    const tiles_for_side  = { x: depth / tileSize, y: height / tileSize };
    const tiles_for_top   = { x: width / tileSize, y: depth / tileSize };
    const tiles_for_front = { x: width / tileSize, y: height / tileSize };

    const materials: THREE.Material[] = [
        // +X
        new THREE.MeshStandardMaterial({
            map: textureForTiles(colorMap, tiles_for_side.x, tiles_for_side.y),
            roughnessMap: textureForTiles(roughnessMap, tiles_for_side.x, tiles_for_side.y),
            normalMap: textureForTiles(normalMap, tiles_for_side.x, tiles_for_side.y),
            metalness: 0,
            roughness: 2,
        }),
        // -X
        new THREE.MeshStandardMaterial({
            map: textureForTiles(colorMap, tiles_for_side.x, tiles_for_side.y),
            roughnessMap: textureForTiles(roughnessMap, tiles_for_side.x, tiles_for_side.y),
            normalMap: textureForTiles(normalMap, tiles_for_side.x, tiles_for_side.y),
            metalness: 0,
            roughness: 2,
        }),
        // +Y top
        new THREE.MeshStandardMaterial({
            map: textureForTiles(colorMap, tiles_for_top.x, tiles_for_top.y),
            roughnessMap: textureForTiles(roughnessMap, tiles_for_top.x, tiles_for_top.y),
            normalMap: textureForTiles(normalMap, tiles_for_top.x, tiles_for_top.y),
            metalness: 0,
            roughness: 2,
        }),
         new THREE.MeshStandardMaterial({
            map: textureForTiles(colorMap, tiles_for_top.x, tiles_for_top.y),
            roughnessMap: textureForTiles(roughnessMap, tiles_for_top.x, tiles_for_top.y),
            normalMap: textureForTiles(normalMap, tiles_for_top.x, tiles_for_top.y),
            metalness: 0,
            roughness: 2,
        })
        ,
        // +Z front
        new THREE.MeshStandardMaterial({
            map: textureForTiles(colorMap, tiles_for_front.x, tiles_for_front.y),
            roughnessMap: textureForTiles(roughnessMap, tiles_for_front.x, tiles_for_front.y),
            normalMap: textureForTiles(normalMap, tiles_for_front.x, tiles_for_front.y),
            metalness: 0,
            roughness: 2,
        }),
        // -Z back
        new THREE.MeshStandardMaterial({
            map: textureForTiles(colorMap, tiles_for_front.x, tiles_for_front.y),
            roughnessMap: textureForTiles(roughnessMap, tiles_for_front.x, tiles_for_front.y),
            normalMap: textureForTiles(normalMap, tiles_for_front.x, tiles_for_front.y),
            metalness: 0,
            roughness: 2,
        }),
    ];

    const dockGeometry = new THREE.BoxGeometry(width, height, depth);
    const dockMesh = new THREE.Mesh(dockGeometry, materials);

    dockMesh.position.set(-200, 20, -75);
    dockMesh.castShadow = true;
    dockMesh.receiveShadow = true;

    portStructure.add(dockMesh);

    return portStructure;
}
