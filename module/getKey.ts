export default async function getKey(): Promise<Record<string, any>> {
  const key = await fetch(process.env.SERVICE_ACCOUNT_KEY_URL, {
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`,
    },
  });
  const json = await key.json();
  return json;
}
