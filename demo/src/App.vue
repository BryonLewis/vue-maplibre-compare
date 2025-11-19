<template>
  <div id="app">
    <div class="header">
      <h1>Vue MapLibre Compare Demo</h1>
      <p>Drag the slider to compare two different map styles</p>
    </div>
    
    <div class="controls">
      <div class="control-group">
        <h3>Map A Style</h3>
        <select v-model="selectedStyleIndexA">
          <option :value="0">Simple Blue Style</option>
          <option :value="1">Simple Red Style</option>
          <option :value="2">MapLibre Demo Tiles (requires internet)</option>
        </select>
      </div>
      
      <div class="control-group">
        <h3>Map B Style</h3>
        <select v-model="selectedStyleIndexB">
          <option :value="0">Simple Blue Style</option>
          <option :value="1">Simple Red Style</option>
          <option :value="2">MapLibre Demo Tiles (requires internet)</option>
        </select>
      </div>
    </div>
    
    <div class="info">
      <p><strong>Instructions:</strong> Click and drag the white slider to compare the two maps. Use your mouse or touch to pan, zoom, and rotate both maps simultaneously.</p>
    </div>
    
    <div class="map-container">
      <MapCompare
        :key="comparisonKey"
        :mapStyleA="availableStyles[selectedStyleIndexA]"
        :mapStyleB="availableStyles[selectedStyleIndexB]"
        :mapLayersA="selectedLayersA"
        :mapLayersB="selectedLayersB"
        :center="[0, 0]"
        :zoom="2"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MapCompare } from '../../src/index'
import type { StyleSpecification } from 'maplibre-gl'

// Simple inline styles for testing without external tile servers
const blueStyle: StyleSpecification = {
  version: 8,
  name: 'Simple Blue',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#1e3a8a'
      }
    }
  ]
}

const redStyle: StyleSpecification = {
  version: 8,
  name: 'Simple Red',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#991b1b'
      }
    }
  ]
}

const availableStyles = [
  blueStyle,
  redStyle,
  'https://demotiles.maplibre.org/style.json'
]

const selectedStyleIndexA = ref(0)
const selectedStyleIndexB = ref(1)

// Layer control - these would be populated dynamically in a real app
const selectedLayersA = ref<string[]>([])
const selectedLayersB = ref<string[]>([])

// Force component re-render when styles change
const comparisonKey = computed(() => 
  `${selectedStyleIndexA.value}-${selectedStyleIndexB.value}`
)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

#app {
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20px;
  background: #2c3e50;
  color: white;
  text-align: center;
}

.header h1 {
  margin-bottom: 10px;
  font-size: 28px;
}

.header p {
  color: #ecf0f1;
  font-size: 14px;
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
