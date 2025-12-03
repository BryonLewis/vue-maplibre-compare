<script lang="ts">
import { defineComponent, ref, computed, PropType } from 'vue'
import { MapCompare } from '../../src/index'
import type { StyleSpecification } from 'maplibre-gl'
import type { SwiperOptions } from '../../src/components/MapCompare.vue'

export default defineComponent({
  name: 'DemoTileUrlTest',
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
    // Different tile URL options for testing
    const tileUrlOptions = [
      {
        name: 'OpenStreetMap A',
        url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'
      },
      {
        name: 'OpenStreetMap B',
        url: 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'
      },
      {
        name: 'OpenStreetMap C',
        url: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
      },
      {
        name: 'CartoDB Positron',
        url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
      },
      {
        name: 'CartoDB Dark Matter',
        url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      },
      {
        name: 'Stamen Terrain',
        url: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg'
      },
    ]

    const selectedTileUrlA = ref(0)
    const selectedTileUrlB = ref(1)

    // Create style with url property (as expected by useStyleCompare)
    // Note: MapLibre requires 'tiles' array, but useStyleCompare checks for 'url'
    // So we include both - 'tiles' for MapLibre compatibility and 'url' for the update logic
    const createStyle = (tileUrlIndex: number): StyleSpecification => {
      const tileUrl = tileUrlOptions[tileUrlIndex]
      return {
        version: 8,
        name: `Raster Style - ${tileUrl.name}`,
        sources: {
          'raster-source': {
            type: 'raster',
            tiles: [tileUrl.url], // Required by MapLibre - must be array with template URL
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          } as any, // Type assertion needed since url is not in standard RasterSourceSpecification
        },
        layers: [
          {
            id: 'raster-layer',
            type: 'raster',
            source: 'raster-source',
            minzoom: 0,
            maxzoom: 19,
          },
        ]
      }
    }

    const styleA = computed(() => createStyle(selectedTileUrlA.value))
    const styleB = computed(() => createStyle(selectedTileUrlB.value))

    return {
      tileUrlOptions,
      selectedTileUrlA,
      selectedTileUrlB,
      styleA,
      styleB,
    }
  }
})
</script>

<template>
  <div class="demo-tile-url-test">
    <div class="controls">
      <div class="control-group">
        <h3>Map A Tile URL</h3>
        <select v-model="selectedTileUrlA">
          <option 
            v-for="(option, index) in tileUrlOptions" 
            :key="index" 
            :value="index"
          >
            {{ option.name }}
          </option>
        </select>
        <div class="url-display">
          <strong>Current URL:</strong>
          <code>{{ tileUrlOptions[selectedTileUrlA].url }}</code>
        </div>
      </div>

      <div class="control-group">
        <h3>Map B Tile URL</h3>
        <select v-model="selectedTileUrlB">
          <option 
            v-for="(option, index) in tileUrlOptions" 
            :key="index" 
            :value="index"
          >
            {{ option.name }}
          </option>
        </select>
        <div class="url-display">
          <strong>Current URL:</strong>
          <code>{{ tileUrlOptions[selectedTileUrlB].url }}</code>
        </div>
      </div>
    </div>

    <div class="info">
      <p><strong>Tile URL Test:</strong> This demo tests the tileURL change functionality for raster images. 
        When you change the tile URL using the dropdowns above, the map should update the tiles without 
        reloading the entire style. This tests the <code>setTiles()</code> functionality in 
        <code>useStyleCompare.ts</code>.</p>
    </div>

    <div class="map-container">
      <MapCompare
        :mapStyleA="styleA"
        :mapStyleB="styleB"
        :mapLayersA="['raster-layer']"
        :mapLayersB="['raster-layer']"
        :camera="{center: [-74.1847, 43.1339], zoom: 9, bearing: 0, pitch: 0}"
        :swiperOptions="swiperOptions"
      />
    </div>
  </div>
</template>

<style scoped>
.demo-tile-url-test {
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
  margin-bottom: 8px;
}

.control-group select:focus {
  outline: none;
  border-color: #3498db;
}

.url-display {
  padding: 8px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 12px;
}

.url-display strong {
  display: block;
  margin-bottom: 4px;
  color: #495057;
}

.url-display code {
  display: block;
  padding: 4px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 2px;
  color: #e83e8c;
  word-break: break-all;
  font-size: 11px;
}

.info {
  padding: 12px 20px;
  background: #d1ecf1;
  border-bottom: 1px solid #bee5eb;
  color: #0c5460;
}

.info p {
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
}

.info code {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 12px;
}

.map-container {
  flex: 1;
  position: relative;
  min-height: 500px;
}
</style>

