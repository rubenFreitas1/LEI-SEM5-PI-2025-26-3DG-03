import * as THREE from "three";


export function createPortStructure()
{
    const portStructure = new THREE.Group();
    
    
    const material = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.6,
        metalness: 0.1
    });
    
    const dockGeometry = new THREE.BoxGeometry(400, 30, 150);
    const dockMesh = new THREE.Mesh(dockGeometry, material);
    dockMesh.position.y = 1; 
    portStructure.add(dockMesh);

    
    const leftDockGeometry = new THREE.BoxGeometry(70, 30, 200);
    const leftDockMesh = new THREE.Mesh(leftDockGeometry, material);
    leftDockMesh.position.set(-100, 1, 100); 
    portStructure.add(leftDockMesh);

    
    const rightDockGeometry = new THREE.BoxGeometry(70, 30, 200);
    const rightDockMesh = new THREE.Mesh(rightDockGeometry, material);
    rightDockMesh.position.set(150, 1, 100);
    portStructure.add(rightDockMesh);

    return portStructure;
}