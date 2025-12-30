const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

/**
 * Registrar nuevo usuario
 * POST /api/auth/registro
 */
const registrarUsuario = async (req, res) => {
    try {
        // 1. Validar errores de express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errores: errors.array()
            });
        }

        const { nombre, email, password, rol } = req.body;

        // 2. Verificar si el email ya existe
        const [usuarioExistente] = await db.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (usuarioExistente.length > 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'El email ya está registrado'
            });
        }

        // 3. Hashear password
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. Insertar usuario
        const [resultado] = await db.query(
            'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
            [nombre, email, passwordHash, rol || 'usuario']
        );

        res.status(201).json({
            success: true,
            mensaje: 'Usuario registrado exitosamente',
            data: {
                id: resultado.insertId,
                nombre,
                email,
                rol: rol || 'usuario'
            }
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar usuario',
            error: error.message
        });
    }
};

/**
 * Iniciar sesión
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validar campos obligatorios
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                mensaje: 'Email y password son obligatorios'
            });
        }

        // 2. Buscar usuario (Solo usuarios ACTIVOS)
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE email = ? AND estado = "ACTIVO"',
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                mensaje: 'Credenciales inválidas o usuario inactivo'
            });
        }

        const usuario = usuarios[0];

        // 3. Verificar password
        const passwordValido = await bcrypt.compare(password, usuario.password);

        if (!passwordValido) {
            return res.status(401).json({
                success: false,
                mensaje: 'Credenciales inválidas'
            });
        }

        /* ❌ ELIMINADO: 'UPDATE usuarios SET ultima_conexion...'
           Se eliminó porque tu tabla 'usuarios' no tiene esa columna y causaba Error 500.
        */

        // 4. Generar token JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                rol: usuario.rol
            },
            process.env.JWT_SECRET || 'secreto_super_seguro', // Fallback por seguridad
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // 5. Responder al frontend
        res.json({
            success: true,
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

/**
 * Obtener perfil del usuario autenticado
 * GET /api/auth/perfil
 */
const obtenerPerfil = async (req, res) => {
    try {
        // Corregido: La consulta SQL estaba comentada
        const [usuarios] = await db.query(
            'SELECT id, nombre, email, rol, estado FROM usuarios WHERE id = ?',
            [req.usuario.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: usuarios[0]
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener perfil',
            error: error.message
        });
    }
};

/**
 * Verificar token (renovación)
 * GET /api/auth/verificar
 */
const verificarToken = (req, res) => {
    res.json({
        success: true,
        mensaje: 'Token válido',
        usuario: req.usuario
    });
};

module.exports = {
    registrarUsuario,
    login,
    obtenerPerfil,
    verificarToken
};