import connect from '@databases/sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = connect(path.join(__dirname, '..', 'test.db'));

export default db;
