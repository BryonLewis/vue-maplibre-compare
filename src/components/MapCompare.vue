<script lang="ts">
import {
  defineComponent, ref, onMounted, onBeforeUnmount, watch, PropType, computed, nextTick,
} from 'vue';
import maplibregl, { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { useMapCompare } from '../use/useMapCompare';
import { useStyleCompare } from '../use/useStyleCompare';

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
  mapStyleB?: string | StyleSpecification
  mapLayersA?: string[]
  mapLayersB?: string[]
  center?: [number, number]
  zoom?: number
  bearing?: number
  pitch?: number
  swiperOptions?: SwiperOptions
}

export interface CameraData {
  center: [number, number]
  zoom: number
  bearing?: number
  pitch?: number
}

export default defineComponent({
  name: 'MapCompare',
  props: {
    mapStyleA: {
      type: [String, Object] as PropType<StyleSpecification | string>,
      required: true,
    },
    mapStyleB: {
      type: [String, Object] as PropType<StyleSpecification | string>,
      required: false,
      default: undefined,
    },
    mapLayersA: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    mapLayersB: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    camera: {
      type: Object as PropType<CameraData>,
      default: () => ({
        center: [0, 0],
        zoom: 1,
        bearing: 0,
        pitch: 0,
      }),
    },
    layerOrder: {
      type: String as PropType<'topmost' | 'bottommost'>,
      default: 'topmost',
    },
    transformRequest: {
      type: Function as PropType<
      (url: string, resourceType?: maplibregl.ResourceType) => maplibregl.RequestParameters
      >,
      default: undefined,
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
    attributionControl: {
      type: [Object, Boolean] as PropType<maplibregl.AttributionControlOptions | false>,
      required: false,
      default: () => undefined,
    },
  },
  emits: ['panend', 'zoomend', 'pitchend', 'rotateend', 'loading-complete', 'sliderend'],
  setup(props, { slots, emit }) {
    const containerRef = ref<HTMLElement>();
    const mapARef = ref<HTMLElement>();
    const mapBRef = ref<HTMLElement>();
    const swiperRef = ref<HTMLElement | null>(null);
    const isLoading = ref(true);
    let styleCompare: ReturnType<typeof useStyleCompare> | null = null;

    let mapA: MaplibreMap | null = null;
    let mapB: MaplibreMap | null = null;
    let mapCompareInstance: ReturnType<typeof useMapCompare> | null = null;
    let mapAResizeHandler: (() => void) | null = null;
    let mapBResizeHandler: (() => void) | null = null;
    let mapAMoveEndHandler: (() => void) | null = null;
    let mapAZoomEndHandler: (() => void) | null = null;
    let mapAPitchEndHandler: (() => void) | null = null;
    let mapARotateEndHandler: (() => void) | null = null;
    let sliderEndHandler: ((data: { currentPosition: number | null }) => void) | null = null;

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

    const updateLayerOrdering = (mapType: 'A' | 'B') => {
      const map = mapType === 'A' ? mapA : mapB;
      const enabledLayers = mapType === 'A' ? props.mapLayersA : props.mapLayersB;

      if (!map || !map.isStyleLoaded()) return;
      if (!enabledLayers || enabledLayers.length === 0) return;

      // Reorder layers based on layerOrder prop
      const layersInStyle = map.getStyle().layers || [];
      const orderedLayers = props.layerOrder === 'topmost'
        ? enabledLayers
        : [...enabledLayers].reverse();

      orderedLayers.forEach((layerId) => {
        if (layersInStyle.find((l) => l.id === layerId)) {
          map.moveLayer(layerId);
        }
      });
    };

    const initializeSwiper = () => {
      if (!mapA || !mapB || !containerRef.value) return;

      // Unmount existing swiper if it exists
      if (mapCompareInstance) {
        if (sliderEndHandler) {
          mapCompareInstance.off('slideend', sliderEndHandler);
        }
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

      // Set up slider end event listener
      if (mapCompareInstance) {
        // Remove existing handler if it exists
        if (sliderEndHandler) {
          mapCompareInstance.off('slideend', sliderEndHandler);
        }

        sliderEndHandler = (data: { currentPosition: number | null }) => {
          if (!containerRef.value || data.currentPosition === null) return;

          const bounds = containerRef.value.getBoundingClientRect();
          const isHorizontal = orientation === 'horizontal';
          const dimension = isHorizontal ? bounds.height : bounds.width;
          if (dimension > 0) {
            const percentage = (data.currentPosition / dimension) * 100;
            emit('sliderend', {
              percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
              position: data.currentPosition,
            });
          }
        };

        mapCompareInstance.on('slideend', sliderEndHandler);
      }
    };

    const initializeMaps = async () => {
      if (!mapARef.value || !mapBRef.value || !containerRef.value) return;

      // Initialize Map A
      mapA = new maplibregl.Map({
        container: mapARef.value,
        style: props.mapStyleA,
        center: props.camera.center,
        zoom: props.camera.zoom,
        bearing: props.camera.bearing || 0,
        pitch: props.camera.pitch || 0,
        transformRequest: props.transformRequest ? props.transformRequest : (url) => ({
          url,
          headers: props.headers,
        }),
        attributionControl: props.attributionControl,
      });

      // Initialize Map B (use mapStyleA if mapStyleB is not provided)
      mapB = new maplibregl.Map({
        container: mapBRef.value,
        style: props.mapStyleB || props.mapStyleA,
        center: props.camera.center,
        zoom: props.camera.zoom,
        bearing: props.camera.bearing || 0,
        pitch: props.camera.pitch || 0,
        transformRequest: props.transformRequest ? props.transformRequest : (url) => ({
          url,
          headers: props.headers,
        }),
        attributionControl: props.attributionControl,
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
      updateLayerOrdering('A');
      updateLayerVisibility('B');
      updateLayerOrdering('B');

      // Mark loading as complete and emit event
      isLoading.value = false;
      emit('loading-complete');

      // Initialized useStyleCompare for adding/removing and modification of alyers
      styleCompare = useStyleCompare(
        {
          mapA,
          mapB,
          baseStyleA: mapA.getStyle(),
          baseStyleB: mapB.getStyle(),
        },
      );

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

      // Set up event listeners for map interactions
      // Since maps are synced, we only need to listen to one map for each event type
      // We'll listen to mapA and emit events when it finishes
      mapAMoveEndHandler = () => {
        emit('panend', {
          center: mapA!.getCenter().toArray() as [number, number],
          zoom: mapA!.getZoom(),
          bearing: mapA!.getBearing(),
          pitch: mapA!.getPitch(),
        });
      };
      mapAZoomEndHandler = () => {
        emit('zoomend', {
          center: mapA!.getCenter().toArray() as [number, number],
          zoom: mapA!.getZoom(),
          bearing: mapA!.getBearing(),
          pitch: mapA!.getPitch(),
        });
      };
      mapAPitchEndHandler = () => {
        emit('pitchend', {
          center: mapA!.getCenter().toArray() as [number, number],
          zoom: mapA!.getZoom(),
          bearing: mapA!.getBearing(),
          pitch: mapA!.getPitch(),
        });
      };
      mapARotateEndHandler = () => {
        emit('rotateend', {
          center: mapA!.getCenter().toArray() as [number, number],
          zoom: mapA!.getZoom(),
          bearing: mapA!.getBearing(),
          pitch: mapA!.getPitch(),
        });
      };

      mapA!.on('moveend', mapAMoveEndHandler);
      mapA!.on('zoomend', mapAZoomEndHandler);
      mapA!.on('pitchend', mapAPitchEndHandler);
      mapA!.on('rotateend', mapARotateEndHandler);
    };

    // Watch for layer changes
    watch(() => props.mapLayersA, () => {
      updateLayerVisibility('A');
      updateLayerOrdering('A');
    }, { deep: true });

    watch(() => props.mapLayersB, () => {
      updateLayerVisibility('B');
      updateLayerOrdering('B');
    }, { deep: true });

    watch(() => props.layerOrder, () => {
      updateLayerOrdering('A');
      updateLayerOrdering('B');
    });

    watch(() => props.mapStyleA, () => {
      if (styleCompare) {
        styleCompare.updateStyle('A', props.mapStyleA);
        // If mapStyleB is not provided, also update map B with the same style
        if (!props.mapStyleB) {
          styleCompare.updateStyle('B', props.mapStyleA);
        }
      }
      updateLayerVisibility('A');
      updateLayerOrdering('A');
      // If mapStyleB is not provided, also update map B layer visibility/ordering
      if (!props.mapStyleB) {
        updateLayerVisibility('B');
        updateLayerOrdering('B');
      }
    }, { deep: true });

    watch(() => props.mapStyleB, () => {
      if (styleCompare) {
        styleCompare.updateStyle('B', props.mapStyleB || props.mapStyleA);
      }
      updateLayerVisibility('B');
      updateLayerOrdering('B');
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
      if (mapCompareInstance && sliderEndHandler) {
        mapCompareInstance.off('slideend', sliderEndHandler);
      }
      mapCompareInstance?.unmount();
      mapCompareInstance = null;
      if (mapA) {
        if (mapAResizeHandler) {
          mapA.off('resize', mapAResizeHandler);
        }
        if (mapAMoveEndHandler) {
          mapA.off('moveend', mapAMoveEndHandler);
        }
        if (mapAZoomEndHandler) {
          mapA.off('zoomend', mapAZoomEndHandler);
        }
        if (mapAPitchEndHandler) {
          mapA.off('pitchend', mapAPitchEndHandler);
        }
        if (mapARotateEndHandler) {
          mapA.off('rotateend', mapARotateEndHandler);
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
      mapAMoveEndHandler = null;
      mapAZoomEndHandler = null;
      mapAPitchEndHandler = null;
      mapARotateEndHandler = null;
      sliderEndHandler = null;
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
        loadingTextColor: darkMode ? '#fff' : '#333',
        loadingSpinnerColor: darkMode ? '#fff' : '#333',
        loadingSpinnerBgColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      };
    });

    return {
      containerRef,
      mapARef,
      mapBRef,
      swiperRef,
      hasIconSlot: !!slots.icon,
      swiperOpts,
      isLoading,
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
      '--loading-text-color': swiperOpts.loadingTextColor,
      '--loading-spinner-color': swiperOpts.loadingSpinnerColor,
      '--loading-spinner-bg-color': swiperOpts.loadingSpinnerBgColor,
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
    <div v-if="isLoading" class="loading-indicator">
      <div class="spinner" />
      <div class="loading-text">
        Loading maps...
      </div>
    </div>
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

/* Loading Indicator */
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  pointer-events: none;
}

.loading-text {
  color: var(--loading-text-color, #333);
  font-size: 16px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--loading-spinner-bg-color, rgba(0, 0, 0, 0.1));
  border-top-color: var(--loading-spinner-color, #333);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
