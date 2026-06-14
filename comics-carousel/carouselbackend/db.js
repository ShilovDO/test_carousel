const { Pool } = require('pg');

// Разбираем DATABASE_URL
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:PasswordDBWEB2025&@176.108.249.27:5432/database_comics";

const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false // для безопасности в продакшене
});

// Функция для записи данных в таблицу configs
const saveConfig = async (id, text) => {
    const query = `
      INSERT INTO schema_comics.configs (id, test) 
      VALUES ($1, $2) 
      RETURNING *;
    `;
    
    try {
      const result = await pool.query(query, [id, text]);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  };
  
  // Функция для проверки существования id
  const checkIdExists = async (id) => {
    const query = 'SELECT id FROM schema_comics.configs WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  };

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
  saveConfig,
  checkIdExists
};