import connect, {sql} from '@databases/sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = connect(path.join(__dirname, 'test.db'));

export class User {
  static async getByID(id) {
    return db.tx(async transaction => { 
      const [user] = await transaction.query(sql`SELECT * FROM "users" WHERE "id" = ${id}`);
      const logins = await transaction.query(sql`SELECT * FROM "logins" WHERE "user_id" = ${id}`);
      return user && User.fromDatabase(user, logins);
    });
  }

  static async getAllUsers() {
    return db.tx(async transaction => {
      const users = await transaction.query(sql`SELECT * FROM "users"`);
      const logins = await transaction.query(sql`SELECT * FROM "logins"`);
      return users.map(user => User.fromDatabase(user, logins.filter(login => login.user_id === user.id)));
    });
  }

  static async getIdByApiKey(apiKey) {
    return await db.query(sql`SELECT "id" FROM "users" WHERE "api_key" = ${apiKey}`).then(data => data[0]?.id);
  }

  static fromDatabase(data, logins) {
    return new User({
      id: data.id,
      apiKey: data.api_key,
      name: data.name,
      picture: data.picture,
      logins: logins.map(login => Login.fromDatabase(login))
    });
  }


  #id;
  #apiKey;
  #name;
  #picture;
  #logins;

  constructor(data) {
    this.#id = data.id;
    this.#apiKey = data.apiKey;
    this.#name = data.name;
    this.#picture = data.picture;
    this.#logins = data.logins;
    if (!this.#logins?.length) {
      throw new Error('User must have at least one login');
    }
    // Ensure all logins have the correct user id
    for (const login of this.#logins) {
      login.bindToUser(this);
    }
  }

  get id() {
    return this.#id;
  }

  get apiKey() {
    return this.#apiKey;
  }

  get name() {
    return this.#name;
  }

  get picture() {
    return this.#picture;
  }

  get logins() {
    return this.#logins;
  }

  /**
   * Fetches the user again from the database. Returns a new instance of the User.
  * @returns {Promise<User>}
  */
  async getRefreshedFromDb() {
    return await User.getByID(this.id);
  }

  async insertIntoDb() {
    return await db.tx(async transaction => {
      await transaction.query(sql`INSERT INTO "users" ("id", "api_key", "name", "picture") VALUES (${this.id}, ${this.apiKey}, ${this.name}, ${this.picture}) RETURNING "id"`).then(data => {
        this.#id = data[0].id;
      });
      for (const login of this.#logins) {
        await login.insertIntoDb(transaction, { userId: this.id });
      }
    });
  }

  updateInDb() {
    return db.tx(async transaction => {
      await transaction.query(
      sql`
        UPDATE "users" 
        SET "api_key" = ${this.apiKey}, "name" = ${this.name}, "picture" = ${this.picture}
        WHERE "id" = ${this.id}
      `);
      await transaction.query(sql`DELETE FROM "logins" WHERE "user_id" = ${this.id} and "email" not in (${sql.join(this.logins.map(l => sql.value(l.email)), ", ")})`);
      for (const login of this.#logins) {
        if (await login.emailExistsInDb(transaction)) {
          await login.updateInDbByEmail(transaction);
        } else {
          await login.insertIntoDb(transaction, { userId: this.id });
        }
      }
    });
  }

  deleteFromDb() {
    return db.tx(async transaction => {
      await transaction.query(sql`DELETE FROM "users" WHERE "id" = ${this.id}`);
      for (const login of this.#logins) {
        await login.deleteFromDb(transaction);
      }
    });
  }
}

export class Login {
  static fromDatabase(data) {
    return new Login({
      id: data.id,
      email: data.email,
      primary: data.primary === 't',
      userId: data.user_id
    });
  }

  #id;
  #email;
  #primary;
  #userId;


  constructor(data) {
    this.#id = data.id;
    this.#email = data.email;
    this.#primary = data.primary;
    this.#userId = data.userId || data.user_id;
  }

  get id() {
    return parseInt(this.#id, 10);
  }

  get userId() {
    return parseInt(this.#userId, 10);
  }

  get email() {
    return this.#email;
  }

  get primary() {
    return this.#primary;
  }

  async emailExistsInDb(transaction) {
    if (!transaction) {
      return db.tx(transaction => this.emailExistsInDb(transaction, options));
    }
    return await transaction.query(sql`SELECT 1 FROM "logins" WHERE "email" = ${this.email} AND "user_id" = ${this.userId}`).then(data => data.length);
  }

  bindToUser(user) {
    this.#userId = user.id;
  }

  async insertIntoDb(transaction, overrideData) {
    return await transaction.query(
      sql`INSERT INTO "logins" ("user_id", "email", "primary") VALUES (${this.userId || overrideData.userId}, ${this.email}, ${this.primary ? 't' : 'f'}) RETURNING "id", "user_id"`
    ).then(data => {
      this.#id = data[0].id;
      this.#userId = data[0].user_id;
    });
  }

  async updateInDbByEmail(transaction) {
    return await transaction.query(
      sql`
        UPDATE "logins" 
        SET "email" = ${this.email}, "primary" = ${this.primary ? 't' : 'f'}
        WHERE "email" = ${this.email} AND "user_id" = ${this.userId}
      `
    );
  }
  
  async deleteFromDb(transaction) {
    await transaction.query(sql`DELETE FROM "logins" WHERE "id" = ${this.id}`);
  }
}
