import { BigQuery } from '@google-cloud/bigquery';
import { RequestExport, RequestExportStatus } from './type';

export default async function sendDatabase(req: RequestExport, res: RequestExportStatus) {
  const { name, metadata } = res;
  const { state, createTime, updateTime, type } = metadata;
  const { satellite, composite, geojson, date, bucket, fileNamePrefix } = req;

  const { client_email, private_key } = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

  const projectId = process.env.PROJECT_ID;

  const bq = new BigQuery({
    projectId,
    credentials: {
      client_email,
      private_key,
    },
  });

  const tableName = process.env.EXPORT_TABLE;

  const table = `${projectId}.${tableName}`;

  const createTimeFormatted = new Date(createTime).toISOString().slice(0, 19).replace('T', ' ');
  const updateTimeFormatted = new Date(updateTime).toISOString().slice(0, 19).replace('T', ' ');

  const geojsonString = JSON.stringify(geojson);

  const query = `
		INSERT INTO ${table} (operation_name, operation_state, operation_started, operation_updated, operation_type, satellite, composite, geojson, start_date, end_date, bucket, file_name_prefix)
		VALUES ('${name}', '${state}', '${createTimeFormatted}', '${updateTimeFormatted}', '${type}', '${satellite}', '${composite}', PARSE_JSON('${geojsonString}'), '${date[0]}', '${date[1]}', '${bucket}', '${fileNamePrefix}')
	`;

  await bq.query(query);
}
