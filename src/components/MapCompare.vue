<script lang="ts">
import {
  defineComponent, ref, onMounted, onBeforeUnmount, watch, PropType, computed,
} from 'vue';
import maplibregl, { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { useMapCompare } from '../use/useMapCompare';

const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

export interface SwiperOptions {
  thickness?: number
  orientation: 'vertical' | 'horizontal';
  grabThickness?: number
  handleSize?: number
  lineColor?: string
  handleColor?: string
  handleShadowColor?: string
  arrowColor?: string
}

export interface MapCompareProps {
  mapStyleA: string | StyleSpecification
  mapStyleB: string | StyleSpecification
  mapLayersA?: string[]
  mapLayersB?: string[]
  center?: [number, number]
  zoom?: number
  bearing?: number
  pitch?: number
  swiperOptions?: SwiperOptions
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
    swiperOptions: {
      type: Object as PropType<SwiperOptions>,
      default: () => ({
        thickness: 4,
        orientation: 'vertical',
        grabThickness: 20,
        handleSize: 40,
        lineColor: 'white',
        handleColor: 'white',
        handleShadowColor: 'rgba(0, 0, 0, 0.3)',
        arrowColor: '#666',
      }),
    },
  },
  setup(props, { slots }) {
    const containerRef = ref<HTMLElement>();
    const mapARef = ref<HTMLElement>();
    const mapBRef = ref<HTMLElement>();
    const swiperRef = ref<HTMLElement | null>(null);

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
          orientation: props.swiperOptions?.orientation ?? 'vertical',
          mousemove: false,
        });
        // Manually initialize since maps are now ready
        mapCompareInstance.initialize();

        // Capture swiper element for Teleport
        // The swiper is created by useMapCompare and appended to the container
        const swiperEl = containerRef.value.querySelector('.compare-swiper-vertical');
        if (swiperEl) {
          swiperRef.value = swiperEl as HTMLElement;
          if (slots.icon) {
            swiperRef.value.classList.add('has-custom-icon');
          }
        }
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

    watch(() => props.mapStyleA, () => {
      mapA?.setStyle(props.mapStyleA);
    }, { deep: true });

    watch(() => props.mapStyleB, () => {
      mapB?.setStyle(props.mapStyleB);
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

    // Computed swiper options with defaults
    const swiperOpts = computed(() => ({
      thickness: props.swiperOptions?.thickness ?? 4,
      grabThickness: props.swiperOptions?.grabThickness ?? 4,
      handleSize: props.swiperOptions?.handleSize ?? 40,
      lineColor: props.swiperOptions?.lineColor ?? 'white',
      handleColor: props.swiperOptions?.handleColor ?? 'white',
      handleShadowColor: props.swiperOptions?.handleShadowColor ?? 'rgba(0, 0, 0, 0.3)',
      arrowColor: props.swiperOptions?.arrowColor ?? '#666',
    }));

    return {
      containerRef,
      mapARef,
      mapBRef,
      swiperRef,
      hasIconSlot: !!slots.icon,
      swiperOpts,
    };
  },
});
</script>

<template>
  <div
    ref="containerRef"
    class="map-compare-container"
    :style="{
      '--swiper-thickness': `${swiperOpts.thickness}px`,
      '--swiper-grab-thickness': `${Math.max(swiperOpts.grabThickness, swiperOpts.thickness)}px`,
      '--swiper-handle-size': `${swiperOpts.handleSize}px`,
      '--swiper-line-color': swiperOpts.lineColor,
      '--swiper-handle-color': swiperOpts.handleColor,
      '--swiper-handle-shadow-color': swiperOpts.handleShadowColor,
      '--swiper-arrow-color': swiperOpts.arrowColor,
    }"
  >
    <div ref="mapARef" class="map map-a" />
    <div ref="mapBRef" class="map map-b" />

    <Teleport v-if="swiperRef && hasIconSlot" :to="swiperRef">
      <div class="custom-swiper-icon">
        <slot name="icon" />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.map-compare-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
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

/* Custom Icon Wrapper */
:deep(.custom-swiper-icon) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
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
  width: var(--swiper-grab-thickness, 4px);
  margin-left: calc(var(--swiper-grab-thickness, 4px) * -0.5);
  background: linear-gradient(to right,
      transparent calc(50% - var(--swiper-thickness, 4px) / 2),
      var(--swiper-line-color, white) calc(50% - var(--swiper-thickness, 4px) / 2),
      var(--swiper-line-color, white) calc(50% + var(--swiper-thickness, 4px) / 2),
      transparent calc(50% + var(--swiper-thickness, 4px) / 2));
  cursor: ew-resize;
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.compare-swiper-vertical::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--swiper-handle-size, 40px);
  height: var(--swiper-handle-size, 40px);
  margin-left: calc(var(--swiper-handle-size, 40px) * -0.5);
  margin-top: calc(var(--swiper-handle-size, 40px) * -0.5);
  background: var(--swiper-handle-color, white);
  border-radius: 50%;
  box-shadow: 0 2px 8px var(--swiper-handle-shadow-color, rgba(0, 0, 0, 0.3));
  pointer-events: none;
}

/* Back-to-back arrows for vertical swiper (left/right) */
.compare-swiper-vertical::after {
  content: '⬄';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--swiper-arrow-color, #666);
  font-size: 14px;
  line-height: 1;
  pointer-events: none;
  z-index: 1;
  white-space: nowrap;
  font-family: Arial, sans-serif;
}

/* Hide default arrows if custom icon is present */
.compare-swiper-vertical.has-custom-icon::after,
.compare-swiper-horizontal.has-custom-icon::after {
  display: none;
}

.compare-swiper-horizontal {
  position: absolute;
  left: 0;
  right: 0;
  height: var(--swiper-grab-thickness, 4px);
  margin-top: calc(var(--swiper-grab-thickness, 4px) * -0.5);
  background: linear-gradient(to bottom,
      transparent calc(50% - var(--swiper-grab-thickness, 4px) / 2),
      var(--swiper-line-color, white) calc(50% - var(--swiper-grab-thickness, 4px) / 2),
      var(--swiper-line-color, white) calc(50% + var(--swiper-grab-thickness, 4px) / 2),
      transparent calc(50% + var(--swiper-grab-thickness, 4px) / 2));
  cursor: ns-resize;
  box-shadow: 0 0 8px var(--swiper-handle-shadow-color, rgba(0, 0, 0, 0.5));
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.compare-swiper-horizontal::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--swiper-handle-size, 40px);
  height: var(--swiper-handle-size, 40px);
  margin-left: calc(var(--swiper-handle-size, 40px) * -0.5);
  margin-top: calc(var(--swiper-handle-size, 40px) * -0.5);
  background: var(--swiper-handle-color, white);
  border-radius: 50%;
  box-shadow: 0 2px 8px var(--swiper-handle-shadow-color, rgba(0, 0, 0, 0.3));
  pointer-events: none;
}

/* Back-to-back arrows for horizontal swiper (up/down) */
.compare-swiper-horizontal::after {
  content: '⇳';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--swiper-arrow-color, #666);
  font-size: 14px;
  line-height: 1;
  pointer-events: none;
  z-index: 1;
  white-space: nowrap;
  font-family: Arial, sans-serif;
}
</style>
