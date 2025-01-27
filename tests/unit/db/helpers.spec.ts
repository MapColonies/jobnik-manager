/* eslint-disable @typescript-eslint/no-var-requires */
import { commonDbFullV1Type } from '@map-colonies/schemas';
import { createDbConnectUrl } from '@src/db/helpers';

function createJobEntity(override: Partial<commonDbFullV1Type>) {
  const dbParams = {
    host: 'some_test_host',
    port: 1234,
    username: 'some_postgres_test_name',
    password: 'some_postgres_test_password',
    ssl: {
      enabled: false,
    },
    database: 'some_test_db',
    schema: 'some_test_schema',
  } satisfies commonDbFullV1Type;
  return { ...dbParams, ...override };
}
describe('DB helpers', () => {
  describe('#createConnectionUrl', () => {
    it('should return no ssl url string', function () {
      const validUrlWithoutSsl = createJobEntity({});
      const { database, host, password, port, schema, username } = validUrlWithoutSsl;
      const connectionUrl = createDbConnectUrl(validUrlWithoutSsl);

      const expectedResult = `postgresql://${username}:${password}@${host}:${port}/${database}?schema=${schema}`;

      expect(connectionUrl).toContain(expectedResult);
      expect(connectionUrl).not.toContain('sslcert');
    });

    it('should return with ssl url string', function () {
      const validUrlWithoutSsl = createJobEntity({ ssl: { enabled: true, ca: '/path/rootCaTest', cert: '/path/certTest', key: '/path/keyTest' } });
      const { database, host, password, port, schema, username } = validUrlWithoutSsl;
      const connectionUrl = createDbConnectUrl(validUrlWithoutSsl);

      const expectedResult = `postgresql://${username}:${password}@${host}:${port}/${database}?schema=${schema}`;
      expect(connectionUrl).toContain(expectedResult);
      expect(connectionUrl).toContain('sslcert');
      expect(connectionUrl).toContain('sslidentity');
    });
  });
});
