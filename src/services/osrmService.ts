
import axios from 'axios';

interface OSRMCacheEntry {
  durations?: number[][];
  distances?: number[][];
  geometry?: string;
  timestamp: number;
}

class OSRMService {
  private readonly BASE_URL = 'https://router.project-osrm.org';
  private queue: (() => Promise<any>)[] = [];
  private processing = false;
  private readonly CACHE_PREFIX = 'osrm_cache_v2_';
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

  /**
   * Récupère la table des distances/durées pour un ensemble de coordonnées
   */
  async getTable(coordinates: string): Promise<{ durations: number[][], distances: number[][] } | null> {
    const cacheKey = `${this.CACHE_PREFIX}table_${coordinates.replace(/[;,]/g, '_')}`;
    const cached = this.getCache(cacheKey);
    if (cached && cached.durations && cached.distances) return { durations: cached.durations, distances: cached.distances };

    return this.addToQueue(async () => {
      try {
        const resp = await axios.get(`${this.BASE_URL}/table/v1/driving/${coordinates}?annotations=duration,distance`);
        if (resp.data.durations && resp.data.distances) {
          this.setCache(cacheKey, {
            durations: resp.data.durations,
            distances: resp.data.distances,
            timestamp: Date.now()
          });
          return { durations: resp.data.durations, distances: resp.data.distances };
        }
        return null;
      } catch (e) {
        console.error('OSRM Table error:', e);
        return null;
      }
    });
  }

  /**
   * Récupère le tracé exact (geometry) entre deux points
   */
  async getRoute(start: [number, number], end: [number, number]): Promise<{ geometry: any, distance: number, duration: number } | null> {
    const coords = `${start[1]},${start[0]};${end[1]},${end[0]}`;
    const cacheKey = `${this.CACHE_PREFIX}route_${coords.replace(/[;,]/g, '_')}`;
    const cached = this.getCache(cacheKey);
    if (cached && cached.geometry) return { geometry: cached.geometry, distance: 0, duration: 0 };

    return this.addToQueue(async () => {
      try {
        const resp = await axios.get(`${this.BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`);
        if (resp.data.routes && resp.data.routes[0]) {
          const route = resp.data.routes[0];
          this.setCache(cacheKey, {
            geometry: route.geometry,
            timestamp: Date.now()
          });
          return {
            geometry: route.geometry,
            distance: route.distance,
            duration: route.duration
          };
        }
        return null;
      } catch (e) {
        console.error('OSRM Route error:', e);
        return null;
      }
    });
  }

  private addToQueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
        await new Promise(r => setTimeout(r, 200));
      }
    }
    this.processing = false;
  }

  private getCache(key: string): OSRMCacheEntry | null {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      if (Date.now() - parsed.timestamp > this.CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed;
    } catch { return null; }
  }

  private setCache(key: string, data: OSRMCacheEntry) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      this.clearOldCache();
    }
  }

  private clearOldCache() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
}

export const osrmService = new OSRMService();
