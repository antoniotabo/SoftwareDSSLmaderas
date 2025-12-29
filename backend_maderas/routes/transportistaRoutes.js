const express = require('express');
const router = express.Router();
const { 
    getTransportistas, 
    createTransportista, 
    updateTransportista, 
    deleteTransportista 
} = require('../controllers/transportistaController');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);

router.get('/', getTransportistas);
router.post('/', createTransportista);
router.put('/:id', updateTransportista);
router.delete('/:id', deleteTransportista);

module.exports = router;