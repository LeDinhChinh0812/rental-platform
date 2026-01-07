const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

async function getConnection() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('✅ Đã kết nối database RentalDB');
  }
  return pool;
}

module.exports = { getConnection, sql };