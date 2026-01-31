const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const convertRoutes = require('./routes/convert');
const pool = require('./config/db');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve frontend statically
const path = require('path');
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/convert', convertRoutes);

const PORT = process.env.PORT || 5000;
async function ensureSchema() {
  try {
    const dbName = process.env.DB_NAME;
    await pool.query('SELECT 1');
    const [tables] = await pool.query(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [dbName, 'users']
    );
    if (tables.length === 0) {
      await pool.query(
        'CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(100) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, phone_country_code VARCHAR(8) NOT NULL, phone_number VARCHAR(20) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)'
      );
    } else {
      const [cols] = await pool.query(
        'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
        [dbName, 'users']
      );
      const names = cols.map(c => c.COLUMN_NAME);
      if (!names.includes('phone_country_code')) {
        await pool.query("ALTER TABLE users ADD COLUMN phone_country_code VARCHAR(8) NOT NULL DEFAULT '+91'");
      }
      if (!names.includes('phone_number')) {
        await pool.query("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) NOT NULL DEFAULT '0000000000'");
      }
    }
  } catch (e) {
    console.error('Schema ensure error:', e);
  }
}

ensureSchema().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
