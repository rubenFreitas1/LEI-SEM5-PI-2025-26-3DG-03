import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { DocksService } from './docks.service';
import { StorageAreaService } from './storageArea.service';
import { StorageAreaType } from '../models/storageArea.model';

@Injectable({ providedIn: 'root' })
export class PortLayoutService {  
  constructor(
    private apiService: ApiService,
    private docksService: DocksService,
    private storageAreaService: StorageAreaService
  ) {}

  async getLayout(): Promise<{
    dockPositions: any[];
    storageAreas: {
      x: number;
      y: number;
      z: number;
      type: StorageAreaType;
      name: string;
      currentCapacity: number;
      maxCapacity: number;
    }[]

  }> {
    try {
      // 1️⃣ Buscar layout base
      const layout = await firstValueFrom(
        this.apiService.get<any>('/PortLayout/Layout')
      );

      // 2️⃣ Buscar dados reais do backend
      const docks = (await firstValueFrom(this.docksService.getAllDocks()));
      const storageAreas = (await firstValueFrom(this.storageAreaService.getAllStorageAreas()));

      // 3️⃣ DOCAS → mapear até ao limite dos slots
      const dockPositions = layout.dockSlots
        .slice(0, docks.length)
        .map((slot: any, index: number) => ({
          ...slot,
          name: docks[index]?.name || `Dock ${index + 1}`
        }));

      // 4️⃣ STORAGE AREAS → mapear para slots
      const storageAreaPositions = storageAreas.map((area: any, index: number) => {
        const slot = layout.warehouseSlots[index];
        if (!slot) return null;

        return {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          type: area.storageAreaType,
          name: area.location ,
          currentCapacity: area.currentCapacity ?? 0,
          maxCapacity: area.maxCapacity ?? area.capacity ?? 0,
          data: area
        };
      }).filter(x => x !== null);

      console.log("📦 Storage areas:", storageAreaPositions);

      return { dockPositions, storageAreas: storageAreaPositions };
    } catch (error) {
      console.error('❌ Erro a carregar layout:', error);
      return { dockPositions: [], storageAreas: [] };
    }
  }
}
