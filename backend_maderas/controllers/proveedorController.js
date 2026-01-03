const db = require('../config/database');

// ==========================================
// 1. LISTAR PROVEEDORES
// ==========================================
const getProveedores = async (req, res) => {
    try {
        // Ordenamos por 'nombre' (columna real de tu BD)
        const [rows] = await db.query('SELECT * FROM proveedores ORDER BY nombre ASC');
        
        // Devolvemos el array directo para facilitar el frontend
        res.json(rows);
    } catch (error) {
        console.error('Error al listar proveedores:', error);
        res.status(500).json({ success: false, message: 'Error al listar', error: error.message });
    }
};

// ==========================================
// 2. CREAR PROVEEDOR
// ==========================================
const createProveedor = async (req, res) => {
    try {
        // Solo pedimos los datos que existen en tu imagen
        const { nombre, ruc, contacto, estado } = req.body;
        
        const sql = `
            INSERT INTO proveedores (nombre, ruc, contacto, estado) 
            VALUES (?, ?, ?, ?)
        `;
        
        // Por defecto estado 'ACTIVO' si no se envía
        const [result] = await db.query(sql, [
            nombre, 
            ruc, 
            contacto, 
            estado || 'ACTIVO'
        ]);
        
        res.status(201).json({ 
            success: true, 
            message: 'Proveedor registrado correctamente', 
            id: result.insertId 
        });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({ success: false, message: 'Error al registrar', error: error.message });
    }
};

// ==========================================
// 3. ACTUALIZAR PROVEEDOR
// ==========================================
const updateProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, ruc, contacto, estado } = req.body;
        
        const sql = `
            UPDATE proveedores 
            SET nombre=?, ruc=?, contacto=?, estado=? 
            WHERE id=?
        `;
        
        await db.query(sql, [nombre, ruc, contacto, estado, id]);
        
        res.json({ success: true, message: 'Proveedor actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar', error: error.message });
    }
};

// ==========================================
// 4. ELIMINAR PROVEEDOR
// ==========================================
const deleteProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM proveedores WHERE id = ?', [id]);
        res.json({ success: true, message: 'Proveedor eliminado' });
    } catch (error) {
        console.error('Error al eliminar:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar', error: error.message });
    }
};

// ⚠️ IMPORTANTE: Exportar también getProveedoresById si planeas usarlo para editar
// Por ahora exportamos los 4 principales
module.exports = { 
    getProveedores, 
    createProveedor, 
    updateProveedor, 
    deleteProveedor 
};