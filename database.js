/** @typedef {Map<string, string>} Record */
/** @typedef {Map<string, Record>} Table */

class Database {
  /** @type {Table} */
  tables = new Map();

  /**
   * @param {string} tableName
   * @param {string} key
   */
  get(tableName, key) {
    const table = this.tables.get(tableName);

    if (!table) {
      return null;
    }

    return table.get(key);
  }

  /**
   * @param {string} tableName
   * @param {string} key
   * @param {string} value
   */
  set(tableName, key, value) {
    const table = this.tables.get(tableName);

    if (!table) {
      this.tables.set(tableName, new Map([[key, value]]));
    } else {
      table.set(key, value);
    }

    this.vacuum(tableName);
  }

  /**
   * @param {string} tableName
   */
  vacuum(tableName) {
    const table = this.tables.get(tableName);

    if (!table) {
      return;
    }

    // If the map has more than 10 entries, remove all but the 10 most recent.
    if (table.size > 10) {
      table.delete(...Array.from(table.keys()).slice(-10));
    }
  }
}

module.exports = { Database };
