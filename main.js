/**
 * XYZ to GeoJSON Converter
 * Converts survey coordinate data (XYZ) to standard GeoJSON format
 * with proper coordinate system transformation
 */

const proj4 = require('proj4');

/**
 * Main conversion function
 * @param {string} xyzData - Multi-line string of XYZ coordinates
 * @param {string} fromProjection - Source CRS (e.g., "EPSG:32615" or PROJ.4 string)
 * @param {string} toProjection - Target CRS (typically "EPSG:4326" for WGS84)
 * @param {object} options - Optional configuration
 * @returns {object} GeoJSON FeatureCollection
 */
function xyzToGeoJSON(xyzData, fromProjection, toProjection, options = {}) {
  // Step 1: Validate inputs
  if (!xyzData || !fromProjection || !toProjection) {
    throw new Error('Missing required parameters: xyzData, fromProjection, toProjection');
  }

  // Step 2: Parse XYZ data (handle multiple formats)
  const points = parseXYZData(xyzData);
  
  // Step 3: Batch process transformations for performance
  const features = batchTransformPoints(points, fromProjection, toProjection, options);
  
  // Step 4: Return standard GeoJSON FeatureCollection
  return {
    type: 'FeatureCollection',
    features: features
  };
}

/**
 * Parse XYZ data with support for multiple formats
 * Handles: space-separated, comma-separated, tab-separated
 */
function parseXYZData(xyzData) {
  const lines = xyzData.split('\n');
  const points = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Parse coordinates (support space, comma, or tab separation)
    const coords = line.split(/[\s,\t]+/).map(Number);
    
    // Validate: must have X, Y, Z
    if (coords.length < 3 || coords.some(isNaN)) {
      console.warn(`Skipping invalid line ${i + 1}: ${line}`);
      continue;
    }
    
    points.push({
      x: coords[0],
      y: coords[1],
      z: coords[2],
      lineNumber: i + 1  // Track for debugging
    });
  }
  
  return points;
}

/**
 * Batch transform points for optimal performance
 * Process in chunks to handle large datasets efficiently
 */
function batchTransformPoints(points, fromProj, toProj, options) {
  const features = [];
  const batchSize = options.batchSize || 10000;  // Process 10k points at a time
  
  // Process in batches to manage memory for large datasets
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    
    batch.forEach(point => {
      try {
        // Horizontal transformation (X, Y → Longitude, Latitude)
        const [longitude, latitude] = proj4(fromProj, toProj, [point.x, point.y]);
        
        // Vertical transformation (Z coordinate)
        // If vertical datum transformation requested, apply geoid offset
        let elevation = point.z;
        if (options.transformVerticalDatum) {
          elevation = transformVerticalDatum(
            point.z, 
            latitude, 
            longitude, 
            options.sourceVerticalDatum,
            options.targetVerticalDatum
          );
        }
        
        // Create GeoJSON Point feature
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude, elevation]
          },
          properties: {
            originalX: point.x,
            originalY: point.y,
            originalZ: point.z,
            sourceLineNumber: point.lineNumber
          }
        });
        
      } catch (error) {
        console.error(`Error transforming point at line ${point.lineNumber}:`, error.message);
      }
    });
  }
  
  return features;
}

/**
 * Transform vertical datum (elevation/Z coordinate)
 * Converts between different vertical reference systems (e.g., NAVD88 → WGS84)
 */
function transformVerticalDatum(z, latitude, longitude, sourceVertDatum, targetVertDatum) {
  // This would integrate with geoid model lookup
  // For now, placeholder logic:
  
  if (!sourceVertDatum || !targetVertDatum) {
    return z;  // No transformation requested
  }
  
  // Example: NAVD88 to WGS84 ellipsoid height
  // Requires geoid model (e.g., GEOID18) to get offset
  if (sourceVertDatum === 'NAVD88' && targetVertDatum === 'WGS84') {
    const geoidOffset = getGeoidOffset(latitude, longitude);  // Would use actual geoid grid
    return z + geoidOffset;
  }
  
  // Add other datum transformations as needed
  return z;
}

/**
 * Get geoid offset from geoid model
 * (Would integrate with actual GEOID18/EGM96 grid data)
 */
function getGeoidOffset(latitude, longitude) {
  // Placeholder - would look up actual geoid model
  // This requires loading geoid grid files (e.g., from NOAA)
  // and interpolating offset value for given lat/lon
  return 0;  // Temporary - real implementation would return actual offset
}

// Example usage:
const xyzData = `
440287.50 4431748.25 125.3
440291.20 4431752.80 126.1
440295.10 4431757.50 124.8
`;

const geojson = xyzToGeoJSON(
  xyzData,
  'EPSG:32615',  // UTM Zone 15N
  'EPSG:4326',   // WGS84 (standard GPS)
  {
    transformVerticalDatum: true,
    sourceVerticalDatum: 'NAVD88',
    targetVerticalDatum: 'WGS84',
    batchSize: 10000
  }
);

console.log(JSON.stringify(geojson, null, 2));

module.exports = { xyzToGeoJSON };