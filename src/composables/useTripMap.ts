import { ref, shallowRef } from 'vue';

// --- ETAT SINGLETON STRICT ---
const mapInstance = shallowRef<google.maps.Map | null>(null);
const tripMarkers = ref<google.maps.Marker[]>([]);
const searchMarkers = ref<google.maps.Marker[]>([]);
const polylines = ref<google.maps.Polyline[]>([]);

// Registre physique de TOUS les marqueurs temporaires créés pour éviter les fuites
const allTemporaryMarkers = new Set<google.maps.Marker>();
let markerIdCounter = 0;

export function useTripMap() {
  
  const initMap = async (containerId: string, center: { lat: number, lng: number }, options: any = {}) => {
    const waitForGoogle = () => {
      return new Promise<void>((resolve) => {
        if (window.google && window.google.maps) resolve();
        else {
          const interval = setInterval(() => {
            if (window.google && window.google.maps) { clearInterval(interval); resolve(); }
          }, 100);
        }
      });
    };

    await waitForGoogle();
    
    if (mapInstance.value) {
      const container = document.getElementById(containerId);
      if (container && container.dataset.mapInit === 'true') return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    const mapOptions: google.maps.MapOptions = {
      center,
      zoom: options.zoom || 12,
      disableDefaultUI: options.disableDefaultUI || false,
      gestureHandling: options.gestureHandling || 'greedy',
      mapId: options.mapId || 'expedition_map_v1',
      zoomControl: options.zoomControl ?? true,
      mapTypeControl: options.mapTypeControl ?? false,
      streetViewControl: options.streetViewControl ?? false,
      fullscreenControl: options.fullscreenControl ?? false,
      backgroundColor: '#0a0a0a',
      mapTypeId: options.mapTypeId || 'roadmap',
      ...options
    };

    if (mapOptions.mapTypeId === 'roadmap' || !mapOptions.mapTypeId) {
      mapOptions.styles = [
        { "elementType": "geometry", "stylers": [{ "color": "#0a0a0a" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1f1f1f" }] },
        { "featureType": "poi", "elementType": "labels.icon", "stylers": [{ "visibility": "on" }, { "saturation": -100 }, { "lightness": -50 }] }
      ];
    }

    mapInstance.value = new google.maps.Map(container, mapOptions);
    container.dataset.mapInit = 'true';

    mapInstance.value.addListener('click', (event: any) => {
      if (event.placeId && options.onPoiClick) {
        event.stop();
        options.onPoiClick(event);
      }
    });
  };

  const clearSearchMarkers = () => {
    allTemporaryMarkers.forEach(m => {
      m.setMap(null);
    });
    allTemporaryMarkers.clear();

    while (searchMarkers.value.length > 0) {
      const m = searchMarkers.value.pop();
      if (m) m.setMap(null);
    }
  };

  const clearTripMarkers = () => {
    while (tripMarkers.value.length > 0) {
      const m = tripMarkers.value.pop();
      if (m) m.setMap(null);
    }
  };

  const clearPolylines = () => {
    while (polylines.value.length > 0) {
      const p = polylines.value.pop();
      if (p) p.setMap(null);
    }
  };

  const clearAll = () => {
    clearTripMarkers();
    clearSearchMarkers();
    clearPolylines();
  };

  const getContrastColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  };

  const addMarker = (lat: number, lng: number, options: any = {}, isSearch = false) => {
    if (!mapInstance.value) return;
    
    const color = isSearch ? '#ef4444' : (options.color || '#ccff00');
    const strokeColor = isSearch ? '#3f3f46' : (options.strokeColor || '#ffffff');
    const labelColor = isSearch ? '#ffffff' : getContrastColor(color);
    
    const svgMarker = {
      path: isSearch 
        ? 'M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S13.1,11,12,11z'
        : 'M12,2C8.1,2,5,5.1,5,9c0,5.2,7,13,7,13s7-7.8,7-13C19,5.1,15.9,2,12,2z',
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: isSearch ? 2 : 2.5,
      strokeColor: strokeColor,
      scale: isSearch ? 1.4 : 2.2,
      anchor: new google.maps.Point(12, 22),
      labelOrigin: new google.maps.Point(12, 9)
    };

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: mapInstance.value,
      title: options.title,
      icon: svgMarker,
      label: options.label ? {
        text: options.label,
        color: labelColor,
        fontSize: isSearch ? '8px' : '12px',
        fontWeight: '900'
      } : undefined,
      animation: isSearch ? undefined : google.maps.Animation.DROP
    });
    
    const id = ++markerIdCounter;
    (marker as any)._id = id;

    if (isSearch) {
      searchMarkers.value.push(marker);
      allTemporaryMarkers.add(marker); // Ajout au registre global
    } else {
      tripMarkers.value.push(marker);
    }
    
    if (options.popupHtml) {
      const infoWindow = new google.maps.InfoWindow({ content: options.popupHtml });
      marker.addListener('click', () => infoWindow.open(mapInstance.value, marker));
    }

    if (options.onClick) {
      marker.addListener('click', (event: any) => options.onClick(event, marker));
    }

    return marker;
  };

  const drawEncodedRoute = (encodedPolyline: string, options: any = {}) => {
    if (!mapInstance.value || !encodedPolyline) return;
    const path = google.maps.geometry.encoding.decodePath(encodedPolyline);
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: options.color || '#ccff00',
      strokeOpacity: options.opacity ?? 1,
      strokeWeight: options.weight || 5,
      map: mapInstance.value
    });
    polylines.value.push(polyline);
  };

  const fitBounds = (onlyTrip = true) => {
    if (!mapInstance.value) return;
    const targetMarkers = onlyTrip ? tripMarkers.value : [...tripMarkers.value, ...searchMarkers.value];
    if (targetMarkers.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    targetMarkers.forEach(m => { if (m.getPosition()) bounds.extend(m.getPosition()!); });
    mapInstance.value.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
  };

  return { map: mapInstance, initMap, clearTripMarkers, clearSearchMarkers, clearPolylines, clearAll, addMarker, drawEncodedRoute, fitBounds, searchMarkers };
}
