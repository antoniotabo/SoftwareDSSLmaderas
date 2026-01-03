const express = require('express');
const router = express.Router();
const { 
    getProveedores, 
    createProveedor, 
    updateProveedor, 
    deleteProveedor 
} = require('../controllers/proveedorController');

// Middleware de seguridad (si lo estás usando)
// const { verificarToken } = require('../middleware/auth.middleware');
// router.use(verificarToken);

router.get('/', getProveedores);
router.post('/', createProveedor);
router.put('/:id', updateProveedor);
router.delete('/:id', deleteProveedor);

module.exports = router;