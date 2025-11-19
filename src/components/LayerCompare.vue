<script lang="ts">
import {
  defineComponent, PropType,
} from 'vue';
import { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { SwiperOptions } from './MapCompare.vue';
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
        grabThickness: 20,
        orientation: 'vertical',
        handleSize: 40,
        lineColor: 'white',
        handleColor: 'white',
        handleShadowColor: 'rgba(0, 0, 0, 0.3)',
        arrowColor: '#666',
      }),
    },
  },
  setup(props) {
    return {
    };
  },
});
</script>

<template>
  <MapCompare
    :mapStyleA="mapStyle"
    :mapStyleB="mapStyle"
    :swiperOptions="swiperOptions"
    :mapLayersA="mapLayersA"
    :mapLayersB="mapLayersB"
    :center="center"
    :zoom="zoom"
    :bearing="bearing"
    :pitch="pitch"
  />
</template>

<style scoped>

</style>
