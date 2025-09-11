export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface OpenApiConfig {
  filePath: string;
  basePath: string;
  jsonPath: string;
  uiPath: string;
}

// todo - temporary until will be integrated with config server
export interface CronConfig {
  readonly enabled: boolean;
  readonly schedule: string;
}
