import { BigQuery } from '@google-cloud/bigquery';
import { cancelExport, exportMetadata, getOperation } from './ee';
import getKey from './getKey';
import { RequestExport, RequestExportStatus } from './type';

async function bqClient() {
  const projectId = process.env.PROJECT_ID;

  // Key
  const key = await getKey();

  const { client_email, private_key } = key;

  return new BigQuery({
    projectId,
    credentials: {
      client_email,
      private_key,
    },
  });
}

function tableName() {
  const projectId = process.env.PROJECT_ID;
  const tableName = process.env.EXPORT_TABLE;
  return `${projectId}.${tableName}`;
}

function parseDate(date: Date) {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

export async function getDatabase() {
  const bq = await bqClient();
  const table = tableName();
  const [result] = await bq.query(`SELECT * FROM ${table}`);
  return result;
}

export async function sendDatabase(req: RequestExport, res: RequestExportStatus) {
  try {
    const { name, metadata } = res;
    const { state, createTime, updateTime, type } = metadata;
    const { satellite, composite, geojson, date, bucket, fileNamePrefix } = req;

    const bq = await bqClient();
    const table = tableName();

    const createTimeFormatted = parseDate(new Date(createTime));
    const updateTimeFormatted = parseDate(new Date(updateTime));

    const geojsonString = JSON.stringify(geojson);

    const query = `
		INSERT INTO ${table} (operation_name, operation_state, operation_started, operation_updated, operation_type, satellite, composite, geojson, start_date, end_date, bucket, file_name_prefix)
		VALUES ('${name}', '${state}', '${createTimeFormatted}', '${updateTimeFormatted}', '${type}', '${satellite}', '${composite}', PARSE_JSON('${geojsonString}'), '${date[0]}', '${date[1]}', '${bucket}', '${fileNamePrefix}')
	`;

    await bq.query(query);
  } catch ({ message }) {
    // Cancel operation when error
    const { name } = await exportMetadata();
    await cancelExport(name);

    throw new Error(message);
  }
}

export async function updateDatabase() {
  const bq = await bqClient();
  const table = tableName();
  const [result] = await bq.query(
    `SELECT operation_name FROM ${table} WHERE (operation_state LIKE '%ING')`,
  );

  if (!result.length) {
    return 'Nothing to update';
  }

  // Check status
  result.map(async (obj) => {
    const { operation_name } = obj;
    const { metadata, error } = await getOperation(operation_name);
    const { updateTime, state, destinationUris, batchEecuUsageSeconds } = metadata;

    const updateTimeFormatted = parseDate(new Date(updateTime));

    const url = destinationUris ? `'${destinationUris[0]}'` : null;
    const errorMessage = error ? `'${error.message}'` : null;
    const eecu = batchEecuUsageSeconds ? batchEecuUsageSeconds : null;

    await bq.query(`
			UPDATE ${table}
			SET operation_state='${state}', operation_updated='${updateTimeFormatted}', result_url=${url}, error_message=${errorMessage}, eecu=${eecu}
			WHERE operation_name='${operation_name}'
		`);
  });

  return 'update_success';
}
