const express = require('express');
const router = express.Router();
const contentCtrl = require('../controllers/contentCtrl')

router.get('/recommend', contentCtrl.getRecommendContent)

module.exports = router;