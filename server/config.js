export const PORT = process.env.PORT || 3000;

export const DB_CONFIG = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'marcelrubin',
    password: process.env.DB_PASSWORD || 'Gabber2520',
    database: process.env.DB_NAME || 'React_Chat',
  };