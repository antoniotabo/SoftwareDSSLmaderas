const express = require('express');
const router = express.Router();
const { 
    getUsuarios, 
    getUsuarioById,
    createUsuario,
    updateUsuario,
    cambiarPassword,
    deleteUsuario 
} = require('../controllers/usuarioController');
const { verificarToken } = require('../middleware/auth.middleware');

// Proteger todas las rutas
router.use(verificarToken);

// Rutas
router.get('/', getUsuarios);                    // Listar
router.get('/:id', getUsuarioById);              // Obtener uno
router.post('/', createUsuario);                 // Crear
router.put('/:id', updateUsuario);               // Actualizar
router.put('/:id/password', cambiarPassword);    // Cambiar contraseña
router.delete('/:id', deleteUsuario);            // Eliminar

module.exports = router;