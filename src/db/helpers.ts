import path from 'node:path';
import { commonDbFullV1Type } from '@map-colonies/schemas';
import config from 'config';

/**
 * Extract and build DB connection url based on configuration
 */
function dbConnectUrlFromConfig(): string {
  const dbConfig = config.get<commonDbFullV1Type>('db');
  const { username, password, host, database, port, schema, ssl } = dbConfig;

  let connectionUrl = `postgresql://${username}:${password}@${host}:${port}/${database}?schema=${schema}`;

  if (ssl.enabled) {
    // todo - calculate and implement cert generation and replacement
    const rootCaFileName = path.basename(ssl.ca);
    connectionUrl = `${connectionUrl}&sslidentity=client-identity.p12&sslcert=${rootCaFileName}`;
  }

  return connectionUrl;
}

export { dbConnectUrlFromConfig };
