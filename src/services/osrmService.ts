import axios from 'axios';

export interface RouteResponse {
  distance: number;
  duration: number;
  geometry: string;
  tollDistance: number;
}

class OSRMService {
  private readonly BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

  /**
   * Calcule un itinéraire réel entre deux points (Gratuit via OpenStreetMap)
   */
  async getRoute(start: { lat: number, lng: number }, end: { lat: number, lng: number }): Promise<RouteResponse | null> {
    const cacheKey = `route_${start.lat.toFixed(5)}_${start.lng.toFixed(5)}_${end.lat.toFixed(5)}_${end.lng.toFixed(5)}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { localStorage.removeItem(cacheKey); }
    }

    try {
      const url = `${this.BASE_URL}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=polyline&annotations=true`;
      const response = await axios.get(url);

      if (response.data.code !== 'Ok') return null;
      const route = response.data.routes[0];

      const result = {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        tollDistance: route.distance > 30000 ? route.distance * 0.8 : 0
      };

      localStorage.setItem(cacheKey, JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('OSRM Error:', error);
      return null;
    }
  }
}

export const osrmService = new OSRMService();
