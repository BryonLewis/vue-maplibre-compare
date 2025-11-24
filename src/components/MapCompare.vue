<script lang="ts">
import {
  defineComponent, ref, onMounted, onBeforeUnmount, watch, PropType, computed, nextTick,
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
  darkMode?: boolean
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
    headers: {
      type: Object as PropType<Record<string, string>>,
      default: () => ({}),
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
        darkMode: false,
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
    let mapAResizeHandler: (() => void) | null = null;
    let mapBResizeHandler: (() => void) | null = null;

    // Helper function to enforce absolute positioning on map containers
    // MapLibre automatically sets position to relative during initialization/resize
    const enforceAbsolutePosition = () => {
      if (mapARef.value) {
        mapARef.value.style.setProperty('position', 'absolute', 'important');
        mapARef.value.style.setProperty('top', '0', 'important');
        mapARef.value.style.setProperty('left', '0', 'important');
        mapARef.value.style.setProperty('width', '100%', 'important');
        mapARef.value.style.setProperty('height', '100%', 'important');
      }
      if (mapBRef.value) {
        mapBRef.value.style.setProperty('position', 'absolute', 'important');
        mapBRef.value.style.setProperty('top', '0', 'important');
        mapBRef.value.style.setProperty('left', '0', 'important');
        mapBRef.value.style.setProperty('width', '100%', 'important');
        mapBRef.value.style.setProperty('height', '100%', 'important');
      }
    };

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

    const initializeSwiper = () => {
      if (!mapA || !mapB || !containerRef.value) return;

      // Unmount existing swiper if it exists
      if (mapCompareInstance) {
        mapCompareInstance.unmount();
        mapCompareInstance = null;
      }

      // Initialize map compare with current orientation
      mapCompareInstance = useMapCompare(mapA, mapB, containerRef.value, {
        orientation: props.swiperOptions?.orientation ?? 'vertical',
        mousemove: false,
      });
      // Manually initialize since maps are now ready
      mapCompareInstance.initialize();

      // Capture swiper element for Teleport
      // The swiper is created by useMapCompare and appended to the container
      const orientation = props.swiperOptions?.orientation ?? 'vertical';
      const swiperClass = orientation === 'horizontal'
        ? '.compare-swiper-horizontal'
        : '.compare-swiper-vertical';
      const swiperEl = containerRef.value.querySelector(swiperClass);
      if (swiperEl) {
        swiperRef.value = swiperEl as HTMLElement;
        if (slots.icon) {
          swiperRef.value.classList.add('has-custom-icon');
        }
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
        transformRequest: (url) => ({
          url,
          headers: props.headers,
        }),
      });

      // Initialize Map B
      mapB = new maplibregl.Map({
        container: mapBRef.value,
        style: props.mapStyleB,
        center: props.center,
        zoom: props.zoom,
        bearing: props.bearing,
        pitch: props.pitch,
        transformRequest: (url) => ({
          url,
          headers: props.headers,
        }),
      });

      // Enforce absolute positioning immediately after map creation
      // MapLibre sets position to relative during initialization
      enforceAbsolutePosition();

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

      // Wait for next tick to ensure DOM has computed layout
      await nextTick();

      // Trigger resize on both maps to ensure they have proper dimensions
      // This is critical when the container height is initially 0
      mapA!.resize();
      mapB!.resize();

      // Enforce absolute positioning after resize
      // MapLibre may reset position to relative during resize
      enforceAbsolutePosition();

      // Wait one more tick after resize to ensure dimensions are updated
      await nextTick();

      // Enforce again after nextTick in case MapLibre modified styles
      enforceAbsolutePosition();

      // Initialize swiper after maps are loaded and resized
      initializeSwiper();

      // Apply initial layer visibility
      updateLayerVisibility('A');
      updateLayerVisibility('B');

      // Set up event listeners to re-enforce position after resize events
      // MapLibre may reset position to relative during resize operations
      mapAResizeHandler = () => {
        enforceAbsolutePosition();
      };
      mapBResizeHandler = () => {
        enforceAbsolutePosition();
      };
      mapA!.on('resize', mapAResizeHandler);
      mapB!.on('resize', mapBResizeHandler);
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

    // Watch for swiper orientation changes and reinitialize
    watch(() => props.swiperOptions?.orientation, () => {
      if (mapA && mapB && mapA.loaded() && mapB.loaded()) {
        initializeSwiper();
      }
    });

    onMounted(() => {
      initializeMaps();
    });

    onBeforeUnmount(() => {
      mapCompareInstance?.unmount();
      mapCompareInstance = null;
      if (mapA) {
        if (mapAResizeHandler) {
          mapA.off('resize', mapAResizeHandler);
        }
        mapA.remove();
        mapA = null;
      }
      if (mapB) {
        if (mapBResizeHandler) {
          mapB.off('resize', mapBResizeHandler);
        }
        mapB.remove();
        mapB = null;
      }
      mapAResizeHandler = null;
      mapBResizeHandler = null;
    });

    // Computed swiper options with defaults and dark mode support
    const swiperOpts = computed(() => {
      const darkMode = props.swiperOptions?.darkMode ?? false;
      const baseColors = {
        dark: {
          lineColor: '#333',
          handleColor: '#333',
          handleShadowColor: 'rgba(0, 0, 0, 0.3)',
          arrowColor: '#999',
        },
        light: {
          lineColor: 'white',
          handleColor: 'white',
          handleShadowColor: 'rgba(0, 0, 0, 0.3)',
          arrowColor: '#666',
        },
      };
      const baseColorMode = darkMode ? baseColors.dark : baseColors.light;
      // Use custom colors if provided, otherwise use defaults
      const baseLineColor = props.swiperOptions?.lineColor ?? baseColorMode.lineColor;
      const baseHandleColor = props.swiperOptions?.handleColor ?? baseColorMode.handleColor;
      const baseArrowColor = props.swiperOptions?.arrowColor ?? baseColorMode.arrowColor;

      // Apply dark mode: darker swiper colors, lighter arrow color
      return {
        thickness: props.swiperOptions?.thickness ?? 4,
        grabThickness: props.swiperOptions?.grabThickness ?? 4,
        handleSize: props.swiperOptions?.handleSize ?? 40,
        lineColor: baseLineColor,
        handleColor: baseHandleColor,
        handleShadowColor: baseColorMode.handleShadowColor,
        arrowColor: baseArrowColor,
      };
    });

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
    <div
      ref="mapARef"
      class="map map-a"
      :style="{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
      }"
    />
    <div
      ref="mapBRef"
      class="map map-b"
      :style="{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
      }"
    />
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
  position: absolute !important;
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
      transparent calc(50% - var(--swiper-thickness, 4px) / 2),
      var(--swiper-line-color, white) calc(50% - var(--swiper-thickness, 4px) / 2),
      var(--swiper-line-color, white) calc(50% + var(--swiper-thickness, 4px) / 2),
      transparent calc(50% + var(--swiper-thickness, 4px) / 2));
  cursor: ns-resize;
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
