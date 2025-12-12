<script lang="ts">
import {
  defineComponent, PropType,
} from 'vue';
import {
  AttributionControlOptions, StyleSpecification, RequestParameters, ResourceType,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { SwiperOptions, CameraData } from './MapCompare.vue';
import MapCompare from './MapCompare.vue';

export interface LayerCompareProps {
  mapStyle: string | StyleSpecification
  mapLayersA?: string[]
  mapLayersB?: string[]
  center?: [number, number]
  zoom?: number
  bearing?: number
  pitch?: number
  swiperOptions?: SwiperOptions
}

export default defineComponent({
  name: 'LayerCompare',
  components: {
    MapCompare,
  },
  props: {
    mapStyle: {
      type: [String, Object] as PropType<StyleSpecification | string>,
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
    layerOrder: {
      type: String as PropType<'topmost' | 'bottommost'>,
      default: 'topmost',
    },
    camera: {
      type: Object as PropType<CameraData>,
      required: true,
      default: () => ({
        center: [0, 0],
        zoom: 0,
        bearing: 0,
        pitch: 0,
      }),
    },
    headers: {
      type: Object as PropType<Record<string, string>>,
      default: () => ({}),
    },
    transformRequest: {
      type: Function as PropType<
      (url: string, resourceType?: ResourceType) => RequestParameters
      >,
      default: undefined,
    },
    swiperOptions: {
      type: Object as PropType<SwiperOptions>,
      default: () => ({
        thickness: 4,
        grabThickness: 20,
        orientation: 'vertical',
        handleSize: 40,
        lineColor: 'white',
        handleColor: 'white',
        handleShadowColor: 'rgba(0, 0, 0, 0.3)',
        arrowColor: '#666',
      }),
    },
    attributionControl: {
      type: [Object, Boolean] as PropType<AttributionControlOptions | false>,
      required: false,
      default: () => undefined,
    },
  },
  emits: ['panend', 'zoomend', 'pitchend', 'rotateend'],
  setup(_props, { emit }) {
    const handlePanEnd = (event: any) => {
      emit('panend', event);
    };

    const handleZoomEnd = (event: any) => {
      emit('zoomend', event);
    };

    const handlePitchEnd = (event: any) => {
      emit('pitchend', event);
    };

    const handleRotateEnd = (event: any) => {
      emit('rotateend', event);
    };

    return {
      handlePanEnd,
      handleZoomEnd,
      handlePitchEnd,
      handleRotateEnd,
    };
  },
});
</script>

<template>
  <MapCompare
    :map-style-a="mapStyle"
    :map-style-b="mapStyle"
    :swiper-options="swiperOptions"
    :map-layers-a="mapLayersA"
    :map-layers-b="mapLayersB"
    :camera="camera"
    :layer-order="layerOrder"
    :headers="headers"
    :transform-request="transformRequest"
    :attribution-control="attributionControl"
    @panend="handlePanEnd"
    @zoomend="handleZoomEnd"
    @pitchend="handlePitchEnd"
    @rotateend="handleRotateEnd"
  />
</template>

<style scoped></style>
