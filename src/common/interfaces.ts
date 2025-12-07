export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface ApiVersionConfig {
  readonly enabled: boolean;
  readonly filePath: string;
  readonly basePath: string;
  readonly rawPath: string;
  readonly uiPath: string;
}
