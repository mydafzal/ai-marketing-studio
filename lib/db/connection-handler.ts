import {createClient, QueryResult} from '@vercel/postgres';

export async function queryDB(query: string, values: any[]) {
  const client = createClient();
  await client.connect();

  try {
    const result = await client.query(query, values);
  } catch (err) {
    console.log('err', err);
  } finally {
    await client.end();
  }
}

export async function queryDBResult(
  query: string,
  values: any[]
): Promise<QueryResult<any> | undefined> {
  const client = createClient();
  await client.connect();

  try {
    const result = await client.query(query, values);
    return result;
  } catch (err) {
    console.log('err', err);
  } finally {
    await client.end();
  }
}