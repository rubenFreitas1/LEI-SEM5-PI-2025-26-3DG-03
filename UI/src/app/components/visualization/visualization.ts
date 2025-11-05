import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { createScene } from '../../threejs/main';
import { createPortStructure } from '../../threejs/port';
import { createSea } from '../../threejs/sea';
import { createSeaBed } from '../../threejs/seaBed';

@Component({
  selector: 'app-visualization',
  templateUrl: './visualization.html',
  styleUrls: ['./visualization.css']
})
export class PortVisualizationComponent implements AfterViewInit, OnDestroy {

  private scene: any;

  ngAfterViewInit(): void {
    
    const scene = createScene();
    const portStructure = createPortStructure();
    const sea = createSea();
    const seaBed = createSeaBed();

    scene.initialize(portStructure, sea, seaBed);
    scene.start();

    this.scene = scene;
  }

  ngOnDestroy(): void {
    
    if (this.scene) {
      this.scene.stop();
    }
  }
}
