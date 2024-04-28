# api-earthengine-export

## API to view Google Earth Engine analysis result and export it

### Instruction to use

1. Clone the repository
2. Run `npm install` to install packages dependency
3. Change `.env.example` file name to `.env` to use `process.env` variable
4. Change the value of `SERVICE_ACCOUNT_KEY` in `env` to your Google Cloud Platform service account key to authenticate Google Earth Engine
5. Change the value of `PROJECT_ID` in `env` to your Google Cloud Platform project id
6. Change the value of `EXPORT_TABLE` in `env` to your SQL table address
7. Change the value of `GOOGLE_MAPS_API_KEY` in `env` to your Google Maps API key
8. Run `npm start` to start the server

### Route list

| Route path        | Description                                                     | Request body (JSON)                                                                       | Response body (JSON)   |
| ----------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------- |
| `/view`           | Route to get URL to view analysis in web map                    | `{ geojson, visualization, satellite, composite, date }`                                  | `{ url, vis }`         |
| `/export/geotiff` | Route to export the request as GeoTIFF in Google Cloud Storage  | `{ geojson, satellite, composite, date, bucket, fileNamePrefix }`                         | `EarthEngineOperation` |
| `/export/tile`    | Route to export the request as tile map in Google Cloud Storage | `{ geojson, satellite, composite, date, visualization, bucket, fileNamePrefix, maxZoom }` | `EarthEngineOperation` |

### Type definition

| Type id        | Data type                   | Description                                                                                | Value list or example                                                                                                                                           |
| -------------- | --------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| geojson        | `GeoJSON.FeatureCollection` | GeoJSON data in type feature collection                                                    |                                                                                                                                                                 |
| visualization  | `string`                    | String value of visualization option for viewing                                           | "standard_false_color", "enhanced_true_color", "agriculture_false_color", "infrared_false_color", "ndvi", "savi", "evi", "ndwi", "mndwi", "ndmi", "nbr", "nbr2" |
| satellite      | `string`                    | Id of the satellite to use                                                                 | "sentinel-2", "landsat"                                                                                                                                         |
| composite      | `string`                    | Type of composite to use to get the image                                                  | "latest", "cloudless", "median"                                                                                                                                 |
| date           | `string[]`                  | List of couple of string date in YYYY-MM-dd format for start and end date to get the image | `["2023-01-01", "2023-12-31"]`                                                                                                                                  |
| bucket         | `string`                    | Name of the bucket to export in Google Cloud Storage                                       | "bucket-01"                                                                                                                                                     |
| fileNamePrefix | `string`                    | File path and name in the bucket to put the exported result                                | "project_abc/data/data_sentinel_new"                                                                                                                            |
| maxZoom        | `number`                    | Maximum zoom level of the tile map from 0 to 24                                            | 16                                                                                                                                                              |
