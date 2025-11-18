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
import { TextureService } from '../../services/texture.service';
import { TextureModel } from '../../models/texture.model';
import { label } from 'three/src/nodes/TSL.js';

@Component({
  selector: 'app-visualization',
  templateUrl: './visualization.html',
  styleUrls: ['./visualization.css']
})
export class PortVisualizationComponent implements AfterViewInit, OnDestroy {

  private scene: any;

  constructor(private portLayoutService: PortLayoutService, private textureService: TextureService) {}

  async ngAfterViewInit(): Promise<void> {

    const scene = createScene();

    const { dockPositions, storageAreas  } =
      await this.portLayoutService.getLayout();

    let cfg: TextureModel;
    try {
      cfg = await this.textureService.fetchTextureModel();
    } catch (err) {
      console.error('Erro ao buscar texture model:', err);
      throw err;
    }

    const docks = await Promise.all(
      dockPositions.map(async (pos) => {
        const dockMesh = await createDock(pos.name, cfg.dock);
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
        return mesh;
      })
    );

    const portStructure = createPortStructure(cfg.port);


    const vessel = await createVessel();


    let seaWidth = 800;
    let seaLenght = 600;
    let seaCenterX = -200;


    if (storageMeshes.length > 3 || docks.length > 3) {
      const portStructure2 = createPortStructure(cfg.port);
      portStructure2.position.x = -400;
      portStructure.add(portStructure2);

      seaWidth = 1200;
      seaLenght = 600;
      seaCenterX = -400;

    }

    const sea = createSea(seaWidth, seaLenght, seaCenterX);
    const seaBed = createSeaBed(seaWidth, seaLenght, seaCenterX, cfg.seaBed);



    const allObjects = [...docks, ...storageMeshes];


    scene.initialize(portStructure, sea , seaBed, [vessel], allObjects);
    scene.start();

    this.scene = scene;
  }

  ngOnDestroy(): void {

    if (this.scene) {
      this.scene.stop();
    }
  }
}
