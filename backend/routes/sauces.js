const express = require('express');

const routerSauce = express.Router();

const mwAuth = require('../middlewares/mwAuth');
const multer = require('../middlewares/multerConfig');

const sauceCtrl = require('../controllers/controllerSauce');


routerSauce.get('/', mwAuth, sauceCtrl.displayAllSauces);
routerSauce.post('/', mwAuth, multer, sauceCtrl.createOne);
routerSauce.get('/:id', mwAuth, sauceCtrl.findOne);
routerSauce.put('/:id', mwAuth, multer, sauceCtrl.modifyOne);
routerSauce.delete('/:id', mwAuth, sauceCtrl.deleteOne);
routerSauce.post('/:id/like', mwAuth, sauceCtrl.likeOne);

module.exports = routerSauce;