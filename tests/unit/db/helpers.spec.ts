/// <reference types="jest-extended" />
/* eslint-disable @typescript-eslint/no-var-requires */
import type { commonDbFullV1Type } from '@map-colonies/schemas';
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

function createQueryParamsObject(paramsString: string) {
  const queryParamsArr = paramsString.split('&');
  const queryParamsPairs = queryParamsArr.map((params) => params.split('='));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const queryObject: object = Object.fromEntries(queryParamsPairs);
  return queryObject;
}
describe('DB helpers', () => {
  describe('#createConnectionUrl', () => {
    it('should return no ssl url string', function () {
      const validUrlWithoutSsl = createJobEntity({});
      const { database, host, password, port, schema, username } = validUrlWithoutSsl;
      const connectionUrl = createDbConnectUrl(validUrlWithoutSsl);

      const splittedByQuestionMark = connectionUrl.split('?');
      const connectionBaseUri = splittedByQuestionMark[0];
      const queryParams = splittedByQuestionMark[1];

      expect(queryParams).toEndWith(schema);
      expect(connectionBaseUri).toBe(`postgresql://${username}:${password}@${host}:${port}/${database}`);
    });

    it('should return with ssl url string', function () {
      const validUrlWithSsl = createJobEntity({ ssl: { enabled: true, ca: '/path/rootCaTest', cert: '/path/certTest', key: '/path/keyTest' } });
      const { database, host, password, port, schema, username } = validUrlWithSsl;
      const connectionUrl = createDbConnectUrl(validUrlWithSsl);

      const splittedByQuestionMark = connectionUrl.split('?');
      const connectionBaseUri = splittedByQuestionMark[0];
      const queryParams = splittedByQuestionMark[1];
      const queryParamsObject = createQueryParamsObject(queryParams);

      expect(Object.entries(queryParamsObject)).toHaveLength(3);
      expect(connectionBaseUri).toBe(`postgresql://${username}:${password}@${host}:${port}/${database}`);
      expect(queryParamsObject).toHaveProperty('schema', schema);
      expect(queryParamsObject).toHaveProperty('sslidentity');
      expect(queryParamsObject).toHaveProperty('sslcert');
    });
  });
});
