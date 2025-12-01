// modules/chat/chat.controller.js
const dbService = require("../../core/dbService");
const pool = require("../../core/db");

const ROOMS_TABLE = "COE_TBL_CHAT_ROOMS";
const PART_TABLE = "COE_TBL_CHAT_PARTICIPANTS";
const MSG_TABLE = "COE_TBL_CHAT_MESSAGES";
const USERS_TABLE = "COE_TBL_USERS";
const NOTIF_TABLE = "COE_TBL_NOTIFICATIONS";

/**
 * Helper: build "isSender" based on current user.
 */
function mapMessageRow(row, currentUserId) {
  return {
    MESSAGE_ID: row.MESSAGE_ID,
    ROOM_ID: row.ROOM_ID,
    SENDER_ID: row.SENDER_ID,
    SENDER_NAME: row.SENDER_NAME,
    MESSAGE: row.MESSAGE_TEXT,
    CREATED_AT: row.CREATED_AT,
    IS_SENDER: row.SENDER_ID === currentUserId,
  };
}

/**
 * GET /api/chat/chats
 * Returns list of all rooms (DM + groups) that current user participates in
 * with last message info.
 */
async function listChats(req, res) {
  try {
    const currentUserId = req.user.USER_ID;

    const sql = `
      SELECT
        r.ROOM_ID,
        r.IS_GROUP,
        r.GROUP_NAME,
        r.ACTIVE_STATUS,

        lm.MESSAGE_ID AS LAST_MESSAGE_ID,
        lm.MESSAGE_TEXT AS LAST_MESSAGE_TEXT,
        lm.CREATED_AT AS LAST_MESSAGE_TIME,

        u_other.USER_ID AS OTHER_USER_ID,
        CONCAT(u_other.FIRST_NAME, ' ', u_other.LAST_NAME) AS OTHER_USER_NAME,
        u_other.PROFILE_IMG AS OTHER_USER_IMG

      FROM COE_TBL_CHAT_ROOMS r
      INNER JOIN COE_TBL_CHAT_PARTICIPANTS p
        ON p.ROOM_ID = r.ROOM_ID
       AND p.USER_ID = ?
       AND p.ACTIVE_STATUS = 1
       AND r.ACTIVE_STATUS = 1

      LEFT JOIN (
        SELECT
          m1.ROOM_ID,
          m1.MESSAGE_ID,
          m1.MESSAGE_TEXT,
          m1.CREATED_AT
        FROM COE_TBL_CHAT_MESSAGES m1
        INNER JOIN (
          SELECT ROOM_ID, MAX(CREATED_AT) AS MAX_CREATED_AT
          FROM COE_TBL_CHAT_MESSAGES
          WHERE ACTIVE_STATUS = 1
          GROUP BY ROOM_ID
        ) m2
          ON m1.ROOM_ID = m2.ROOM_ID
         AND m1.CREATED_AT = m2.MAX_CREATED_AT
        WHERE m1.ACTIVE_STATUS = 1
      ) lm
        ON lm.ROOM_ID = r.ROOM_ID

      LEFT JOIN COE_TBL_CHAT_PARTICIPANTS p2
        ON p2.ROOM_ID = r.ROOM_ID
       AND p2.USER_ID <> ?
       AND p2.ACTIVE_STATUS = 1

      LEFT JOIN COE_TBL_USERS u_other
        ON u_other.USER_ID = p2.USER_ID

      ORDER BY lm.CREATED_AT DESC, r.ROOM_ID DESC
    `;

    const [rows] = await pool.query(sql, [currentUserId, currentUserId]);

    const chats = rows.map((row) => {
      const isGroup = row.IS_GROUP === 1;

      return {
        ROOM_ID: row.ROOM_ID,
        IS_GROUP: row.IS_GROUP,
        TITLE: isGroup
          ? row.GROUP_NAME || "Group"
          : row.OTHER_USER_NAME || "Direct chat",
        AVATAR: isGroup ? null : row.OTHER_USER_IMG || null,
        LAST_MESSAGE_ID: row.LAST_MESSAGE_ID || null,
        LAST_MESSAGE: row.LAST_MESSAGE_TEXT || null,
        LAST_MESSAGE_TIME: row.LAST_MESSAGE_TIME || null,
      };
    });

    return res.json(chats);
  } catch (err) {
    console.error("listChats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/chat/groups
 * Returns only group chats for current user.
 */
async function listGroups(req, res) {
  try {
    const currentUserId = req.user.USER_ID;

    const sql = `
      SELECT
        r.ROOM_ID,
        r.GROUP_NAME,
        COUNT(p2.USER_ID) AS MEMBERS_COUNT
      FROM COE_TBL_CHAT_ROOMS r
      INNER JOIN COE_TBL_CHAT_PARTICIPANTS p
        ON p.ROOM_ID = r.ROOM_ID
       AND p.USER_ID = ?
       AND p.ACTIVE_STATUS = 1
      LEFT JOIN COE_TBL_CHAT_PARTICIPANTS p2
        ON p2.ROOM_ID = r.ROOM_ID
       AND p2.ACTIVE_STATUS = 1
      WHERE r.IS_GROUP = 1
        AND r.ACTIVE_STATUS = 1
      GROUP BY r.ROOM_ID, r.GROUP_NAME
      ORDER BY r.GROUP_NAME ASC
    `;

    const [rows] = await pool.query(sql, [currentUserId]);

    const groups = rows.map((r) => ({
      ROOM_ID: r.ROOM_ID,
      GROUP_NAME: r.GROUP_NAME,
      MEMBERS_COUNT: r.MEMBERS_COUNT,
    }));

    return res.json(groups);
  } catch (err) {
    console.error("listGroups error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/chat/contacts
 * Simple list of all active users except current user.
 * You can filter by department or roles if needed.
 */
async function listContacts(req, res) {
  try {
    const currentUserId = req.user.USER_ID;

    const users = await dbService.find({
      table: USERS_TABLE,
      fields: [
        "USER_ID",
        "FIRST_NAME",
        "LAST_NAME",
        "EMAIL",
        "PROFILE_IMG",
        "ACTIVE_STATUS",
      ],
      where: {
        ACTIVE_STATUS: 1,
      },
      orderBy: "FIRST_NAME ASC, LAST_NAME ASC",
    });

    const contacts = users
      .filter((u) => u.USER_ID !== currentUserId)
      .map((u) => ({
        USER_ID: u.USER_ID,
        NAME: `${u.FIRST_NAME} ${u.LAST_NAME}`,
        EMAIL: u.EMAIL,
        PROFILE_IMG: u.PROFILE_IMG,
        ACTIVE_STATUS: u.ACTIVE_STATUS,
      }));

    return res.json(contacts);
  } catch (err) {
    console.error("listContacts error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Helper: ensures a "direct" (DM) room exists between current user and target user.
 * Returns ROOM_ID.
 */
async function ensureDirectRoom(currentUserId, targetUserId) {
  // Try to find existing room with exactly these 2 participants
  const sqlFind = `
    SELECT r.ROOM_ID
    FROM COE_TBL_CHAT_ROOMS r
    INNER JOIN COE_TBL_CHAT_PARTICIPANTS p1
      ON p1.ROOM_ID = r.ROOM_ID
     AND p1.USER_ID = ?
     AND p1.ACTIVE_STATUS = 1
    INNER JOIN COE_TBL_CHAT_PARTICIPANTS p2
      ON p2.ROOM_ID = r.ROOM_ID
     AND p2.USER_ID = ?
     AND p2.ACTIVE_STATUS = 1
    WHERE r.IS_GROUP = 0
      AND r.ACTIVE_STATUS = 1
    LIMIT 1
  `;
  const [rows] = await pool.query(sqlFind, [currentUserId, targetUserId]);
  if (rows.length > 0) {
    return rows[0].ROOM_ID;
  }

  // No direct room, create one
  const roomInsert = await dbService.insert(ROOMS_TABLE, {
    ROOM_CODE: null,
    IS_GROUP: 0,
    GROUP_NAME: null,
    ACTIVE_STATUS: 1,
  });

  const ROOM_ID = roomInsert.insertId;

  // Add both participants
  await dbService.insert(PART_TABLE, {
    ROOM_ID,
    USER_ID: currentUserId,
    ROLE: "MEMBER",
    ACTIVE_STATUS: 1,
  });

  await dbService.insert(PART_TABLE, {
    ROOM_ID,
    USER_ID: targetUserId,
    ROLE: "MEMBER",
    ACTIVE_STATUS: 1,
  });

  return ROOM_ID;
}

/**
 * GET /api/chat/messages/:ROOM_ID
 * Returns messages for given room, structured to match frontend expectations:
 * [
 *   {
 *     ROOM_ID,
 *     USER_MESSAGES: [ { MESSAGE_ID, ROOM_ID, SENDER_ID, SENDER_NAME, MESSAGE, CREATED_AT, IS_SENDER }, ... ]
 *   }
 * ]
 */
async function getMessages(req, res) {
  try {
    const currentUserId = req.user.USER_ID;
    const ROOM_ID = parseInt(req.params.ROOM_ID, 10);

    if (!ROOM_ID || Number.isNaN(ROOM_ID)) {
      return res.status(400).json({ message: "Invalid ROOM_ID" });
    }

    // Ensure user is a participant
    const parts = await dbService.find({
      table: PART_TABLE,
      where: { ROOM_ID, USER_ID: currentUserId, ACTIVE_STATUS: 1 },
      limit: 1,
    });

    if (parts.length === 0) {
      return res.status(403).json({ message: "Not allowed in this room" });
    }

    const sql = `
      SELECT
        m.MESSAGE_ID,
        m.ROOM_ID,
        m.SENDER_ID,
        m.MESSAGE_TEXT,
        m.CREATED_AT,
        u.FIRST_NAME,
        u.LAST_NAME
      FROM COE_TBL_CHAT_MESSAGES m
      INNER JOIN COE_TBL_USERS u
        ON u.USER_ID = m.SENDER_ID
      WHERE m.ROOM_ID = ?
        AND m.ACTIVE_STATUS = 1
      ORDER BY m.CREATED_AT ASC
      LIMIT 1000
    `;

    const [rows] = await pool.query(sql, [ROOM_ID]);

    const userMessages = rows.map((r) =>
      mapMessageRow(
        {
          MESSAGE_ID: r.MESSAGE_ID,
          ROOM_ID: r.ROOM_ID,
          SENDER_ID: r.SENDER_ID,
          SENDER_NAME: `${r.FIRST_NAME} ${r.LAST_NAME}`,
          MESSAGE_TEXT: r.MESSAGE_TEXT,
          CREATED_AT: r.CREATED_AT,
        },
        currentUserId
      )
    );

    return res.json([
      {
        ROOM_ID,
        USER_MESSAGES: userMessages,
      },
    ]);
  } catch (err) {
    console.error("getMessages error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/chat/messages
 *
 * Body options:
 * 1) Existing room:
 *    { "ROOM_ID": 123, "MESSAGE": "Hello" }
 *
 * 2) New direct chat:
 *    { "TARGET_USER_ID": 5, "MESSAGE": "Hello" }
 */
async function sendMessage(req, res) {
  try {
    const currentUserId = req.user.USER_ID;
    let { ROOM_ID, TARGET_USER_ID, MESSAGE, ATTACHMENT_URL } = req.body;

    if (!MESSAGE || typeof MESSAGE !== "string") {
      return res.status(400).json({ message: "MESSAGE is required" });
    }

    let roomIdToUse = ROOM_ID ? parseInt(ROOM_ID, 10) : null;

    if (!roomIdToUse && TARGET_USER_ID) {
      // Create / reuse a direct room
      const targetId = parseInt(TARGET_USER_ID, 10);
      if (!targetId || Number.isNaN(targetId)) {
        return res.status(400).json({ message: "Invalid TARGET_USER_ID" });
      }
      roomIdToUse = await ensureDirectRoom(currentUserId, targetId);
    }

    if (!roomIdToUse || Number.isNaN(roomIdToUse)) {
      return res.status(400).json({ message: "ROOM_ID or TARGET_USER_ID required" });
    }

    // Ensure sender is a participant in room
    const parts = await dbService.find({
      table: PART_TABLE,
      where: { ROOM_ID: roomIdToUse, USER_ID: currentUserId, ACTIVE_STATUS: 1 },
      limit: 1,
    });
    if (parts.length === 0) {
      return res.status(403).json({ message: "Not allowed in this room" });
    }

    // Insert message
    const msgInsert = await dbService.insert(MSG_TABLE, {
      ROOM_ID: roomIdToUse,
      SENDER_ID: currentUserId,
      MESSAGE_TEXT: MESSAGE,
      ATTACHMENT_URL: ATTACHMENT_URL || null,
      ACTIVE_STATUS: 1,
    });

    const MESSAGE_ID = msgInsert.insertId;

    // Get sender name
    const senderRows = await dbService.find({
      table: USERS_TABLE,
      where: { USER_ID: currentUserId },
      fields: ["FIRST_NAME", "LAST_NAME"],
      limit: 1,
    });

    const SENDER_NAME = senderRows.length
      ? `${senderRows[0].FIRST_NAME} ${senderRows[0].LAST_NAME}`
      : "You";

    const createdRow = await dbService.find({
      table: MSG_TABLE,
      where: { MESSAGE_ID },
      fields: ["MESSAGE_ID", "ROOM_ID", "SENDER_ID", "MESSAGE_TEXT", "CREATED_AT"],
      limit: 1,
    });

    const base = createdRow[0];

    const messagePayload = {
      MESSAGE_ID: base.MESSAGE_ID,
      ROOM_ID: base.ROOM_ID,
      SENDER_ID: base.SENDER_ID,
      SENDER_NAME,
      MESSAGE: base.MESSAGE_TEXT,
      CREATED_AT: base.CREATED_AT,
      IS_SENDER: true,
    };

    // Create notifications for all other participants
    const [otherParts] = await pool.query(
      `
      SELECT USER_ID
      FROM COE_TBL_CHAT_PARTICIPANTS
      WHERE ROOM_ID = ?
        AND USER_ID <> ?
        AND ACTIVE_STATUS = 1
    `,
      [roomIdToUse, currentUserId]
    );

    for (const p of otherParts) {
      await dbService.insert(NOTIF_TABLE, {
        USER_ID: p.USER_ID,
        TYPE: "CHAT_MESSAGE",
        TITLE: SENDER_NAME,
        BODY: MESSAGE,
        ENTITY_TYPE: "CHAT_MESSAGE",
        ENTITY_ID: MESSAGE_ID,
        IS_READ: 0,
      });
    }

    // For real-time: emit socket event here if you later add socket.io
    // const io = require("../../core/socket").io;
    // io.to(`room-${roomIdToUse}`).emit("chat:message", messagePayload);

    return res.status(201).json(messagePayload);
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/chat/messages/:MESSAGE_ID
 * Soft delete: ACTIVE_STATUS = 0
 */
async function deleteMessage(req, res) {
  try {
    const currentUserId = req.user.USER_ID;
    const MESSAGE_ID = parseInt(req.params.MESSAGE_ID, 10);

    if (!MESSAGE_ID || Number.isNaN(MESSAGE_ID)) {
      return res.status(400).json({ message: "Invalid MESSAGE_ID" });
    }

    // Ensure the user is either sender or participant in that room
    const sqlCheck = `
      SELECT
        m.MESSAGE_ID,
        m.ROOM_ID,
        m.SENDER_ID,
        p.USER_ID AS PARTICIPANT_ID
      FROM COE_TBL_CHAT_MESSAGES m
      INNER JOIN COE_TBL_CHAT_PARTICIPANTS p
        ON p.ROOM_ID = m.ROOM_ID
       AND p.USER_ID = ?
       AND p.ACTIVE_STATUS = 1
      WHERE m.MESSAGE_ID = ?
        AND m.ACTIVE_STATUS = 1
      LIMIT 1
    `;

    const [rows] = await pool.query(sqlCheck, [currentUserId, MESSAGE_ID]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Message not found or not accessible" });
    }

    // Optionally: only allow sender OR admin roles to delete
    // For now, any participant can delete:
    await dbService.update(MSG_TABLE, { ACTIVE_STATUS: 0 }, { MESSAGE_ID });

    return res.json(MESSAGE_ID); // saga expects raw ID
  } catch (err) {
    console.error("deleteMessage error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/chat/notifications
 * Simple list of unread chat notifications for current user.
 */
async function listNotifications(req, res) {
  try {
    const currentUserId = req.user.USER_ID;

    const notifs = await dbService.find({
      table: NOTIF_TABLE,
      where: {
        USER_ID: currentUserId,
        IS_READ: 0,
      },
      fields: [
        "NOTIFICATION_ID",
        "TYPE",
        "TITLE",
        "BODY",
        "ENTITY_TYPE",
        "ENTITY_ID",
        "IS_READ",
        "CREATED_AT",
      ],
      orderBy: "CREATED_AT DESC",
    });

    return res.json(notifs);
  } catch (err) {
    console.error("listNotifications error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/chat/notifications/read
 * Body: { NOTIFICATION_IDS: [1,2,3] }
 */
async function markNotificationsRead(req, res) {
  try {
    const currentUserId = req.user.USER_ID;
    const { NOTIFICATION_IDS } = req.body;

    if (!Array.isArray(NOTIFICATION_IDS) || NOTIFICATION_IDS.length === 0) {
      return res.status(400).json({ message: "NOTIFICATION_IDS is required" });
    }

    const ids = NOTIFICATION_IDS.map((id) => parseInt(id, 10)).filter(
      (id) => !Number.isNaN(id)
    );

    if (ids.length === 0) {
      return res.status(400).json({ message: "No valid NOTIFICATION_IDS" });
    }

    const placeholders = ids.map(() => "?").join(",");
    const sql = `
      UPDATE COE_TBL_NOTIFICATIONS
      SET IS_READ = 1
      WHERE USER_ID = ?
        AND NOTIFICATION_ID IN (${placeholders})
    `;

    await pool.query(sql, [currentUserId, ...ids]);

    return res.json({ message: "Notifications marked as read", NOTIFICATION_IDS: ids });
  } catch (err) {
    console.error("markNotificationsRead error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  listChats,
  listGroups,
  listContacts,
  getMessages,
  sendMessage,
  deleteMessage,
  listNotifications,
  markNotificationsRead,
};
