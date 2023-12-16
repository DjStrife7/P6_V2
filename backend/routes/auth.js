const express = require('express');
// On importe le middleware que nous avons réalisé
const routerAuth = express.Router();


const userCtrl = require('../controllers/controllerUser');

routerAuth.post('/signup', userCtrl.signup);
routerAuth.post('/login', userCtrl.login);

module.exports = routerAuth;