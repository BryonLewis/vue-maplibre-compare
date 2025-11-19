import type { Plugin } from 'vue';
import MapCompare from './components/MapCompare.vue';
import LayerCompare from './components/LayerCompare.vue';

export { MapCompare, LayerCompare };

export type { MapCompareProps } from './components/MapCompare.vue';
export type { LayerCompareProps } from './components/LayerCompare.vue';

// Install function for Vue plugin
export const MapComparePlugin: Plugin = {
  install(app) {
    app.component('MapCompare', MapCompare);
    app.component('LayerCompare', LayerCompare);
  },
};

export default MapComparePlugin;
