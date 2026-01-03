const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Tu contraseña de MySQL
    database: process.env.DB_NAME || 'maderas_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ¡IMPORTANTE! Esto habilita el uso de 'await' en el controlador
const promisePool = pool.promise();

console.log(`Conectando a la BD: ${process.env.DB_NAME || 'maderas_db'}`);

module.exports = promisePool;