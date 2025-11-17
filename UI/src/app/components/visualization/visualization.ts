import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { createScene } from '../../threejs/main';
import { createPortStructure } from '../../threejs/port';
import { createSea } from '../../threejs/sea';
import { createSeaBed } from '../../threejs/seaBed';
import { createVessel } from '../../threejs/vessel';
import { createDock } from '../../threejs/dock';
import { createWarehouse } from '../../threejs/warehouse';
import { createYard } from '../../threejs/yard';

import { PortLayoutService } from '../../services/portLayout.service';

@Component({
  selector: 'app-visualization',
  templateUrl: './visualization.html',
  styleUrls: ['./visualization.css']
})
export class PortVisualizationComponent implements AfterViewInit, OnDestroy {

  private scene: any;

  constructor(private portLayoutService: PortLayoutService) {}

  async ngAfterViewInit(): Promise<void> {
    
    const scene = createScene();

    const { dockPositions, storageAreas  } =
      await this.portLayoutService.getLayout();

    const docks = await Promise.all(
      dockPositions.map(async (pos) => {
        const dockMesh = await createDock(pos.name);
        dockMesh.position.set(pos.x, pos.y, pos.z);
        return dockMesh;
      })
    );

     const storageMeshes = await Promise.all(
      storageAreas.map(async (area) => {
        let mesh;

        if (area.type === 'Warehouse') {
          mesh = await createWarehouse();
        } else {
          mesh = await createYard();
          area.y += 0.5;
        }

        mesh.position.set(area.x, area.y, area.z);
        return mesh;
      })
    );


    const portStructure = createPortStructure();
    const sea = createSea();
    const seaBed = createSeaBed();
    const vessel = await createVessel();

    const allObjects = [...docks, ...storageMeshes];


    scene.initialize(portStructure, sea, seaBed, [vessel], allObjects);
    scene.start();

    this.scene = scene;
  }

  ngOnDestroy(): void {
    
    if (this.scene) {
      this.scene.stop();
    }
  }
}
