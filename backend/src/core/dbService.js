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
 *
 * companyId (optional) is expected from session (e.g. req.session.COMPANY_ID)
 */
async function find(options, companyId) {
  const {
    table,
    where = {},
    fields = ["*"],
    limit,
    offset,
    orderBy,
  } = options;

  // Always scope by COMPANY_ID when provided
  const finalWhere = { ...where };
  if (companyId !== undefined && companyId !== null) {
    finalWhere.COMPANY_ID = companyId;
  }

  let sql = `SELECT ${fields.join(", ")} FROM \`${table}\``;
  const values = [];

  const whereKeys = Object.keys(finalWhere);
  if (whereKeys.length > 0) {
    const conditions = whereKeys.map((key) => {
      values.push(finalWhere[key]);
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
 *
 * companyId (optional) is expected from session (e.g. req.session.COMPANY_ID)
 */
async function insert(table, data, companyId) {
  // Always insert COMPANY_ID when provided (if not already set)
  const insertData = { ...data };
  if (
    companyId !== undefined &&
    companyId !== null &&
    insertData.COMPANY_ID === undefined
  ) {
    insertData.COMPANY_ID = companyId;
  }

  const keys = Object.keys(insertData);
  const placeholders = keys.map(() => "?").join(", ");

  const sql = `
    INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(", ")})
    VALUES (${placeholders})
  `;

  const values = keys.map((k) => insertData[k]);
  const [result] = await pool.query(sql, values);
  return result;
}

/**
 * Generic UPDATE
 * where = { col: value, ... }  (AND conditions)
 *
 * companyId (optional) is expected from session (e.g. req.session.COMPANY_ID)
 */
async function update(table, data, where, companyId) {
  // Ensure COMPANY_ID is both in SET (if desired) and WHERE (for scoping)
  const updateData = { ...data };
  const finalWhere = { ...where };

  if (companyId !== undefined && companyId !== null) {
    // Don't override explicit COMPANY_ID in data/where if caller set it
    if (updateData.COMPANY_ID === undefined) {
      updateData.COMPANY_ID = companyId;
    }
    if (finalWhere.COMPANY_ID === undefined) {
      finalWhere.COMPANY_ID = companyId;
    }
  }

  const dataKeys = Object.keys(updateData);
  const whereKeys = Object.keys(finalWhere);

  const setPart = dataKeys.map((k) => `\`${k}\` = ?`).join(", ");
  const wherePart = whereKeys.map((k) => `\`${k}\` = ?`).join(" AND ");

  const sql = `
    UPDATE \`${table}\`
    SET ${setPart}
    WHERE ${wherePart}
  `;

  const values = [
    ...dataKeys.map((k) => updateData[k]),
    ...whereKeys.map((k) => finalWhere[k]),
  ];

  const [result] = await pool.query(sql, values);
  return result;
}

/**
 * Generic DELETE
 *
 * companyId (optional) is expected from session (e.g. req.session.COMPANY_ID)
 */
async function remove(table, where, companyId) {
  const finalWhere = { ...where };

  // Always scope DELETE by COMPANY_ID when provided
  if (companyId !== undefined && companyId !== null) {
    if (finalWhere.COMPANY_ID === undefined) {
      finalWhere.COMPANY_ID = companyId;
    }
  }

  const whereKeys = Object.keys(finalWhere);
  const wherePart = whereKeys.map((k) => `\`${k}\` = ?`).join(" AND ");

  const sql = `
    DELETE FROM \`${table}\`
    WHERE ${wherePart}
  `;

  const values = whereKeys.map((k) => finalWhere[k]);
  const [result] = await pool.query(sql, values);
  return result;
}

module.exports = {
  find,
  insert,
  update,
  remove,
};
