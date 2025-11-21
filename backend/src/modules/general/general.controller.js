const dbService = require("../../core/dbService");

async function getHealth(req, res) {
  return res.json({ status: "ok", timestamp: new Date().toISOString() });
}

// Example: generic lookup table
async function listUsers(req, res) {
  try {
    const Users = await dbService.find({
      table: "Users",
      orderBy: "name ASC",
    });
    return res.json(Users);
  } catch (err) {
    console.error("listUsers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getHealth,
  listUsers,
};
