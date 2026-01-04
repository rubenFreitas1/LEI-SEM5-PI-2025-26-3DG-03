import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

export type VesselStatus = 'Waiting' | 'Loading' | 'Unloading' | 'InProgress' | 'Completed';

export interface VesselConfig {
  imo?: string;
  name?: string;
  status?: VesselStatus;
  position?: { x: number; y: number; z: number };
}

// Color mapping for vessel status
const STATUS_COLORS: Record<VesselStatus, number> = {
  Waiting: 0xFFFF00,     // Yellow
  Loading: 0x00FF00,     // Green
  Unloading: 0xFF6600,   // Orange
  InProgress: 0x0099FF,  // Blue
  Completed: 0x808080,   // Gray
};

// Função para carregar o modelo 3D do vessel
export async function createVessel(config?: VesselConfig): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const objLoader = new OBJLoader();

    const CDN_PATH = 'https://lapr5-frontend.duckdns.org/cdn/models/ships/';

    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(CDN_PATH);
    mtlLoader.load('ship-cargo-a.mtl', (materials) => {
      materials.preload();
      objLoader.setMaterials(materials);
      objLoader.setPath(CDN_PATH);
      objLoader.load(
        'ship-cargo-a.obj',
        (object) => {
          object.name = config?.name || 'Vessel';
          object.userData['type'] = 'vessel';
          object.userData['pickable'] = true;
          object.userData['imo'] = config?.imo || '';
          object.userData['vesselName'] = config?.name || 'Unknown Vessel';
          object.userData['status'] = config?.status || 'InProgress';

          object.scale.set(11, 11, 11);

          // Set position from config or default
          const pos = config?.position || { x: 11, y: 15, z: 110 };
          object.position.set(pos.x, pos.y, pos.z);

          object.traverse((child) => {
            if ((child as any).isMesh) {
              (child as any).castShadow = true;
              (child as any).receiveShadow = true;
            }
          });

          // Apply initial status visualization
          if (config?.status) {
            applyStatusVisualization(object, config.status);
          }

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

// Function to apply status visualization to a vessel
export function applyStatusVisualization(vessel: THREE.Group, status: VesselStatus): void {
  const color = STATUS_COLORS[status];

  // Apply emissive color to all meshes in the vessel
  vessel.traverse((child) => {
    if ((child as any).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat: any) => {
            if (mat.emissive) {
              mat.emissive.setHex(color);
              mat.emissiveIntensity = 0.3;
            }
          });
        } else {
          const mat = mesh.material as any;
          if (mat.emissive) {
            mat.emissive.setHex(color);
            mat.emissiveIntensity = 0.3;
          }
        }
      }
    }
  });

  // Remove existing status light if present
  const existingLight = vessel.getObjectByName('statusLight');
  if (existingLight) {
    vessel.remove(existingLight);
  }

  // Add a point light above the vessel with status color
  const light = new THREE.PointLight(color, 1.5, 100);
  light.position.set(0, 30, 0);
  light.name = 'statusLight';
  vessel.add(light);

  // Update userData
  vessel.userData['status'] = status;
}

// Function to update vessel status dynamically
export function updateVesselStatus(vessel: THREE.Group, newStatus: VesselStatus): void {
  applyStatusVisualization(vessel, newStatus);
}

// Helper function to get status color
export function getStatusColor(status: VesselStatus): number {
  return STATUS_COLORS[status];
}

// Helper function to get status description
export function getStatusDescription(status: VesselStatus): string {
  const descriptions: Record<VesselStatus, string> = {
    Waiting: 'Vessel is waiting for dock assignment',
    Loading: 'Vessel is currently loading cargo',
    Unloading: 'Vessel is currently unloading cargo',
    InProgress: 'Operations are in progress',
    Completed: 'All operations have been completed',
  };
  return descriptions[status];
}
