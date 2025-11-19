import MapCompare from './components/MapCompare.vue'
import type { Plugin } from 'vue'

export { MapCompare }

export type { MapCompareProps } from './components/MapCompare.vue'

// Install function for Vue plugin
export const MapComparePlugin: Plugin = {
  install(app) {
    app.component('MapCompare', MapCompare)
  }
}

export default MapComparePlugin
