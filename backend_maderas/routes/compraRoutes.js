const express = require('express');
const router = express.Router();
const { 
    createCompra, 
    getCompras, 
    getCompraById 
} = require('../controllers/compraController');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);

router.get('/', getCompras);
router.get('/:id', getCompraById);
router.post('/', createCompra);

module.exports = router;