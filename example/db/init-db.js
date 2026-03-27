import fs from 'node:fs/promises';
import path from 'node:path';

import db from './connection.js';
import { sql } from '@databases/sqlite';
import splitSqlQuery from '@databases/split-sql-query'

const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function runSqlFile(transaction, filePath) {
  // We split the queries in the file to run them one by one
  // This is a known limitation of sqlite3, it does not support multiple queries in one call:
  // https://github.com/ForbesLindesay/atdatabases/issues/90
  for (const query of splitSqlQuery(sql.file(filePath))) {
    await transaction.query(query);
  }
}

export async function initDb() {
  const structureSql = path.resolve(__dirname, './assets/structure.sql');
  const dataSql = path.resolve(__dirname, './assets/data.sql');

  return db.tx(async transaction => {
    console.info('⚙️ Creating tables...');
    await runSqlFile(transaction, structureSql);
    console.info('⚙️ Inserting data...');
    await runSqlFile(transaction, dataSql);
    console.info('✅ Database initialized\n');
  }).catch(err => {
    console.error('❌ Error initializing database:', err.stack);
    process.exit(1);
  });
}
