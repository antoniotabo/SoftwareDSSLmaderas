const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);

router.get('/', getDashboard);

module.exports = router;