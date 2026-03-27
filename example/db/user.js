import { sql } from '@databases/sqlite';

import { Login } from './login.js';
import db from './connection.js';

export class User {
  /**
   * Fetches a user from the database by its id with their associated logins. Returns null if the user does not exist.
   * @param {number} id
   * @returns {Promise<User>}
   */
  static async getByID(id) {
    return db.tx(async transaction => { 
      const [user] = await transaction.query(sql`SELECT * FROM "users" WHERE "id" = ${id}`);
      const logins = await transaction.query(sql`SELECT * FROM "logins" WHERE "user_id" = ${id}`);
      return user && User.fromDatabase(user, logins);
    });
  }

  /**
   * Fetches all users from the database with their associated logins.
   *
   * @returns {Promise<User[]>}
   */
  static async getAllUsers() {
    return db.tx(async transaction => {
      const users = await transaction.query(sql`SELECT * FROM "users"`);
      const logins = await transaction.query(sql`SELECT * FROM "logins"`);
      return users.map(user => User.fromDatabase(user, logins.filter(login => login.user_id === user.id)));
    });
  }

  /**
   * Fetches a user from the database by their API key. Returns null if the user does not exist.
   * @param {string} apiKey 
   * @returns {Promise<User>}
   */
  static async getIdByApiKey(apiKey) {
    return await db.query(sql`SELECT "id" FROM "users" WHERE "api_key" = ${apiKey}`).then(data => data[0]?.id);
  }

  /**
   * Deserializes a user from the database data and their associated logins.
   * @param {Object} data The user data from the database
   * @param {Object[]} logins
   * @returns {User}
   */
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

  /**
   * Inserts the user into the database. Returns the user with the new id.
   * @returns {Promise<User>}
   */
  async insertIntoDb() {
    return await db.tx(async transaction => {
      await transaction.query(sql`INSERT INTO "users" ("id", "api_key", "name", "picture") VALUES (${this.id}, ${this.apiKey}, ${this.name}, ${this.picture}) RETURNING "id"`).then(data => {
        this.#id = data[0].id;
      });
      for (const login of this.#logins) {
        await login.insertIntoDb(transaction, { userId: this.id });
      }
      return this;
    });
  }

  /**
   * Updates the user in the database.
   *
   * @returns {Promise<void>}
   */
  updateInDb() {
    return db.tx(async transaction => {
      await transaction.query(
      sql`
        UPDATE "users" 
        SET "api_key" = ${this.apiKey}, "name" = ${this.name}, "picture" = ${this.picture}
        WHERE "id" = ${this.id}
      `);
      // Delete logins that are not in the new logins
      await transaction.query(sql`DELETE FROM "logins" WHERE "user_id" = ${this.id} and "email" not in (${sql.join(this.logins.map(l => sql.value(l.email)), ", ")})`);
      for (const login of this.#logins) {
        // Update or insert each login. If the email already exists, update it, otherwise insert it.
        if (await login.emailExistsInDb(transaction)) {
          await login.updateInDbByEmail(transaction);
        } else {
          await login.insertIntoDb(transaction, { userId: this.id });
        }
      }
    });
  }

  /**
   * Deletes the user from the database.
   *
   * @returns {Promise<void>}
   */
  deleteFromDb() {
    return db.tx(async transaction => {
      await transaction.query(sql`DELETE FROM "users" WHERE "id" = ${this.id}`);
      for (const login of this.#logins) {
        await login.deleteFromDb(transaction);
      }
    });
  }
}

