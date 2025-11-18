import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import * as THREE from 'three';
import { ApiService } from './api.service';
import { TextureModel, TextureConfig } from '../models/texture.model';

@Injectable({ providedIn: 'root' })
export class TextureService {

  constructor(private apiService: ApiService) {}

  getTextures(): Observable<TextureModel> {
    return this.apiService.get<TextureModel>('/Texture/Texture');
  }

  async fetchTextureModel(): Promise<TextureModel> {
    return await lastValueFrom(this.getTextures());
  }

  loadTexture(url: string): Promise<THREE.Texture> {
    const loader = new THREE.TextureLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (tex) => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.needsUpdate = true;
          resolve(tex);
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  async loadTextureSet(cfg: TextureConfig): Promise<{ colorMap: THREE.Texture; roughnessMap: THREE.Texture; normalMap: THREE.Texture; tileSize: number }>{
    const [colorMap, roughnessMap, normalMap] = await Promise.all([
      this.loadTexture(cfg.colorMap),
      this.loadTexture(cfg.roughnessMap),
      this.loadTexture(cfg.normalMap),
    ]);

    return { colorMap, roughnessMap, normalMap, tileSize: cfg.tileSize };
  }
}
