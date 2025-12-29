const express = require('express');
const router = express.Router();
const { 
    getClientes, 
    getClienteById, 
    createCliente, 
    updateCliente, 
    deleteCliente 
} = require('../controllers/clienteController');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken); // Protección global

router.get('/', getClientes);
router.get('/:id', getClienteById);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

module.exports = router;