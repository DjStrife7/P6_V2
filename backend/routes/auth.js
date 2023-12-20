const express = require('express');

const routerAuth = express.Router();


const userCtrl = require('../controllers/controllerUser');

routerAuth.post('/signup', userCtrl.signup);
routerAuth.post('/login', userCtrl.login);

module.exports = routerAuth;