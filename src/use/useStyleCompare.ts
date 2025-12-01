/* eslint-disable max-len */
import { Map, StyleSpecification } from 'maplibre-gl';

interface StyleCompareOptions {
  mapA: Map;
  mapB: Map;
  baseStyleA: StyleSpecification;
  baseStyleB: StyleSpecification;
}

export function useStyleCompare(options: StyleCompareOptions) {
  const {
    mapA, mapB, baseStyleA, baseStyleB,
  } = options;

  // Store current styles
  let currentStyleA = baseStyleA;
  let currentStyleB = baseStyleB;
  function updateStyle(targetMap: 'A' | 'B', newStyle: StyleSpecification) {
    const currentStyle = targetMap === 'A' ? currentStyleA : currentStyleB;
    // Check the sources and layers for the new map
    const currentSourceKeys = new Set(Object.keys(currentStyle.sources || {}));
    const newSourceKeys = new Set(Object.keys(newStyle.sources || {}));
    // Get new and removed sources
    const sourcesToAdd = Array.from(newSourceKeys).filter((key) => !currentSourceKeys.has(key));
    const sourcesToRemove = Array.from(currentSourceKeys).filter((key) => !newSourceKeys.has(key));

    // Update sources
    const targetMapInstance = targetMap === 'A' ? mapA : mapB;

    // first need to remove layers that use removed sources
    (currentStyle.layers || []).forEach((layer) => {
      if ('source' in layer && layer.source && sourcesToRemove.includes(layer.source)) {
        if (targetMapInstance.getLayer(layer.id)) {
          targetMapInstance.removeLayer(layer.id);
        }
      }
    });
    // then remove sources
    sourcesToRemove.forEach((sourceId) => {
      if (targetMapInstance.getSource(sourceId)) {
        targetMapInstance.removeSource(sourceId);
      }
    });
    // then add new sources
    sourcesToAdd.forEach((sourceId) => {
      const sourceDef = newStyle.sources ? newStyle.sources[sourceId] : undefined;
      if (sourceDef) {
        targetMapInstance.addSource(sourceId, sourceDef);
      }
    });

    // Now update layers
    const currentLayerIds = new Set((currentStyle.layers || []).map((layer) => layer.id));
    const newLayerIds = new Set((newStyle.layers || []).map((layer) => layer.id));
    // Get new and removed layers
    const layersToAdd = Array.from(newLayerIds).filter((id) => !currentLayerIds.has(id));
    const layersToRemove = Array.from(currentLayerIds).filter((id) => !newLayerIds.has(id));
    // Remove layers
    layersToRemove.forEach((layerId) => {
      if (targetMapInstance.getLayer(layerId)) {
        targetMapInstance.removeLayer(layerId);
      }
    });
    // Add new layers
    (newStyle.layers || []).forEach((layer) => {
      if (layersToAdd.includes(layer.id)) {
        targetMapInstance.addLayer(layer);
      }
    });
    // Now we need to check for layers that exist in both styles and update their properties if they changed
    (newStyle.layers || []).forEach((newLayer) => {
      if (currentLayerIds.has(newLayer.id)) {
        const currentLayer = targetMapInstance.getLayer(newLayer.id);
        if (currentLayer) {
          // Compare and update paint properties
          if (newLayer.paint && JSON.stringify(currentLayer.paint) !== JSON.stringify(newLayer.paint)) {
            Object.entries(newLayer.paint).forEach(([key, value]) => {
              targetMapInstance.setPaintProperty(newLayer.id, key, value);
            });
          }
          if (newLayer.layout && JSON.stringify(currentLayer.layout) !== JSON.stringify(newLayer.layout)) {
            Object.entries(newLayer.layout).forEach(([key, value]) => {
              targetMapInstance.setLayoutProperty(newLayer.id, key, value);
            });
          }
          if ('filter' in newLayer && JSON.stringify(currentLayer.filter) !== JSON.stringify(newLayer.filter)) {
            targetMapInstance.setFilter(newLayer.id, newLayer.filter);
          }
        }
      }
    });
    if (targetMap === 'A') {
      currentStyleA = newStyle;
    } else {
      currentStyleB = newStyle;
    }
  }
  return {
    updateStyle,
    getCurrentStyle: (target: 'A' | 'B') => (target === 'A' ? currentStyleA : currentStyleB),
  };
}
