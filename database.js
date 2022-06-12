/** @typedef {{key: string, value: any, author: string, date: Date}} Row */
/** @typedef {Map<string, Row>} Table */
/** @typedef {Map<string, Table>} Schema */

/** How long before we should vacuum a table? */
const MAX_DUST = 100;
/** TTL for a record */
const MAX_AGE = 1000 * 60 * 60 * 24 * 1;
/** How many writes should an author be limited to */
const MAX_WRITES = 10;

class Database {
  /** @type {Schema} */
  schema = new Map();
  /** Time left before vacuuming */
  dust = 0;
  /**
   * Record of all fields written by author
   * @type {Map<string, {table: string, key: string}[]>}
   */
  authorIndex = new Map();

  /**
   * @param {string} tableName
   * @param {string} key
   */
  get(tableName, key) {
    const table = this.schema.get(tableName);

    if (!table) {
      return null;
    }

    return table.get(key);
  }

  /**
   * @param {string} tableName
   * @param {string} key
   * @param {string} value
   * @param {string} author
   */
  set(tableName, key, value, author) {
    const table = this.schema.get(tableName) || new Map();

    if (!this.schema.has(tableName)) {
      this.schema.set(tableName, table);
    }

    table.set(key, {
      key,
      value,
      author,
      date: new Date(),
    });
    ++this.dust;

    const history = this.authorIndex.get(author) || [];

    if (!this.authorIndex.has(author)) {
      this.authorIndex.set(author, history);
    }

    history.push({ table: tableName, key });

    if (this.dust > MAX_DUST) {
      this.vacuum();
    }
  }

  vacuum() {
    // Go through all tables and remove all rows that are older than MAX_AGE
    this.schema.forEach((table, tableName) => {
      table.forEach((row, key) => {
        if (row.date.getTime() + MAX_AGE < new Date().getTime()) {
          table.delete(key);
        }
      });
    });

    // Prune author writes
    this.authorIndex.forEach((history, author) => {
      // Remove and capture all but the last MAX_WRITES writes
      const writes = history.splice(0, history.length - MAX_WRITES);
      // Remove all but the last MAX_WRITES writes from the table
      writes.forEach(({ table, key }) => {
        this.schema.get(table)?.delete(key);
      });
    });
  }
}

module.exports = { Database };
