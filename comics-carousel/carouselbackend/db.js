const { Pool } = require('pg');

// Разбираем DATABASE_URL
const connectionString = "postgresql://postgres:PasswordDBWEB2025&@176.108.249.27:5432/database_comics";

console.log('=== ИНИЦИАЛИЗАЦИЯ ПОДКЛЮЧЕНИЯ К БД ===');
console.log('Строка подключения:', connectionString.replace(/:[^:@]*@/, ':****@')); // Скрываем пароль

const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false // для безопасности в продакшене
});

// Логируем успешное подключение
pool.on('connect', () => {
  console.log('✅ Успешное подключение к PostgreSQL');
  console.log('📁 Схема по умолчанию: schema_comics');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка подключения к PostgreSQL:', err);
});

// Функция для записи данных в таблицу configs
const saveConfig = async (id, text) => {
    console.log('📝 saveConfig вызван с параметрами:', { id, textLength: text?.length });
    console.log('🏷️  Используется схема: schema_comics');
    
    const query = `
      INSERT INTO schema_comics.configs (id, test) 
      VALUES ($1, $2) 
      RETURNING *;
    `;
    
    console.log('🔍 Выполняется запрос:', query.replace(/\s+/g, ' ').trim());
    console.log('📊 Параметры:', [id, text?.substring(0, 50) + (text?.length > 50 ? '...' : '')]);
    
    try {
      const result = await pool.query(query, [id, text]);
      console.log('✅ Конфигурация успешно сохранена, ID:', result.rows[0]?.id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Ошибка сохранения конфигурации:', error);
      console.error('❌ Код ошибки:', error.code);
      console.error('❌ Таблица:', error.table);
      console.error('❌ Схема:', error.schema);
      throw error;
    }
  };
  
  // Функция для проверки существования id
  const checkIdExists = async (id) => {
    console.log('🔍 checkIdExists вызван с id:', id);
    console.log('🏷️  Используется схема: schema_comics');
    
    const query = 'SELECT id FROM schema_comics.configs WHERE id = $1';
    console.log('🔍 Выполняется запрос:', query);
    console.log('📊 Параметры:', [id]);
    
    const result = await pool.query(query, [id]);
    const exists = result.rows.length > 0;
    console.log(exists ? `✅ ID ${id} существует` : `❌ ID ${id} не найден`);
    return exists;
  };

// Тестовая функция для проверки подключения и схемы
const testConnection = async () => {
  console.log('\n=== ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЯ К БД ===');
  try {
    // Проверяем доступные схемы
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE '%comics%'
    `);
    console.log('📁 Найденные схемы:', schemasResult.rows.map(r => r.schema_name));
    
    // Проверяем таблицы в схеме schema_comics
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'schema_comics'
    `);
    console.log('📋 Таблицы в schema_comics:', tablesResult.rows.map(r => r.table_name));
    
    // Проверяем search_path
    const searchPathResult = await pool.query('SHOW search_path');
    console.log('🔍 Текущий search_path:', searchPathResult.rows[0].search_path);
    
    console.log('✅ Тестирование подключения завершено успешно\n');
  } catch (error) {
    console.error('❌ Ошибка при тестировании подключения:', error);
  }
};

// Выполняем тест при запуске
testConnection();

module.exports = {
  query: async (text, params) => {
    console.log('📝 Выполняется прямой запрос:', text.replace(/\s+/g, ' ').trim());
    console.log('📊 Параметры:', params);
    try {
      const result = await pool.query(text, params);
      console.log('✅ Запрос выполнен успешно, строк получено:', result.rows.length);
      return result;
    } catch (error) {
      console.error('❌ Ошибка выполнения запроса:', error);
      console.error('❌ Запрос:', text);
      throw error;
    }
  },
  pool: pool,
  saveConfig,
  checkIdExists
};