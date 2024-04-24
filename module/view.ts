import ee from '@google/earthengine';
import collection from '../data/collection.json' assert { type: 'json' };
import visParam from '../data/indices.json' assert { type: 'json' };
import { evaluate, getMapId } from './ee';
import { satellite, VisObject } from './type';

/**
 * Function to generate xyz tile
 * @param image
 * @param vis
 */
export default async function view(image: ee.Image, vis: string, satellite: satellite) {
  const { indices, bands: bandNames, resolution } = collection[satellite];

  // Check if visualiation is available
  if (indices.filter((x) => x === vis).length) {
    throw new Error(`Visualization ${vis} is not available in satellite ${satellite}`);
  }

  // Bands list
  const bandsNameList: [string, ee.Image][] = Object.keys(bandNames).map((band) => [
    band,
    image.select(band),
  ]);

  // Bands map for indices
  const bandMap: Record<string, ee.Image> = Object.fromEntries(bandsNameList);

  // Vis parameter data from json
  const {
    bands,
    type,
    formula,
    palette,
  }: { bands: string[]; type: string; formula?: string; palette?: string[] } = visParam[vis];

  if (type == 'indices') {
    image = image.expression(formula, bandMap);
  }

  // Visualization parameter
  const visData = await stretch(image, bands, resolution, palette);

  // URL data
  const { urlFormat } = await getMapId(image, visData);

  // Return url with vis
  return {
    url: urlFormat,
    vis: visData,
  };
}

async function stretch(
  image: ee.Image,
  bands: string[],
  resolution: number,
  palette?: string[],
): Promise<VisObject> {
  const geometry: ee.Geometry = image.geometry();
  const percentile: ee.Dictionary = image.select(bands).reduceRegion({
    scale: 300,
    geometry,
    maxPixels: 1e13,
    reducer: ee.Reducer.percentile([1, 99]),
  });

  const min: ee.List<ee.Number> = ee.List(
    bands.map((band) => ee.Number(percentile.get(`${band}_p1`))),
  );
  const max: ee.List<ee.Number> = ee.List(
    bands.map((band) => ee.Number(percentile.get(`${band}_p99`))),
  );

  const vis: ee.Dictionary<VisObject> = ee.Dictionary({
    min,
    max,
    bands,
    palette: palette || null,
  });

  const evaluatedVis: VisObject = await evaluate(vis);

  return evaluatedVis;
}
