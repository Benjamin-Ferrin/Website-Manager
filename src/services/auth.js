const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password_hash);
}

async function createUser(email, password) {
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, hash]
  );
  return rows[0];
}

async function ensureAdmin(email, password) {
  const existing = await findByEmail(email);
  if (existing) return existing;
  return createUser(email, password);
}

module.exports = {
  findByEmail,
  verifyPassword,
  createUser,
  ensureAdmin,
};
