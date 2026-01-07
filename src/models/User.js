const { getConnection, sql } = require('../config/database');

class User {
  static async findByEmail(email) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');
    return result.recordset[0];
  }

  static async findById(id) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Users WHERE UserID = @id');
    return result.recordset[0];
  }

  static async create(data) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('name', sql.NVarChar, data.name)
      .input('email', sql.VarChar, data.email)
      .input('password', sql.VarChar, data.password)
      .input('phone', sql.VarChar, data.phone)
      .input('role', sql.VarChar, data.role)
      .query(`
        INSERT INTO Users (Name, Email, Password, Phone, Role)
        VALUES (@name, @email, @password, @phone, @role);
        SELECT SCOPE_IDENTITY() AS id;
      `);
    return result.recordset[0];
  }

  static async getAll() {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT UserID, Name, Email, Phone, Role, CreatedAt FROM Users');
    return result.recordset;
  }

  static async update(id, data) {
  const pool = await getConnection();
  await pool.request()
    .input('id', sql.Int, id)
    .input('name', sql.NVarChar, data.name)
    .input('phone', sql.VarChar, data.phone)
    .query('UPDATE Users SET Name = @name, Phone = @phone WHERE UserID = @id');
  return true;
}

static async updatePassword(id, hashedPassword) {
  const pool = await getConnection();
  await pool.request()
    .input('id', sql.Int, id)
    .input('password', sql.VarChar, hashedPassword)
    .query('UPDATE Users SET Password = @password WHERE UserID = @id');
  return true;
}
}

module.exports = User;