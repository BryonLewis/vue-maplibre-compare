<script lang="ts">
import {
  defineComponent, ref, onMounted, onBeforeUnmount, watch, PropType,
} from 'vue';
import maplibregl, { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapCompare } from '../use/useMapCompare';

export interface MapCompareProps {
  mapStyleA: string | StyleSpecification
  mapStyleB: string | StyleSpecification
  mapLayersA?: string[]
  mapLayersB?: string[]
  center?: [number, number]
  zoom?: number
  bearing?: number
  pitch?: number
}

export default defineComponent({
  name: 'MapCompare',
  props: {
    mapStyleA: {
      type: [String, Object] as PropType<string | StyleSpecification>,
      required: true,
    },
    mapStyleB: {
      type: [String, Object] as PropType<string | StyleSpecification>,
      required: true,
    },
    mapLayersA: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    mapLayersB: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    center: {
      type: Array as unknown as PropType<[number, number]>,
      default: () => [0, 0],
    },
    zoom: {
      type: Number,
      default: 1,
    },
    bearing: {
      type: Number,
      default: 0,
    },
    pitch: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const containerRef = ref<HTMLElement>();
    const mapARef = ref<HTMLElement>();
    const mapBRef = ref<HTMLElement>();

    let mapA: MaplibreMap | null = null;
    let mapB: MaplibreMap | null = null;
    let mapCompareInstance: ReturnType<typeof useMapCompare> | null = null;

    const updateLayerVisibility = (mapType: 'A' | 'B') => {
      const map = mapType === 'A' ? mapA : mapB;
      const enabledLayers = mapType === 'A' ? props.mapLayersA : props.mapLayersB;

      if (!map || !map.isStyleLoaded()) return;

      const style = map.getStyle();
      if (!style || !style.layers) return;

      // Disable all layers first if specific layers are provided
      if (enabledLayers && enabledLayers.length > 0) {
        style.layers.forEach((layer) => {
          if (enabledLayers.includes(layer.id)) {
            map.setLayoutProperty(layer.id, 'visibility', 'visible');
          } else {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        });
      }
    };

    const initializeMaps = async () => {
      if (!mapARef.value || !mapBRef.value || !containerRef.value) return;

      // Initialize Map A
      mapA = new maplibregl.Map({
        container: mapARef.value,
        style: props.mapStyleA,
        center: props.center,
        zoom: props.zoom,
        bearing: props.bearing,
        pitch: props.pitch,
      });

      // Initialize Map B
      mapB = new maplibregl.Map({
        container: mapBRef.value,
        style: props.mapStyleB,
        center: props.center,
        zoom: props.zoom,
        bearing: props.bearing,
        pitch: props.pitch,
      });

      // Wait for maps to be ready before initializing compare
      await Promise.all([
        new Promise<void>((resolve) => {
          if (mapA!.loaded()) {
            resolve();
          } else {
            mapA!.on('load', () => resolve());
          }
        }),
        new Promise<void>((resolve) => {
          if (mapB!.loaded()) {
            resolve();
          } else {
            mapB!.on('load', () => resolve());
          }
        }),
      ]);

      // Initialize map compare after maps are loaded
      if (mapA && mapB && containerRef.value) {
        mapCompareInstance = useMapCompare(mapA, mapB, containerRef.value, {
          orientation: 'vertical',
          mousemove: false,
        });
        // Manually initialize since maps are now ready
        mapCompareInstance.initialize();
      }

      // Apply initial layer visibility
      updateLayerVisibility('A');
      updateLayerVisibility('B');
    };

    // Watch for layer changes
    watch(() => props.mapLayersA, () => {
      updateLayerVisibility('A');
    }, { deep: true });

    watch(() => props.mapLayersB, () => {
      updateLayerVisibility('B');
    }, { deep: true });

    onMounted(() => {
      initializeMaps();
    });

    onBeforeUnmount(() => {
      mapCompareInstance?.unmount();
      mapCompareInstance = null;
      if (mapA) {
        mapA.remove();
        mapA = null;
      }
      if (mapB) {
        mapB.remove();
        mapB = null;
      }
    });

    return {
      containerRef,
      mapARef,
      mapBRef,
    };
  },
});
</script>

<template>
  <div ref="containerRef" class="map-compare-container">
    <div ref="mapARef" class="map map-a" />
    <div ref="mapBRef" class="map map-b" />
  </div>
</template>

<style scoped>
.map-compare-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.map-a {
  z-index: 1;
}

.map-b {
  z-index: 0;
}
</style>

<style>
/* Global styles for useMapCompare slider */
.maplibre-compare {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

.compare-swiper-vertical {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  margin-left: -2px;
  background: white;
  cursor: ew-resize;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
}

.compare-swiper-vertical::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  margin-left: -20px;
  margin-top: -20px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.compare-swiper-vertical::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  margin-left: -4px;
  margin-top: -6px;
  border-style: solid;
  border-width: 6px 8px 6px 0;
  border-color: transparent #666 transparent transparent;
  pointer-events: none;
}

.compare-swiper-horizontal {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  margin-top: -2px;
  background: white;
  cursor: ns-resize;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
}
</style>
