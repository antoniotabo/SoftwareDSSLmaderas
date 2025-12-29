const express = require('express');
const router = express.Router();
const { 
    getFletes, 
    createFlete 
} = require('../controllers/fleteController');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);

router.get('/', getFletes);
router.post('/', createFlete);

module.exports = router;