
import { ref, shallowRef } from 'vue';
import L from 'leaflet';
import { osrmService } from '../services/osrmService';

export function useTripMap() {
  const map = shallowRef<L.Map | null>(null);
  const markers = ref<L.Marker[]>([]);
  const routeLayers = ref<L.Polyline[]>([]);

  const initMap = (elementId: string, initialView: [number, number]) => {
    if (map.value) return;

    map.value = L.map(elementId).setView(initialView, 10);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map.value);
  };

  const clearMap = () => {
    if (!map.value) return;
    markers.value.forEach(m => map.value!.removeLayer(m as unknown as L.Layer));
    routeLayers.value.forEach(l => map.value!.removeLayer(l as unknown as L.Layer));
    markers.value = [];
    routeLayers.value = [];
  };

  const addMarker = (lat: number, lng: number, options: { title: string, icon: L.DivIcon, popupHtml: string }) => {
    if (!map.value) return;
    const marker = L.marker([lat, lng], { icon: options.icon })
      .bindPopup(options.popupHtml)
      .addTo(map.value);
    markers.value.push(marker);
    return marker;
  };

  const drawRoute = async (start: [number, number], end: [number, number], style: L.PolylineOptions) => {
    if (!map.value) return;

    const tempLine = L.polyline([start, end], { ...style, dashArray: '5, 10', opacity: 0.5 }).addTo(map.value);
    routeLayers.value.push(tempLine);

    const routeData = await osrmService.getRoute(start, end);
    if (routeData && map.value) {
      map.value.removeLayer(tempLine);
      const realLine = L.geoJSON(routeData.geometry as any, { style: () => style as any }).addTo(map.value);
      routeLayers.value.push(realLine as any);
    }
  };

  const fitBounds = () => {
    if (!map.value || markers.value.length === 0) return;
    const group = L.featureGroup([...markers.value, ...routeLayers.value] as unknown as L.Layer[]);
    map.value.fitBounds(group.getBounds(), { padding: [50, 50] });
  };

  return {
    map,
    initMap,
    clearMap,
    addMarker,
    drawRoute,
    fitBounds
  };
}
