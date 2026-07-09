import type { DeviceType, Language } from '@iie/sdk';
import type { ProductManifest } from '@iie/product-manifests';

export type RuntimePhase = 'bootstrap' | 'loading-manifest' | 'ready' | 'error';

export interface RuntimeState {
  phase: RuntimePhase;
  product: ProductManifest | null;
  device: DeviceType;
  language: Language;
  error?: string;
}

export class ManifestLoader {
  async load(productId: string): Promise<ProductManifest> {
    const { getProduct } = await import('@iie/product-manifests');
    const manifest = getProduct(productId);
    if (!manifest) throw new Error(`Product not found: ${productId}`);
    return manifest;
  }

  async loadAll(): Promise<ProductManifest[]> {
    const { getAllProducts } = await import('@iie/product-manifests');
    return getAllProducts();
  }
}

export class NavigationEngine {
  private history: string[] = [];
  private currentIndex = -1;

  get current(): string | undefined {
    return this.history[this.currentIndex];
  }

  get canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  get canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  navigate(path: string): void {
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(path);
    this.currentIndex = this.history.length - 1;
  }

  back(): string | undefined {
    if (!this.canGoBack) return undefined;
    this.currentIndex--;
    return this.current;
  }

  forward(): string | undefined {
    if (!this.canGoForward) return undefined;
    this.currentIndex++;
    return this.current;
  }

  reset(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}

export class PermissionManager {
  private granted = new Set<string>();

  async request(permission: string): Promise<boolean> {
    if (this.granted.has(permission)) return true;
    try {
      if (permission === 'camera') {
        const result = await navigator.mediaDevices.getUserMedia({ video: true });
        result.getTracks().forEach(t => t.stop());
        this.granted.add('camera');
        return true;
      }
      if (permission === 'geolocation') {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => { this.granted.add('geolocation'); resolve(true); },
            () => resolve(false),
          );
        });
      }
      if (permission === 'notifications') {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          this.granted.add('notifications');
          return true;
        }
        return false;
      }
      return false;
    } catch {
      return false;
    }
  }

  has(permission: string): boolean {
    return this.granted.has(permission);
  }

  revoke(permission: string): void {
    this.granted.delete(permission);
  }
}

export class OfflineEngine {
  private cache = new Map<string, any>();
  private isOnline = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => { this.isOnline = true; });
      window.addEventListener('offline', () => { this.isOnline = false; });
    }
  }

  get online(): boolean {
    return this.isOnline;
  }

  async cacheData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.online) {
      try {
        const data = await fetcher();
        this.cache.set(key, data);
        this.persist(key, data);
        return data;
      } catch {
        return this.loadCached(key);
      }
    }
    return this.loadCached(key);
  }

  private loadCached<T>(key: string): T {
    const cached = this.cache.get(key);
    if (cached) return cached as T;
    const persisted = this.loadPersisted(key);
    if (persisted) {
      this.cache.set(key, persisted);
      return persisted as T;
    }
    throw new Error(`No cached data for: ${key}`);
  }

  private persist(key: string, data: any): void {
    try {
      localStorage.setItem(`iie-cache:${key}`, JSON.stringify(data));
    } catch { /* quota exceeded */ }
  }

  private loadPersisted(key: string): any {
    try {
      const raw = localStorage.getItem(`iie-cache:${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export class NotificationEngine {
  private permissionManager: PermissionManager;

  constructor(permissionManager: PermissionManager) {
    this.permissionManager = permissionManager;
  }

  async send(title: string, options?: NotificationOptions): Promise<void> {
    const hasPermission = await this.permissionManager.request('notifications');
    if (!hasPermission) return;
    new Notification(title, options);
  }
}

export class CameraService {
  async capture(): Promise<string | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      const photo = await imageCapture.takePhoto();
      track.stop();
      return URL.createObjectURL(photo);
    } catch {
      return null;
    }
  }
}

export class GPSService {
  async getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
    try {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      });
    } catch {
      return null;
    }
  }
}

export class SQLiteCache {
  private store: Map<string, string> = new Map();

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
    try {
      localStorage.setItem(`iie-sqlite:${key}`, value);
    } catch { /* ignore */ }
  }

  async get(key: string): Promise<string | null> {
    const mem = this.store.get(key);
    if (mem !== undefined) return mem;
    try {
      const persisted = localStorage.getItem(`iie-sqlite:${key}`);
      if (persisted) this.store.set(key, persisted);
      return persisted;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    localStorage.removeItem(`iie-sqlite:${key}`);
  }

  async clear(): Promise<void> {
    this.store.clear();
    const keys = Object.keys(localStorage).filter(k => k.startsWith('iie-sqlite:'));
    keys.forEach(k => localStorage.removeItem(k));
  }
}

export class AgentRuntime {
  private agents = new Map<string, any>();

  register(id: string, agent: any): void {
    this.agents.set(id, agent);
  }

  get<T = any>(id: string): T | undefined {
    return this.agents.get(id) as T | undefined;
  }

  async execute(agentId: string, action: string, params?: Record<string, any>): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    if (typeof agent[action] !== 'function') throw new Error(`Action not found: ${agentId}.${action}`);
    return agent[action](params);
  }
}

export async function createRuntime(productId: string): Promise<RuntimeState> {
  const loader = new ManifestLoader();
  try {
    const product = await loader.load(productId);
    return { phase: 'ready', product, device: 'desktop', language: 'en' };
  } catch (err: any) {
    return { phase: 'error', product: null, device: 'desktop', language: 'en', error: err.message };
  }
}
