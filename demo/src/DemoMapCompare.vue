<script lang="ts">
import { defineComponent, ref, PropType } from 'vue'
import { MapCompare } from '../../src/index'
import type { StyleSpecification } from 'maplibre-gl'
import type { SwiperOptions } from '../../src/components/MapCompare.vue'

export default defineComponent({
  name: 'DemoMapCompare',
  components: {
    MapCompare
  },
  props: {
    swiperOptions: {
      type: Object as PropType<SwiperOptions>,
      required: true,
    },
  },
  setup() {

    // Simple inline styles for testing without external tile servers
    const openStreetMapStyle: StyleSpecification = {
      version: 8,
      name: 'Open Street Map',
      sources: {
        osm: {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19,
        },
      ]
    }

    const naipStyle: StyleSpecification = {
      version: 8,
      name: 'NAIP Imagery',
      sources: {
        'naip-imagery': {
          type: 'raster',
          tiles: [
            // eslint-disable-next-line vue/max-len
            'https://gis.apfo.usda.gov/arcgis/rest/services/NAIP/USDA_CONUS_PRIME/ImageServer/tile/{z}/{y}/{x}?blankTile=false',
          ],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'naip-imagery-tiles',
          type: 'raster',
          source: 'naip-imagery',
        },
      ]
    }

    const availableStyles = [
      openStreetMapStyle,
      naipStyle
    ]

    const selectedStyleIndexA = ref(0)
    const selectedStyleIndexB = ref(1)

    // Layer control - these would be populated dynamically in a real app
    const selectedLayersA = ref<string[]>([])
    const selectedLayersB = ref<string[]>([])

    return {
      availableStyles,
      selectedStyleIndexA,
      selectedStyleIndexB,
      selectedLayersA,
      selectedLayersB,
    }
  }
})
</script>

<template>
  <div class="demo-map-compare">
    <div class="controls">
      <div class="control-group">
        <h3>Map A Style</h3>
        <select v-model="selectedStyleIndexA">
          <option :value="0">OpenStreetMap Style</option>
          <option :value="1">NAIP Imagery</option>
        </select>
      </div>

      <div class="control-group">
        <h3>Map B Style</h3>
        <select v-model="selectedStyleIndexB">
          <option :value="0">OpenStreetMap Style</option>
          <option :value="1">NAIP Imagery</option>
        </select>
      </div>

    </div>

    <div class="info">
      <p><strong>Instructions:</strong> Click and drag the slider to compare the two maps. Use your mouse or touch
        to pan, zoom, and rotate both maps simultaneously.</p>
    </div>

    <div class="map-container">
      <MapCompare
        :mapStyleA="availableStyles[selectedStyleIndexA]"
        :mapStyleB="availableStyles[selectedStyleIndexB]"
        :mapLayersA="selectedLayersA"
        :mapLayersB="selectedLayersB"
        :camera="{center: [-74.1847, 43.1339], zoom: 9, bearing: 0, pitch: 0}"
        :swiperOptions="swiperOptions"
      />
    </div>
  </div>
</template>

<style scoped>
.demo-map-compare {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.controls {
  display: flex;
  gap: 20px;
  padding: 15px 20px;
  background: #ecf0f1;
  border-bottom: 1px solid #bdc3c7;
}

.control-group {
  flex: 1;
}

.control-group h3 {
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

.control-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.control-group select:focus {
  outline: none;
  border-color: #3498db;
}

.info {
  padding: 12px 20px;
  background: #fff3cd;
  border-bottom: 1px solid #ffc107;
  color: #856404;
}

.info p {
  font-size: 13px;
  line-height: 1.5;
}

.map-container {
  flex: 1;
  position: relative;
  min-height: 500px;
}
</style>

