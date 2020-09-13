const express = require('express');
const router = express.Router();

const pool = require('../database');
router.get('/', async (req, res) => {
    const emp=await pool.query('select nombreempresa from empresa where id=1');
    console.log(emp);
    res.render('index', {emp});
});

module.exports = router;