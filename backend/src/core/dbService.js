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

/**
 * Generic UPSERT (INSERT ... ON DUPLICATE KEY UPDATE)
 *
 * @param {string} table
 * @param {object} data            // columns to insert
 * @param {string[]} uniqueKeys    // columns that are part of the UNIQUE/PK key
 * @param {object} options
 *   - companyId?: any             // auto-inject COMPANY_ID like insert/update
 *   - connection?: any            // optional mysql2 connection for transactions
 *   - updateColumns?: string[]    // optional explicit list of columns to update
//  *   - auditUserId?: any           // if set, manages CREATED_*/
//  *
//  * Audit behavior (when auditUserId is provided and table has typical audit cols):
//  *   - INSERT: adds CREATED_BY = auditUserId, CREATED_ON = NOW()
//  *   - UPDATE: sets CHANGED_BY = auditUserId, CHANGED_ON = NOW()
//  *   - Never touches COMPANY_ID / uniqueKeys / CREATED_ON / CREATED_BY on update
//  */
async function upsert(table, data, uniqueKeys, options = {}) {
  const { companyId, connection, updateColumns, auditUserId } = options;

  if (!table) {
    throw new Error("upsert: table is required");
  }
  if (!data || typeof data !== "object") {
    throw new Error("upsert: data must be a non-null object");
  }
  if (!Array.isArray(uniqueKeys) || uniqueKeys.length === 0) {
    throw new Error("upsert: uniqueKeys must be a non-empty array");
  }

  // Clone so we don't mutate caller data
  const insertData = { ...data };

  // Auto-inject COMPANY_ID if not set and companyId was passed
  if (
    companyId !== undefined &&
    companyId !== null &&
    insertData.COMPANY_ID === undefined
  ) {
    insertData.COMPANY_ID = companyId;
  }

  // Never allow CHANGED_* to be inserted; they are managed on UPDATE only
  delete insertData.CHANGED_ON;
  delete insertData.CHANGED_BY;

  const baseKeys = Object.keys(insertData);
  if (baseKeys.length === 0) {
    throw new Error("upsert: data must have at least one column");
  }

  const insertColumns = [...baseKeys];
  const insertPlaceholders = [];
  const values = [];

  // Normal insert columns => placeholders + values
  for (const col of baseKeys) {
    insertPlaceholders.push("?");
    values.push(insertData[col]);
  }

  // Audit: CREATED_ON / CREATED_BY on INSERT, CHANGED_ON / CHANGED_BY on UPDATE
  const useAudit = auditUserId !== undefined && auditUserId !== null;
  if (useAudit) {
    // Ensure CREATED_BY is present in insert columns
    if (!insertColumns.includes("CREATED_BY")) {
      insertColumns.push("CREATED_BY");
      insertPlaceholders.push("?");
      values.push(auditUserId);
    }

    // CREATED_ON always set to NOW() on insert
    if (!insertColumns.includes("CREATED_ON")) {
      insertColumns.push("CREATED_ON");
      insertPlaceholders.push("NOW()"); // literal, no value pushed
    }
  }

  const quotedInsertCols = insertColumns
    .map((c) => `\`${c}\``)
    .join(", ");
  const insertPlaceholderSql = insertPlaceholders.join(", ");

  // Determine which columns to update
  const doNotUpdate = new Set([
    ...uniqueKeys,
    "COMPANY_ID",
    "CREATED_ON",
    "CREATED_BY",
  ]);

  let colsToUpdate;
  if (Array.isArray(updateColumns) && updateColumns.length > 0) {
    colsToUpdate = updateColumns;
  } else {
    colsToUpdate = insertColumns.filter((c) => !doNotUpdate.has(c));
  }

  const updateParts = [];

  for (const col of colsToUpdate) {
    if (col === "CHANGED_ON" || col === "CHANGED_BY") {
      // handled explicitly when useAudit is true
      continue;
    }
    updateParts.push(`\`${col}\` = VALUES(\`${col}\`)`);
  }

  if (useAudit) {
    // Always set CHANGED_* on UPDATE when auditUserId is provided
    updateParts.push("`CHANGED_ON` = NOW()");
    updateParts.push("`CHANGED_BY` = ?");
    values.push(auditUserId);
  }

  let sql = `
    INSERT INTO \`${table}\` (${quotedInsertCols})
    VALUES (${insertPlaceholderSql})
  `;

  if (updateParts.length > 0) {
    sql += `
      ON DUPLICATE KEY UPDATE
      ${updateParts.join(", ")}
    `;
  }

  const executor = connection || pool;
  const [result] = await executor.query(sql, values);
  return result;
}


module.exports = {
  find,
  insert,
  update,
  remove,
  upsert,
};
