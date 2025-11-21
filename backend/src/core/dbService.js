const pool = require("./db");

/**
 * Generic SELECT
 * options = {
 *   table: string,
 *   where?: { [col]: value },
 *   fields?: string[],
 *   limit?: number,
 *   offset?: number,
 *   orderBy?: string  // e.g. "created_at DESC"
 * }
 */
async function find(options) {
  const { table, where = {}, fields = ["*"], limit, offset, orderBy } = options;

  let sql = `SELECT ${fields.join(", ")} FROM \`${table}\``;
  const values = [];

  const whereKeys = Object.keys(where);
  if (whereKeys.length > 0) {
    const conditions = whereKeys.map((key) => {
      values.push(where[key]);
      return `\`${key}\` = ?`;
    });
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }

  if (limit != null) {
    sql += ` LIMIT ?`;
    values.push(limit);
    if (offset != null) {
      sql += ` OFFSET ?`;
      values.push(offset);
    }
  }

  const [rows] = await pool.query(sql, values);
  return rows;
}

/**
 * Generic INSERT
 * data = { col: value, ... }
 */
async function insert(table, data) {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(", ");

  const sql = `
    INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(", ")})
    VALUES (${placeholders})
  `;

  const values = keys.map((k) => data[k]);
  const [result] = await pool.query(sql, values);
  return result;
}

/**
 * Generic UPDATE
 * where = { col: value, ... }  (AND conditions)
 */
async function update(table, data, where) {
  const dataKeys = Object.keys(data);
  const whereKeys = Object.keys(where);

  const setPart = dataKeys.map((k) => `\`${k}\` = ?`).join(", ");
  const wherePart = whereKeys.map((k) => `\`${k}\` = ?`).join(" AND ");

  const sql = `
    UPDATE \`${table}\`
    SET ${setPart}
    WHERE ${wherePart}
  `;

  const values = [
    ...dataKeys.map((k) => data[k]),
    ...whereKeys.map((k) => where[k]),
  ];

  const [result] = await pool.query(sql, values);
  return result;
}

/**
 * Generic DELETE
 */
async function remove(table, where) {
  const whereKeys = Object.keys(where);

  const wherePart = whereKeys.map((k) => `\`${k}\` = ?`).join(" AND ");

  const sql = `
    DELETE FROM \`${table}\`
    WHERE ${wherePart}
  `;

  const values = whereKeys.map((k) => where[k]);
  const [result] = await pool.query(sql, values);
  return result;
}

module.exports = {
  find,
  insert,
  update,
  remove,
};
