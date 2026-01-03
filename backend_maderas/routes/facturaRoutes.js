const express = require('express');
const router = express.Router();
const { 
    createFactura, 
    getFacturas, 
    getFacturaById,    // ✅ Importar
    updateFactura,     // ✅ Importar
    registrarCobranza,
    deleteFactura,
    deleteFacturaItem
} = require('../controllers/facturaController');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);

// Rutas
router.get('/', getFacturas);
router.get('/:id', getFacturaById);    // ✅ Ruta para cargar datos
router.post('/', createFactura);
router.put('/:id', updateFactura);     // ✅ Ruta para guardar cambios
router.post('/cobranza', registrarCobranza);
router.delete('/:id', deleteFactura);

// Mantengo esta ruta porque la tenías en tu código original
router.delete('/item/:itemId', deleteFacturaItem); 

module.exports = router;