const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Listar todos los usuarios (sin mostrar passwords)
const getUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nombre, email, rol, activo, fecha_registro, ultima_conexion FROM usuarios');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al obtener usuarios', error: error.message });
    }
};

// Actualizar Usuario (Rol o Estado)
const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, rol, activo } = req.body; // No permitimos cambio de password por aquí por seguridad
        
        await db.query(
            'UPDATE usuarios SET nombre=?, email=?, rol=?, activo=? WHERE id=?',
            [nombre, email, rol, activo, id]
        );
        
        res.json({ success: true, mensaje: 'Usuario actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al actualizar usuario', error: error.message });
    }
};

// Eliminar usuario (Físico)
const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        // Evitar que se elimine a sí mismo
        if (req.usuario.id == id) {
            return res.status(400).json({ success: false, mensaje: 'No puedes eliminar tu propia cuenta' });
        }

        await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ success: true, mensaje: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al eliminar usuario', error: error.message });
    }
};

module.exports = { getUsuarios, updateUsuario, deleteUsuario };