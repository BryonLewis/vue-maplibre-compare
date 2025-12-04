<script lang="ts">
import { defineComponent, ref, PropType, onMounted } from 'vue'
import { ToggleCompare } from '../../src/index'
import type { StyleSpecification } from 'maplibre-gl'
import type { SwiperOptions } from '../../src/components/MapCompare.vue'
import type { Map as MaplibreMap } from 'maplibre-gl'

export default defineComponent({
  name: 'DemoToggleCompare',
  components: {
    ToggleCompare
  },
  props: {
    swiperOptions: {
      type: Object as PropType<SwiperOptions>,
      required: true,
    },
  },
  setup() {
    const toggleCompareRef = ref<InstanceType<typeof ToggleCompare> | null>(null)
    const compareEnabled = ref(false)
    const mapAInstance = ref<MaplibreMap | null>(null)

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

    const nyImagery: StyleSpecification = {
      version: 8,
      name: 'NY Imagery',
      sources: {
        'ny-imagery': {
          type: 'raster',
          tiles: [
            "https://orthos.its.ny.gov/arcgis/services/wms/Latest/MapServer/WmsServer?" +
            "service=WMS&" +
            "request=GetMap&" +
            "version=1.3.0&" +
            "layers=0,1,2,3,4&" +
            "styles=&" +
            "format=image/png&" +
            "transparent=true&" +
            "width=256&height=256&" +
            "crs=EPSG:3857&" +
            "bbox={bbox-epsg-3857}"
          ],

          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'ny-imagery-tiles',
          type: 'raster',
          source: 'ny-imagery',
        },
      ]
    }

    const availableStyles = [
      openStreetMapStyle,
      naipStyle,
      nyImagery
    ]

    const selectedStyleIndexA = ref(0)
    const selectedStyleIndexB = ref(1)

    // Layer control - these would be populated dynamically in a real app
    const selectedLayersA = ref<string[]>([])
    const selectedLayersB = ref<string[]>([])

    const handleMapReady = (map: MaplibreMap) => {
      mapAInstance.value = map
      console.log('Map A is ready!', map)
    }

    const handleToggleCompare = () => {
      compareEnabled.value = !compareEnabled.value
    }

    const addMarker = () => {
      if (mapAInstance.value) {
        // Example: Add a marker to the map
        const center = mapAInstance.value.getCenter()
        console.log('Current center:', center.toArray())
        // You could add a marker here using maplibre-gl markers or custom HTML
      }
    }

    const flyToLocation = () => {
      if (mapAInstance.value) {
        mapAInstance.value.flyTo({
          center: [-74.1847, 43.1339],
          zoom: 12,
          duration: 2000
        })
      }
    }

    onMounted(() => {
      // Access the map instance after component is mounted
      // The map-ready event will fire when the map is initialized
    })

    return {
      toggleCompareRef,
      compareEnabled,
      mapAInstance,
      availableStyles,
      selectedStyleIndexA,
      selectedStyleIndexB,
      selectedLayersA,
      selectedLayersB,
      handleMapReady,
      handleToggleCompare,
      addMarker,
      flyToLocation,
    }
  }
})
</script>

<template>
  <div class="demo-toggle-compare">
    <div class="controls">
      <div class="control-group">
        <h3>Map A Style (Primary Map)</h3>
        <select v-model="selectedStyleIndexA">
          <option :value="0">OpenStreetMap Style</option>
          <option :value="1">NAIP Imagery</option>
          <option :value="2">NY Imagery</option>
        </select>
      </div>

      <div class="control-group">
        <h3>Map B Style (Comparison Map)</h3>
        <select v-model="selectedStyleIndexB" :disabled="!compareEnabled">
          <option :value="0">OpenStreetMap Style</option>
          <option :value="1">NAIP Imagery</option>
          <option :value="2">NY Imagery</option>
        </select>
      </div>

      <div class="control-group">
        <h3>Comparison Mode</h3>
        <button 
          class="toggle-button" 
          :class="{ active: compareEnabled }"
          @click="handleToggleCompare"
        >
          {{ compareEnabled ? 'Disable Comparison' : 'Enable Comparison' }}
        </button>
      </div>
    </div>

    <div class="info">
      <p><strong>Instructions:</strong> 
        <span v-if="!compareEnabled">
          This is a regular map view. Use the toggle button to enable comparison mode. 
          You can interact with the map normally (pan, zoom, rotate).
        </span>
        <span v-else>
          Comparison mode is enabled! Click and drag the slider to compare the two maps. 
          Use your mouse or touch to pan, zoom, and rotate both maps simultaneously.
        </span>
      </p>
    </div>

    <div class="map-actions">
      <button class="action-button" @click="addMarker" :disabled="!mapAInstance">
        Log Map Center
      </button>
      <button class="action-button" @click="flyToLocation" :disabled="!mapAInstance">
        Fly to NY Location
      </button>
      <div class="map-status">
        <span v-if="mapAInstance" class="status-indicator status-active">Map Ready</span>
        <span v-else class="status-indicator status-loading">Loading Map...</span>
      </div>
    </div>

    <div class="map-container">
      <ToggleCompare 
        ref="toggleCompareRef"
        :mapStyleA="availableStyles[selectedStyleIndexA]" 
        :mapStyleB="compareEnabled ? availableStyles[selectedStyleIndexB] : undefined"
        :mapLayersA="selectedLayersA" 
        :mapLayersB="selectedLayersB"
        :camera="{ center: [-74.1847, 43.1339], zoom: 9, bearing: 0, pitch: 0 }" 
        :swiperOptions="swiperOptions"
        :compareEnabled="compareEnabled"
        @map-ready="handleMapReady"
      />
    </div>
  </div>
</template>

<style scoped>
.demo-toggle-compare {
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

.control-group select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.toggle-button {
  width: 100%;
  padding: 10px 16px;
  border: 2px solid #3498db;
  border-radius: 4px;
  background: white;
  color: #3498db;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-button:hover {
  background: #ebf5fb;
}

.toggle-button.active {
  background: #3498db;
  color: white;
}

.toggle-button.active:hover {
  background: #2980b9;
  border-color: #2980b9;
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

.map-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.action-button {
  padding: 8px 16px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  background: white;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover:not(:disabled) {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.map-status {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.status-indicator {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-loading {
  background: #fff3cd;
  color: #856404;
}

.map-container {
  flex: 1;
  position: relative;
  min-height: 500px;
}
</style>

