export interface TextureConfig {
  colorMap: string;
  roughnessMap: string;
  normalMap: string;
  tileSize: number;
}

export interface TextureModel {
  dock: TextureConfig;
  port: TextureConfig;
  seaBed: TextureConfig;
}
