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

  async loadApi() {
    return new Promise<void>((resolve) => {
      if (window.google && window.google.maps) {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      }
    });
  }

  async getAutocompleteSuggestions(input: string): Promise<google.maps.places.AutocompletePrediction[]> {
    await this.loadApi();
    const service = new google.maps.places.AutocompleteService();
    return new Promise((resolve) => {
      service.getPlacePredictions({ input, language: 'fr' }, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) resolve(predictions);
        else resolve([]);
      });
    });
  }

  async getPlaceDetails(placeId: string): Promise<google.maps.places.PlaceResult | null> {
    await this.loadApi();
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    return new Promise((resolve) => {
      service.getDetails({ 
        placeId, 
        fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'url'] 
      }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) resolve(place);
        else resolve(null);
      });
    });
  }

  async searchPlaces(query: string, bounds?: google.maps.LatLngBounds): Promise<any[]> {
    await this.loadApi();
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    return new Promise((resolve) => {
      const request: google.maps.places.TextSearchRequest = { query };
      if (bounds) request.bounds = bounds;
      
      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          resolve([]);
        }
      });
    });
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

  async getRouteInfo(origin: { lat: any, lng: any }, destination: { lat: any, lng: any }) {
    if (!this.API_KEY) return null;
    try {
      const response = await axios.post(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          origin: { location: { latLng: { latitude: Number(origin.lat), longitude: Number(origin.lng) } } },
          destination: { location: { latLng: { latitude: Number(destination.lat), longitude: Number(destination.lng) } } },
          travelMode: 'DRIVE',
          extraComputations: ['TOLLS'],
          routeModifiers: { avoidTolls: false, avoidHighways: false },
          languageCode: 'fr-FR',
          units: 'METRIC'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.API_KEY,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.travelAdvisory.tollInfo'
          }
        }
      );
      const route = response.data.routes?.[0];
      if (!route) return null;
      
      const hasTolls = !!route.travelAdvisory?.tollInfo;
      
      return {
        distance: route.distanceMeters || 0,
        duration: parseInt((route.duration || "0s").replace('s', '')),
        polyline: route.polyline?.encodedPolyline,
        hasTolls: hasTolls
      };
    } catch (error) { 
      console.error('Google Routes Error:', error);
      return null; 
    }
  }
}

export const googleMapsService = new GoogleMapsService();
