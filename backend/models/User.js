const pool = require('../config/db');

const User = {
  async create({ username, email, password_hash, phone_country_code, phone_number }) {
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, phone_country_code, phone_number) VALUES (?, ?, ?, ?, ?)',
      [username, email, password_hash, phone_country_code, phone_number]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT id, username, email, phone_country_code, phone_number FROM users WHERE id = ?', [id]);
    return rows[0];
  }
};

module.exports = User;
