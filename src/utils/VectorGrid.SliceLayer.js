import L from 'leaflet';
import 'leaflet.vectorGrid/src/Leaflet.VectorGrid';
import geojsonvt from 'geojson-vt';

L.VectorGrid.SliceLayer = L.VectorGrid.extend({
  options: {
    // 🍂section
    // Additionally to these options, `VectorGrid.Slicer` can take in any
    // of the [`geojson-vt` options](https://github.com/mapbox/geojson-vt#options).

    // 🍂option vectorTileLayerName: String = 'sliced'
    // Vector tiles contain a set of *data layers*, and those data layers
    // contain features. Thus, the slicer creates one data layer, with
    // the name given in this option. This is important for symbolizing the data.
    vectorTileLayerName: 'sliced',

    extent: 4096, // Default for geojson-vt
    maxZoom: 14, // Default for geojson-vt
  },

  initialize(options) {
    L.VectorGrid.prototype.initialize.call(this, options);
  },

  setGeoJson(geojson) {
    // Create a shallow copy of this.options, excluding things that might
    // be functions - we only care about topojson/geojsonvt options
    const options = {};
    for (const i in this.options) {
      if (
        i !== 'rendererFactory' &&
        i !== 'vectorTileLayerStyles' &&
        typeof this.options[i] !== 'function'
      ) {
        options[i] = this.options[i];
      }
    }

    this.tileIndex = geojsonvt(geojson, options);
  },

  _getVectorTilePromise(coords) {
    const me = this;
    const p = new Promise(resolve => {
      if (me.tileIndex && coords) {
        const { x, y, z } = coords;
        const { features } = me.tileIndex.getTile(z, x, y) || {};
        if (features) {
          const layers = {};
          const newFeatures = features.map(feature => {
            return {
              geometry: feature.geometry,
              properties: feature.tags,
              type: feature.type,
            };
          });
          const layer = {
            extent: me.options.extent,
            features: newFeatures,
          };
          layers[me.options.vectorTileLayerName] = layer;
          resolve({ layers });
        }
      }
    });

    return p;
  },
});

L.vectorGrid.sliceLayer = function(geojson, options) {
  return new L.VectorGrid.SliceLayer(geojson, options);
};
