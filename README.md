# XYZ to GeoJSON Converter - Proof of Concept

A Node.js function that converts survey coordinate data (XYZ format) to standard GeoJSON FeatureCollection with coordinate system transformation using proj4js.

## Quick Start
```bash
npm install
node main.js
```

## What This Demonstrates

- **Parsing**: Handles space/comma/tab-separated XYZ data
- **Transformation**: Uses proj4js for coordinate system conversion
- **Output**: Standard GeoJSON FeatureCollection format
- **Robustness**: Error handling, validation, preserves source data

## Example

**Input (XYZ - UTM Zone 15N):**
```
440287.50 4431748.25 125.3
440291.20 4431752.80 126.1
440295.10 4431757.50 124.8
```

**Output (GeoJSON - WGS84):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-93.699, 40.033, 125.3]
      }
    }
  ]
}
```

## Technical Approach

### Core Function
```javascript
xyzToGeoJSON(xyzData, fromProjection, toProjection, options)
```

### Architecture
1. **Parse**: Multi-format support (space, comma, tab delimiters)
2. **Validate**: Skip invalid lines with warnings
3. **Transform**: Batch process using proj4js
4. **Output**: Standard GeoJSON with source data preservation

### Performance Features
- Batch processing for large datasets (configurable chunk size)
- Memory-efficient streaming approach
- Error handling per point (doesn't fail entire dataset)

## Next Steps for Production

- [ ] Vertical datum transformation (NAVD88 → WGS84 using geoid models)
- [ ] Support for additional CRS formats (PROJ.4 strings, WKT)
- [ ] Performance optimization for million+ point datasets
- [ ] Comprehensive test suite
- [ ] CLI interface for batch file processing
