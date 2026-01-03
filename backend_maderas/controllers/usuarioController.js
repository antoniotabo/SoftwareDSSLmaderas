const db = require('../config/database');
const bcrypt = require('bcryptjs');

// ==========================================
// 1. LISTAR USUARIOS
// ==========================================
const getUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, nombre, email, rol, estado FROM usuarios ORDER BY id DESC'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ Error al obtener usuarios:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al obtener usuarios', 
            error: error.message 
        });
    }
};

// ==========================================
// 2. OBTENER UN USUARIO (POR ID)
// ==========================================
const getUsuarioById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            'SELECT id, nombre, email, rol, estado FROM usuarios WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('❌ Error al obtener usuario:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al obtener usuario', 
            error: error.message 
        });
    }
};

// ==========================================
// 3. CREAR USUARIO
// ==========================================
const createUsuario = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        // Validaciones básicas
        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                mensaje: 'Faltan campos obligatorios: nombre, email, password'
            });
        }

        // Verificar si el email ya existe
        const [existente] = await db.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (existente.length > 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'El email ya está registrado'
            });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insertar en BD
        const [result] = await db.query(
            'INSERT INTO usuarios (nombre, email, password, rol, estado) VALUES (?, ?, ?, ?, ?)',
            [nombre, email, passwordHash, rol || 'usuario', 'ACTIVO']
        );

        console.log('✅ Usuario creado ID:', result.insertId);

        res.status(201).json({ 
            success: true, 
            mensaje: 'Usuario creado correctamente',
            id: result.insertId
        });

    } catch (error) {
        console.error('❌ Error al crear usuario:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al crear usuario', 
            error: error.message 
        });
    }
};

// ==========================================
// 4. ACTUALIZAR USUARIO (¡CORREGIDO!)
// ==========================================
const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, password, rol, estado } = req.body; // ✅ Extraemos password también

        // 1. Verificar existencia del usuario
        const [usuario] = await db.query('SELECT id FROM usuarios WHERE id = ?', [id]);
        
        if (usuario.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        // 2. Verificar duplicidad de email
        if (email) {
            const [emailExistente] = await db.query(
                'SELECT id FROM usuarios WHERE email = ? AND id != ?',
                [email, id]
            );

            if (emailExistente.length > 0) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El email ya está en uso por otro usuario'
                });
            }
        }

        // 3. ACTUALIZACIÓN INTELIGENTE (Con o Sin Password)
        if (password && password.trim() !== '') {
            // A) Si enviaron password: La encriptamos y actualizamos TODO
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            await db.query(
                'UPDATE usuarios SET nombre=?, email=?, password=?, rol=?, estado=? WHERE id=?',
                [nombre, email, passwordHash, rol, estado, id]
            );
        } else {
            // B) Si NO enviaron password: Solo actualizamos datos, mantenemos la clave vieja
            await db.query(
                'UPDATE usuarios SET nombre=?, email=?, rol=?, estado=? WHERE id=?',
                [nombre, email, rol, estado, id]
            );
        }
        
        res.json({ 
            success: true, 
            mensaje: 'Usuario actualizado correctamente' 
        });

    } catch (error) {
        console.error('❌ Error al actualizar usuario:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al actualizar usuario', 
            error: error.message 
        });
    }
};

// ==========================================
// 5. CAMBIAR PASSWORD (Ruta específica)
// ==========================================
const cambiarPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password_nuevo } = req.body;

        if (!password_nuevo || password_nuevo.length < 6) {
            return res.status(400).json({
                success: false,
                mensaje: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password_nuevo, salt);

        await db.query(
            'UPDATE usuarios SET password = ? WHERE id = ?',
            [passwordHash, id]
        );

        res.json({ 
            success: true, 
            mensaje: 'Contraseña actualizada correctamente' 
        });
    } catch (error) {
        console.error('❌ Error al cambiar contraseña:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al cambiar contraseña', 
            error: error.message 
        });
    }
};

// ==========================================
// 6. ELIMINAR USUARIO
// ==========================================
const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Evitar suicidio digital (borrarse a sí mismo)
        if (req.usuario && req.usuario.id == id) {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'No puedes eliminar tu propia cuenta' 
            });
        }

        const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({ 
            success: true, 
            mensaje: 'Usuario eliminado correctamente' 
        });
    } catch (error) {
        console.error('❌ Error al eliminar usuario:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al eliminar usuario', 
            error: error.message 
        });
    }
};

module.exports = { 
    getUsuarios, 
    getUsuarioById,
    createUsuario,
    updateUsuario, 
    cambiarPassword,
    deleteUsuario 
};