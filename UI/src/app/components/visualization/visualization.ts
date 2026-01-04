import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { createScene } from '../../threejs/main';
import { createPortStructure } from '../../threejs/port';
import { createSea } from '../../threejs/sea';
import { createSeaBed } from '../../threejs/seaBed';
import { createVessel, updateVesselStatus, VesselStatus } from '../../threejs/vessel';
import { createDock } from '../../threejs/dock';
import { createWarehouse } from '../../threejs/warehouse';
import { createYard } from '../../threejs/yard';

import { PortLayoutService } from '../../services/portLayout.service';
import { TextureService } from '../../services/texture.service';
import { TextureModel } from '../../models/texture.model';
import { ObjectPickerService } from '../../threejs/object-picker';
import { CameraAnimatorService } from '../../threejs/camera-animator';
import { ElementInfoOverlayComponent } from '../element-info-overlay/element-info-overlay.component';
import { VesselStatusLegendComponent } from '../vessel-status-legend/vessel-status-legend.component';
import { VesselStatusService } from '../../services/vesselStatus.service';

@Component({
  selector: 'app-visualization',
  templateUrl: './visualization.html',
  styleUrls: ['./visualization.css'],
  standalone: true,
  imports: [ElementInfoOverlayComponent, VesselStatusLegendComponent]
})

// Componente principal de visualização do porto em three js
export class PortVisualizationComponent implements AfterViewInit, OnDestroy {

  private scene: any;
  private vessels: any[] = [];
  private statusUpdateInterval: any;

  constructor(
    private portLayoutService: PortLayoutService,
    private textureService: TextureService,
    private objectPicker: ObjectPickerService,
    private cameraAnimator: CameraAnimatorService,
    private vesselStatusService: VesselStatusService
  ) {}

  async ngAfterViewInit(): Promise<void> {

    // Cria a cena
    const scene = createScene(this.objectPicker, this.cameraAnimator);

    // Busca o layout do porto
    const { dockPositions, storageAreas  } =
      await this.portLayoutService.getLayout();

    let cfg: TextureModel;
    try {
      cfg = await this.textureService.fetchTextureModel();
    } catch (err) {
      console.error('Erro ao buscar texture model:', err);
      throw err;
    }

    // Cria as docas e as Storage Areas
    const docks = await Promise.all(
      dockPositions.map(async (pos) => {
        // Generate a unique crane code for this dock (e.g., "STS-Dock_A" for "Dock A")
        const craneCode = `STS-${pos.name.replace(/\s+/g, '_')}`;
        const dockMesh = await createDock(pos.name, cfg.dock, craneCode);
        dockMesh.position.set(pos.x, pos.y, pos.z);
        return dockMesh;
      })
    );

    const storageMeshes = await Promise.all(
      storageAreas.map(async (area) => {
        let mesh;
        const labelText = `${area.name} \n ${area.currentCapacity}/${area.maxCapacity}`;
        if (area.type === 'Warehouse') {

          mesh = await createWarehouse(labelText);
        } else {
          mesh = await createYard(labelText);
          area.y += 0.5;
        }
        mesh.position.set(area.x, area.y, area.z);
        // Ensure element-info can match selected storage area using unique identifiers
        try {
          (mesh as any).userData = (mesh as any).userData || {};
          (mesh as any).userData['storageAreaCode'] = (area as any).code;
          (mesh as any).userData['storageAreaLocation'] = (area as any).location ?? (area as any).name;
          (mesh as any).userData['type'] = 'storage-area';
        } catch {}
        return mesh;
      })
    );

    // Cria o cais
    const portStructure = createPortStructure(cfg.port);

    // Load vessels with status from API
    await this.loadVesselsWithStatus();

    // Configura o mar e o fundo do mar
    let seaWidth = 800;
    let seaLenght = 600;
    let seaCenterX = -200;

    // Ajusta o tamanho do porto tendo em conta a quantidade de docas e storage areas
    if (storageMeshes.length > 3 || docks.length > 3) {
      const portStructure2 = createPortStructure(cfg.port);
      portStructure2.position.x = -400;
      portStructure.add(portStructure2);

      seaWidth = 1200;
      seaLenght = 600;
      seaCenterX = -400;
    }

    // Cria o mar e o fundo do mar
    const sea = createSea(seaWidth, seaLenght, seaCenterX);
    const seaBed = createSeaBed(seaWidth, seaLenght, seaCenterX, cfg.seaBed);

    const allObjects = [...docks, ...storageMeshes];

    // Inicializa a cena com todos os objetos
    scene.initialize(portStructure, sea , seaBed, this.vessels, allObjects);
    scene.start();

    this.scene = scene;

    // Start periodic status updates (every 10 seconds)
    this.startStatusUpdates();
  }

  private async loadVesselsWithStatus(): Promise<void> {
    try {
      const vesselStatusInfo = await this.vesselStatusService.getActiveVessels(10).toPromise();

      console.log('📋 All vessel status info received:', vesselStatusInfo);

      if (!vesselStatusInfo || vesselStatusInfo.length === 0) {
        console.warn('No active vessels found, using default vessel');
        // Create a default vessel if no status info
        const defaultVessel = await createVessel({
          imo: '9999999',
          name: 'Default Vessel',
          status: 'InProgress',
          position: { x: 11, y: 15, z: 110 }
        });
        this.vessels = [defaultVessel];
        return;
      }

      console.log(`🚢 Loading ${vesselStatusInfo.length} vessels...`);

      // Get dock positions from layout to map vessels to correct docks
      const { dockPositions } = await this.portLayoutService.getLayout();

      // Create a map of dock name to vessel positions from layout
      const dockPositionMap: { [key: string]: {
        docked: { x: number; y: number; z: number, rotation?: number },
        waiting: { x: number; y: number; z: number, rotation?: number }
      } } = {};

      dockPositions.forEach((dock: any) => {
        dockPositionMap[dock.name] = {
          docked: { 
            ...dock.vesselDocked || { x: dock.x + 60, y: 15, z: dock.z },
            rotation: dock.vesselDockedRotation || 0
          },
          waiting: { 
            ...dock.vesselWaiting || { x: dock.x + 40, y: 15, z: dock.z },
            rotation: dock.vesselWaitingRotation || 0
          }
        };

        console.log(`🏗️ Dock ${dock.name} vessel positions:`, dockPositionMap[dock.name]);
      });

      console.log('Dock position map:', dockPositionMap);

      // Track which docks are occupied
      const occupiedDocks: { [key: string]: number } = {}; // dock name -> count of vessels

      // Create vessels based on status information and assigned dock
      const vesselPromises = vesselStatusInfo.map(async (info, index) => {
        console.log(`\n🔍 Processing vessel ${index + 1}/${vesselStatusInfo.length}:`, {
          imo: info.imo,
          name: info.name,
          status: info.status,
          dockAssigned: info.dockAssigned
        });

        // Find the position based on assigned dock and availability
        let position = { x: 11, y: 15, z: 110 }; // Default position
        let rotation = 0; // Default rotation
        let finalStatus = info.status; // Will be overridden if vessel is waiting
        
        if (info.dockAssigned && dockPositionMap[info.dockAssigned]) {
          const dockPositions = dockPositionMap[info.dockAssigned];
          
          // Check if dock is already occupied or vessel is waiting
          const isWaiting = info.status === 'Waiting';
          const dockOccupiedCount = occupiedDocks[info.dockAssigned] || 0;
          
          console.log(`   Dock ${info.dockAssigned} - Occupied count: ${dockOccupiedCount}, Is Waiting: ${isWaiting}, Status: ${info.status}`);
          
          // First vessel at dock gets docked position, subsequent vessels wait
          if (dockOccupiedCount === 0 && !isWaiting) {
            // Place at docked position (first vessel) - keep original status
            position = dockPositions.docked;
            rotation = dockPositions.docked.rotation || 0;
            console.log(`   ✅ Vessel ${info.imo} (${info.status}) DOCKED at ${info.dockAssigned}`, {
              position,
              rotation
            });
          } else {
            // Place in waiting position (subsequent vessels or waiting status)
            // Override status to Waiting
            finalStatus = 'Waiting';
            rotation = dockPositions.waiting.rotation || 0;
            // If multiple vessels waiting, offset them slightly
            position = {
              x: dockPositions.waiting.x + ((dockOccupiedCount - 1) * 40), // Offset if multiple waiting
              y: dockPositions.waiting.y,
              z: dockPositions.waiting.z
            };
            console.log(`   🛑 Vessel ${info.imo} WAITING for ${info.dockAssigned} (original status: ${info.status})`, {
              position,
              rotation,
              dockOccupiedCount,
              isWaiting
            });
          }
          
          // Increment dock occupation count
          occupiedDocks[info.dockAssigned] = dockOccupiedCount + 1;
        } else {
          console.warn(`   ⚠️ Vessel ${info.imo} has no valid dock assignment (${info.dockAssigned}), using default position`);
        }

        const vessel = await createVessel({
          imo: info.imo,
          name: info.name,
          status: finalStatus,  // Use finalStatus instead of info.status
          position
        });
        
        // Apply rotation
        vessel.rotation.y = rotation;
        console.log(`   🔄 Applied rotation ${rotation} radians to vessel ${info.imo}`);

        console.log(`   ✔️ Vessel created at position:`, vessel.position);
        return vessel;
      });

      this.vessels = await Promise.all(vesselPromises);

      console.log(`\n✨ Successfully loaded ${this.vessels.length} vessels!`);
      console.log('Final vessels array:', this.vessels.map(v => ({
        name: v.name,
        imo: v.userData['imo'],
        position: { x: v.position.x, y: v.position.y, z: v.position.z },
        status: v.userData['status']
      })));
    } catch (error) {
      console.error('❌ Error loading vessels with status:', error);
      // Fallback to default vessel
      const defaultVessel = await createVessel({
        imo: '9999999',
        name: 'Default Vessel',
        status: 'InProgress',
        position: { x: 11, y: 15, z: 110 }
      });
      this.vessels = [defaultVessel];
    }
  }

  private async startStatusUpdates(): Promise<void> {
    // Update vessel status every 10 seconds
    this.statusUpdateInterval = setInterval(async () => {
      try {
        const vesselStatusInfo = await this.vesselStatusService.getActiveVessels(3).toPromise();

        if (!vesselStatusInfo) return;

        // Get dock positions for position updates
        const { dockPositions } = await this.portLayoutService.getLayout();
        const dockPositionMap: { [key: string]: {
          docked: { x: number; y: number; z: number; rotation?: number },
          waiting: { x: number; y: number; z: number; rotation?: number }
        } } = {};

        dockPositions.forEach((dock: any) => {
          dockPositionMap[dock.name] = {
            docked: { 
              ...dock.vesselDocked || { x: dock.x + 60, y: 15, z: dock.z },
              rotation: dock.vesselDockedRotation || 0
            },
            waiting: { 
              ...dock.vesselWaiting || { x: dock.x + 40, y: 15, z: dock.z },
              rotation: dock.vesselWaitingRotation || 0
            }
          };
        });

        // Track dock occupation for positioning
        const occupiedDocks: { [key: string]: number } = {};

        // Update each vessel's status and position if changed
        vesselStatusInfo.forEach((info) => {
          // Find vessel by IMO
          const vessel = this.vessels.find(v => v.userData['imo'] === info.imo);

          if (vessel) {
            const currentStatus = vessel.userData['status'];
            const currentDock = vessel.userData['dockAssigned'];
            let finalStatus = info.status; // Declare here, outside the if block

            // Update position based on status and dock availability
            if (info.dockAssigned && dockPositionMap[info.dockAssigned]) {
              const dockPositions = dockPositionMap[info.dockAssigned];
              const isWaiting = info.status === 'Waiting';
              const dockOccupiedCount = occupiedDocks[info.dockAssigned] || 0;

              let newPosition;
              let newRotation;
              
              // First vessel at dock gets docked position, subsequent vessels wait
              if (dockOccupiedCount === 0 && !isWaiting) {
                // Docked position - keep original status (Loading/Unloading)
                newPosition = dockPositions.docked;
                newRotation = dockPositions.docked.rotation || 0;
              } else {
                // Waiting position - override status to Waiting
                finalStatus = 'Waiting';
                newPosition = {
                  x: dockPositions.waiting.x + ((dockOccupiedCount - 1) * 30),
                  y: dockPositions.waiting.y,
                  z: dockPositions.waiting.z
                };
                newRotation = dockPositions.waiting.rotation || 0;
              }

              // Check if position changed significantly
              const currentPos = vessel.position;
              const posChanged = Math.abs(currentPos.x - newPosition.x) > 5 ||
                                Math.abs(currentPos.z - newPosition.z) > 5;

              if (posChanged || currentDock !== info.dockAssigned) {
                console.log(`Moving vessel ${info.imo} from ${currentDock} to ${info.dockAssigned} (${finalStatus})`);
                vessel.position.set(newPosition.x, newPosition.y, newPosition.z);
                vessel.rotation.y = newRotation;
              }

              // Update status if changed
              if (currentStatus !== finalStatus) {
                console.log(`Updating vessel ${info.imo} status from ${currentStatus} to ${finalStatus}`);
                updateVesselStatus(vessel, finalStatus);
              }

              occupiedDocks[info.dockAssigned] = dockOccupiedCount + 1;
            }

            // Update vessel metadata
            vessel.userData['imo'] = info.imo;
            vessel.userData['vesselName'] = info.name;
            vessel.userData['status'] = finalStatus;
            vessel.userData['dockAssigned'] = info.dockAssigned;
          }
        });
      } catch (error) {
        console.error('Error updating vessel status:', error);
      }
    }, 10000); // 10 seconds
  }

  ngOnDestroy(): void {
    // Clear the status update interval
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }

    if (this.scene) {
      this.scene.stop();
      if (this.scene.dispose) {
        this.scene.dispose();
      }
    }
  }
}
