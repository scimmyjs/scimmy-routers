import { sql } from '@databases/sqlite';

import db from './connection.js';

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

  /**
   * Checks if the email exists in the database.
   */
  async emailExistsInDb(transaction) {
    if (!transaction) {
      return db.tx(transaction => this.emailExistsInDb(transaction, options));
    }
    return await transaction.query(sql`SELECT 1 FROM "logins" WHERE "email" = ${this.email} AND "user_id" = ${this.userId}`).then(data => data.length);
  }

  /**
   * Binds this login to a user 
   */
  bindToUser(user) {
    this.#userId = user.id;
  }

  /**
   * Inserts this login into the database.
   *
   * @param {import('@databases/sqlite').Transaction} transaction The transaction to use 
   * @param {Object} overrideData Use overrideData if you want to change the userId
   * @returns {Promise<void>}
   */
  async insertIntoDb(transaction, overrideData = {}) {
    return await transaction.query(
      sql`INSERT INTO "logins" ("user_id", "email", "primary") VALUES (${overrideData.userId || this.userId}, ${this.email}, ${this.primary ? 't' : 'f'}) RETURNING "id", "user_id"`
    ).then(data => {
      this.#id = data[0].id;
      this.#userId = data[0].user_id;
    });
  }

  /**
   * Updates the login based on the email in the database and the user_id.
   * (currently only updates the primary field)
   *
   * @param {import('@databases/sqlite').Transaction} transaction The transaction to use
   * @returns {Promise<void>}
   */
  async updateInDbByEmail(transaction) {
    return await transaction.query(
      sql`
        UPDATE "logins" 
        SET "primary" = ${this.primary ? 't' : 'f'}
        WHERE "email" = ${this.email} AND "user_id" = ${this.userId}
      `
    );
  }
  
  /** 
   * Deletes the login from the database.
   *
   * @param {import('@databases/sqlite').Transaction} transaction The transaction to use
   * @returns {Promise<voir>}
   */
  async deleteFromDb(transaction) {
    await transaction.query(sql`DELETE FROM "logins" WHERE "id" = ${this.id}`);
  }
}

