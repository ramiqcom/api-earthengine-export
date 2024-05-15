import ee from '@google/earthengine';
import collection from '../data/collection.json' assert { type: 'json' };
import { CompositeParameter } from './type';

/**
 * Function that accept image composite request and output an ee.Image
 * @param body
 */
export default function compositeImage(body: CompositeParameter): {
  image: ee.Image;
  resolution: number;
} {
  const { geometry, date, satellite, composite } = body;

  // Validation for satellite id
  if (!collection[satellite]) {
    throw new Error(
      `Satellite id '${satellite}' is not available. The only satellite id available area 'sentinel-2' and 'landsat'`,
    );
  }

  // Date
  const [start, end] = date;

  // Validation for date
  if (new Date(start).getTime() > new Date(end).getTime()) {
    throw new Error(
      `End date ${end} is earlier than start date ${start}. End date should be later`,
    );
  }

  // Validation for composite
  if (composite != 'cloudless' && composite != 'latest' && composite != 'median') {
    throw new Error(
      `Composite type '${composite}' is not available. Use composite 'cloudless', 'latest', or 'median' instead`,
    );
  }

  // Create an ee.Geometry
  const bounds: ee.Geometry = ee.Geometry(geometry);

  // Satellite data
  const { ids, bands, multiplier, offset, cloud, resolution, cloud_col } = collection[satellite];

  // Bands ori
  const bandsCon = Object.keys(bands);
  const bandsOri = Object.values(bands);

  // Filter collection
  let col: ee.ImageCollection;

  if (ids.length > 1) {
    col = ee.ImageCollection(
      ee
        .FeatureCollection(
          ids.map((id) => ee.ImageCollection(id).filterBounds(bounds).filterDate(start, end)),
        )
        .flatten(),
    );
  } else {
    col = ee.ImageCollection(ids[0]).filterBounds(bounds).filterDate(start, end);
  }

  // Image
  let image: ee.Image;

  // Cloud mask
  if (composite == 'median') {
    // Dictionary of all cloud mask function
    const cloudMaskingProp = {
      landsat: cloudMaskLandsat,
      'sentinel-2': cloudMaskS2,
    };

    if (satellite == 'sentinel-2') {
      const cloudCol = ee.ImageCollection(cloud_col).filterBounds(bounds).filterDate(start, end);
      col = col.linkCollection(cloudCol, 'cs');
    }

    // Get the cloud mask function
    const cloudMask = cloudMaskingProp[satellite];

    // If cloud mask function exist do cloud mask
    if (cloudMask) {
      image = col
        .map((image: ee.Image) => cloudMask(image, [bandsOri, bandsCon], multiplier, offset))
        .median();
    } else {
      image = col.median().select(bandsOri, bandsCon).multiply(multiplier).add(offset);
    }
  } else {
    // Property to filter
    let property: string;
    let sort: boolean;

    if (composite == 'cloudless') {
      property = cloud;
      sort = true;
    } else {
      property = 'system:time_start';
      sort = false;
    }

    image = col
      .sort(property, sort)
      .first()
      .select(bandsOri, bandsCon)
      .multiply(multiplier)
      .add(offset);
  }

  // Clip the image
  image = image.clip(bounds).toFloat();

  // Return the image
  return { image, resolution };
}

/**
 * Function to cloud masking image in landsat collection
 * @param image
 * @param bands
 * @param multiplier
 * @param offset
 * @returns
 */
function cloudMaskLandsat(
  image: ee.Image,
  bands: [string[], string[]],
  multiplier: number,
  offset: number,
): ee.Image {
  const qa: ee.Image = image.select('QA_PIXEL');
  const dilated = 1 << 1;
  const cirrus = 1 << 2;
  const cloud = 1 << 3;
  const shadow = 1 << 4;
  const mask: ee.Image = qa
    .bitwiseAnd(dilated)
    .eq(0)
    .and(qa.bitwiseAnd(cirrus).eq(0))
    .and(qa.bitwiseAnd(cloud).eq(0))
    .and(qa.bitwiseAnd(shadow).eq(0));

  return image.select(bands[0], bands[1]).updateMask(mask).multiply(multiplier).add(offset);
}

/**
 * Function to cloud mas
 * @param image
 * @param bands
 * @param multiplier
 * @param offset
 * @returns
 */
function cloudMaskS2(
  image: ee.Image,
  bands: [string[], string[]],
  multiplier: number,
  offset: number,
): ee.Image {
  const mask = image.select('cs').gt(0.6);
  return image.select(bands[0], bands[1]).updateMask(mask).multiply(multiplier).add(offset);
}
