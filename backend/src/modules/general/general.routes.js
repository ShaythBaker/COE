const express = require('express');
const generalController = require('./general.controller');

const router = express.Router();

// General APIs grouped here
router.get('/health', generalController.getHealth);
router.get('/users', generalController.listUsers);

module.exports = router;
