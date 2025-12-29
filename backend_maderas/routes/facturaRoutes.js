const express = require('express');
const router = express.Router();
const { 
    createFactura, 
    getFacturas, 
    registrarCobranza, 
    deleteFacturaItem 
} = require('../controllers/facturaController');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);

router.get('/', getFacturas);
router.post('/', createFactura);
router.post('/cobranza', registrarCobranza);
router.delete('/item/:itemId', deleteFacturaItem);

module.exports = router;