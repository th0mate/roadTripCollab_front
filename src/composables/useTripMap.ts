import { ref, shallowRef } from 'vue';

export function useTripMap() {
  const map = shallowRef<google.maps.Map | null>(null);
  const markers = ref<any[]>([]);
  const polylines = ref<google.maps.Polyline[]>([]);

  const initMap = async (elementId: string, initialView: { lat: number, lng: number }, options?: { onPoiClick?: (poi: any) => void }) => {
    if (map.value) return;
    try {
      const mapElement = document.getElementById(elementId);
      if (!mapElement) return;

      map.value = new google.maps.Map(mapElement, {
        center: initialView,
        zoom: 10,
        mapId: 'DEMO_MAP_ID',
        disableDefaultUI: true,
        zoomControl: true,
      });

      if (options?.onPoiClick) {
        map.value.addListener('click', (event: google.maps.MapMouseEvent | google.maps.IconMouseEvent) => {
          if ('placeId' in event && event.placeId) {
            event.stop();
            options.onPoiClick({
              placeId: event.placeId,
              location: event.latLng?.toJSON()
            });
          }
        });
      }
    } catch (error) { console.error("Erreur Google Maps:", error); }
  };

  const clearMap = () => {
    markers.value.forEach(m => m.map = null);
    polylines.value.forEach(p => p.setMap(null));
    markers.value = [];
    polylines.value = [];
  };

  const addMarker = async (lat: number, lng: number, options: { title: string, label?: string, color?: string, popupHtml: string }) => {
    if (!map.value) return;
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

    const color = options.color || '#4F46E5';
    const container = document.createElement('div');

    container.innerHTML = `
      <div style="position: relative; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.4));">
        <div style="
          width: 36px;
          height: 36px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-family: sans-serif;
            font-weight: 800;
            font-size: 14px;
          ">${options.label || ''}</span>
        </div>
      </div>
    `;

    const marker = new AdvancedMarkerElement({
      position: { lat, lng },
      map: map.value,
      title: options.title,
      content: container,
    });

    const infoWindow = new google.maps.InfoWindow({ content: options.popupHtml });
    marker.addListener('click', () => infoWindow.open(map.value, marker));
    markers.value.push(marker);
    return marker;
  };

  const drawEncodedRoute = (encodedPolyline: string, options: { color?: string }) => {
    if (!map.value || !encodedPolyline) return;
    try {
      const path = google.maps.geometry.encoding.decodePath(encodedPolyline);
      const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: options.color || '#1e4d3d',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: map.value
      });
      polylines.value.push(polyline);
    } catch (e) { console.error(e); }
  };

  const fitBounds = () => {
    if (!map.value || markers.value.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    markers.value.forEach(m => {
      if (m.position) bounds.extend(m.position);
    });
    map.value.fitBounds(bounds, { padding: 80 });
  };

  return { map, initMap, clearMap, addMarker, drawEncodedRoute, fitBounds };
}
