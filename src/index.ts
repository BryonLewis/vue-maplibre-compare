import type { Plugin } from 'vue';
import MapCompare from './components/MapCompare.vue';
import LayerCompare from './components/LayerCompare.vue';
import ToggleCompare from './components/ToggleCompare.vue';

export { MapCompare, LayerCompare, ToggleCompare };

export type { MapCompareProps } from './components/MapCompare.vue';
export type { LayerCompareProps } from './components/LayerCompare.vue';
export type { ToggleCompareProps } from './components/ToggleCompare.vue';

// Install function for Vue plugin
export const MapComparePlugin: Plugin = {
  install(app) {
    app.component('MapCompare', MapCompare);
    app.component('LayerCompare', LayerCompare);
    app.component('ToggleCompare', ToggleCompare);
  },
};

export default MapComparePlugin;
