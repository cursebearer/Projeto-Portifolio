export const STORAGE_SERVICE = Symbol('IStorageService');

export interface IStorageService {
  save(hash: string, buffer: Buffer): Promise<string>;
  retrieve(hash: string): Promise<Buffer>;
  delete(hash: string): Promise<void>;
  exists(hash: string): Promise<boolean>;
}
