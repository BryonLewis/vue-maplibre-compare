<template>
  <div id="app">
    <div class="header">
      <h1>Vue MapLibre Compare Demo</h1>
      <p>Drag the slider to compare two different map styles</p>
    </div>
    
    <div class="controls">
      <div class="control-group">
        <h3>Map A Layers</h3>
        <label v-for="layer in availableLayersA" :key="layer">
          <input 
            type="checkbox" 
            :value="layer" 
            v-model="selectedLayersA"
          />
          {{ layer }}
        </label>
      </div>
      
      <div class="control-group">
        <h3>Map B Layers</h3>
        <label v-for="layer in availableLayersB" :key="layer">
          <input 
            type="checkbox" 
            :value="layer" 
            v-model="selectedLayersB"
          />
          {{ layer }}
        </label>
      </div>
    </div>
    
    <div class="map-container">
      <MapCompare
        :mapStyleA="mapStyleA"
        :mapStyleB="mapStyleB"
        :mapLayersA="selectedLayersA"
        :mapLayersB="selectedLayersB"
        :center="[-74.5, 40]"
        :zoom="9"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MapCompare } from '../../src/index'

// Using different map styles for comparison
const mapStyleA = 'https://demotiles.maplibre.org/style.json'
const mapStyleB = 'https://demotiles.maplibre.org/style.json'

// Example layers that might be in the styles
// Note: These are example layer names. In a real app, you'd extract these from the loaded map
const availableLayersA = ref<string[]>([])
const availableLayersB = ref<string[]>([])

const selectedLayersA = ref<string[]>([])
const selectedLayersB = ref<string[]>([])
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
}

.header p {
  color: #ecf0f1;
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
  margin-bottom: 10px;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 13px;
  cursor: pointer;
}

.control-group input[type="checkbox"] {
  margin-right: 8px;
}

.map-container {
  flex: 1;
  position: relative;
  min-height: 500px;
}
</style>
