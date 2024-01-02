const express = require('express');

const routerAuth = express.Router();


const userCtrl = require('../controllers/controllerUser');
const passwordChecker = require('../middlewares/passwordChecker');

routerAuth.post('/signup', passwordChecker, userCtrl.signup);
routerAuth.post('/login', userCtrl.login);

module.exports = routerAuth;