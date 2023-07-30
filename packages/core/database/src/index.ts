import type { Knex } from 'knex';

import { Dialect, getDialect } from './dialects';
import { createSchemaProvider } from './schema';
import { createMetadata } from './metadata';
import { createEntityManager } from './entity-manager';
import { createMigrationsProvider } from './migrations';
import { createLifecyclesProvider } from './lifecycles';
import { createConnection } from './connection';
import * as errors from './errors';
import { transactionCtx } from './transaction-context';

// TODO: move back into strapi
import { transformContentTypes } from './utils/content-types';
import { validateDatabase } from './validations';

interface Settings {
  forceMigration?: boolean;
  runMigrations?: boolean;
  [key: string]: unknown;
}

export interface DatabaseConfig {
  connection: Knex.Config;
  settings?: Settings;
  models: any;
}

class Database {
  connection: Knex;

  dialect: Dialect;

  config: DatabaseConfig;

  metadata: any;

  schema: any;

  migrations: any;

  lifecycles: any;

  entityManager: any;

  constructor(config: DatabaseConfig) {
    this.metadata = createMetadata(config.models);

    this.config = {
      settings: {
        forceMigration: true,
        runMigrations: true,
        ...config.settings,
      },
      ...config,
    };

    this.dialect = getDialect(this);
    this.dialect.configure();

    this.connection = createConnection(this.config.connection);

    this.dialect.initialize();

    this.schema = createSchemaProvider(this);

    this.migrations = createMigrationsProvider(this);
    this.lifecycles = createLifecyclesProvider(this);

    this.entityManager = createEntityManager(this);
  }

  query(uid) {
    if (!this.metadata.has(uid)) {
      throw new Error(`Model ${uid} not found`);
    }

    return this.entityManager.getRepository(uid);
  }

  inTransaction() {
    return !!transactionCtx.get();
  }

  async transaction(cb?: unknown) {
    const notNestedTransaction = !transactionCtx.get();
    const trx = notNestedTransaction ? await this.connection.transaction() : transactionCtx.get();

    async function commit() {
      if (notNestedTransaction) {
        await transactionCtx.commit(trx);
      }
    }

    async function rollback() {
      if (notNestedTransaction) {
        await transactionCtx.rollback(trx);
      }
    }

    if (!cb) {
      return { commit, rollback, get: () => trx };
    }

    return transactionCtx.run(trx, async () => {
      try {
        const callbackParams = {
          trx,
          commit,
          rollback,
          onCommit: transactionCtx.onCommit,
          onRollback: transactionCtx.onRollback,
        };
        const res = await cb(callbackParams);
        await commit();
        return res;
      } catch (error) {
        await rollback();
        throw error;
      }
    });
  }

  getSchemaName() {
    return this.connection.client.connectionSettings.schema;
  }

  getConnection(tableName?: string) {
    const schema = this.getSchemaName();
    const connection = tableName ? this.connection(tableName) : this.connection;
    return schema ? connection.withSchema(schema) : connection;
  }

  getSchemaConnection(trx = this.connection) {
    const schema = this.getSchemaName();
    return schema ? trx.schema.withSchema(schema) : trx.schema;
  }

  queryBuilder(uid: string) {
    return this.entityManager.createQueryBuilder(uid);
  }

  async destroy() {
    await this.lifecycles.clear();
    await this.connection.destroy();
  }
}

// TODO: move into strapi
Database.transformContentTypes = transformContentTypes;
Database.init = async (config) => {
  const db = new Database(config);
  await validateDatabase(db);
  return db;
};

export { Database, errors };
