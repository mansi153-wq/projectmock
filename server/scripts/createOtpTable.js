const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await c.query(`
    CREATE TABLE IF NOT EXISTS otp_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(150) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      purpose ENUM('registration','password_reset') NOT NULL,
      expires_at DATETIME NOT NULL,
      used TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email_purpose (email, purpose)
    )
  `);
  console.log('otp_tokens table created successfully');
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
