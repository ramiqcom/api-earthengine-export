import ee from '@google/earthengine';
import { MapId, VisObject } from '../module/type';

/**
 * Function to authenticate EE
 * @param key JSON string of Google Service Account private key
 * @returns
 */
export function authenticate(key: string): Promise<void> {
  const parsed = JSON.parse(key);
  return new Promise((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(
      parsed,
      () =>
        ee.initialize(
          null,
          null,
          () => resolve(),
          (error: string) => reject(new Error(error)),
        ),
      (error: string) => reject(new Error(error)),
    );
  });
}

/**
 * Function evaluate ee object to readable object
 * @param element Any earth engine class that can be evaluated
 * @returns Any type of data possible, could be string, number, array, or record
 */
export function evaluate(element: ee<any>): Promise<any> {
  return new Promise((resolve, reject) => {
    element.evaluate((data: any, error: any) => (error ? reject(new Error(error)) : resolve(data)));
  });
}

/**
 * Function to get tile url from ee object
 * @param data Earth engine image or feature that wanted to be visualize
 * @param vis Visualization parameter to visualize the image
 * @returns Record related to earth engine image
 */
export function getMapId(
  data: ee.Image | ee.ImageCollection | ee.FeatureCollection | ee.Geometry,
  vis: VisObject | {},
): Promise<MapId> {
  return new Promise((resolve, reject) => {
    data.getMapId(vis, (object: MapId, error: string) =>
      error ? reject(new Error(error)) : resolve(object),
    );
  });
}
