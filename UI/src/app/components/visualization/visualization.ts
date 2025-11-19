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

@Component({
  selector: 'app-visualization',
  templateUrl: './visualization.html',
  styleUrls: ['./visualization.css']
})

// Componente principal de visualização do porto em three js
export class PortVisualizationComponent implements AfterViewInit, OnDestroy {

  private scene: any;
  constructor(private portLayoutService: PortLayoutService, private textureService: TextureService) {}

  async ngAfterViewInit(): Promise<void> {

    // Cria a cena
    const scene = createScene();

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

    // Cria o cais
    const portStructure = createPortStructure(cfg.port);

    // Cria o navio
    const vessel = await createVessel();

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
