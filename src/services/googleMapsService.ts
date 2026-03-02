import axios from 'axios';

export interface GooglePlace {
  id: string;
  name: string;
  location: { lat: number, lng: number };
  type: string;
  rating?: number;
  address?: string;
}

class GoogleMapsService {
  private get API_KEY() {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  }

  async findNearbyPlaces(lat: number, lng: number, type: string, radius: number = 5000): Promise<GooglePlace[]> {
    if (!this.API_KEY) return [];
    try {
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
          includedTypes: [type],
          maxResultCount: 10,
          locationRestriction: { circle: { center: { latitude: Number(lat), longitude: Number(lng) }, radius: radius } }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress,places.rating'
          }
        }
      );
      return response.data.places?.map((p: any) => ({
        id: p.id,
        name: p.displayName.text,
        location: { lat: p.location.latitude, lng: p.location.longitude },
        address: p.formattedAddress,
        rating: p.rating,
        type: type
      })) || [];
    } catch (error) { return []; }
  }

  /**
   * Estime les péages en utilisant EXCLUSIVEMENT les coordonnées GPS pour la fiabilité du tracé
   */
  async estimateTolls(points: { lat: any, lng: any }[]) {
    if (!this.API_KEY || points.length < 2) return null;

    try {
      const lat1 = Number(points[0].lat);
      const lng1 = Number(points[0].lng);
      const lat2 = Number(points[points.length - 1].lat);
      const lng2 = Number(points[points.length - 1].lng);

      if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
        console.warn("estimateTolls: Coordonnées invalides détectées (NaN)", points);
        return null;
      }

      const origin = { latitude: lat1, longitude: lng1 };
      const destination = { latitude: lat2, longitude: lng2 };

      const departureTime = new Date(Date.now() + 10000).toISOString();

      const requestBody = {
        origin: { location: { latLng: origin } },
        destination: { location: { latLng: destination } },
        travelMode: 'DRIVE',
        //routingPreference: 'TRAFFIC_AWARE',
        //departureTime: departureTime,
        //extraComputations: ['TOLLS'],
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          vehicleInfo: { emissionType: 'GASOLINE' }
        },
        languageCode: 'fr-FR',
        units: 'METRIC'
      };

      const response = await axios.post(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.API_KEY,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
          }
        }
      );

      const route = response.data.routes?.[0];
      if (!route) return null;

      let totalTollPrice = 0;
      const tollInfo = route.travelAdvisory?.tollInfo;

      if (tollInfo?.estimatedPrice) {
        const prices = Array.isArray(tollInfo.estimatedPrice) ? tollInfo.estimatedPrice : [tollInfo.estimatedPrice];
        const priceObj = prices.find((p: any) => p.currencyCode === 'EUR') || prices[0];
        if (priceObj) {
          totalTollPrice = Number(priceObj.units || 0) + (Number(priceObj.nanos || 0) / 1000000000);
        }
      }

      return {
        distance: route.distanceMeters || 0,
        duration: (route.duration || "0s").replace('s', ''),
        tolls: totalTollPrice,
        polyline: route.polyline?.encodedPolyline
      };
    } catch (error: any) {
      console.error('API Routes Error Detailed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return null;
    }
  }
}

export const googleMapsService = new GoogleMapsService();
