import ee from '@google/earthengine';
import { MapId, RequestExportStatus, VisObject } from './type';

/**
 * Function to authenticate EE
 * @param key JSON string of Google Service Account private key
 * @returns
 */
export function authenticate(key: Object): Promise<void> {
  return new Promise((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(
      key,
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

/**
 * Function to start export
 * @param task Export task object
 */
export async function startExport(task: ee.batch): Promise<void> {
  return new Promise((resolve, reject) => {
    task.start(
      () => resolve(),
      (err: string) => reject(new Error(err)),
    );
  });
}

/**
 * Function to get metadata of export
 * @returns Record of the task
 */
export async function exportMetadata(): Promise<RequestExportStatus> {
  return new Promise((resolve, reject) => {
    ee.data.listOperations(1, (data: Record<string, any>[], err: string) =>
      data ? resolve(data[0].Serializable$values) : reject(new Error(err)),
    );
  });
}

/**
 * Function to cancel operation when error
 */
export async function cancelExport(operationName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ee.data.cancelOperation(operationName, (data: undefined, err: string) =>
      err ? reject(new Error(err)) : resolve(),
    );
  });
}

/**
 * Function to get export metadata per operation
 */
export async function getOperation(name: string): Promise<RequestExportStatus> {
  return new Promise((resolve, reject) => {
    ee.data.getOperation(name, (data: Record<string, any>, err: string) =>
      err ? reject(new Error(err)) : resolve(data.Serializable$values),
    );
  });
}
