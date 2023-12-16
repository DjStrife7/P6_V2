// On importe les packages dans notre fichier via les const suivantes
const express = require('express');

const routerSauce = express.Router();

// On importe le middleware que nous avons réalisé
const mwAuth = require('../middleware/mwAuth');
const multer = require('../middleware/multerConfig');

const sauceCtrl = require('../controllers/controllerSauce');


routerSauce.get('/', mwAuth, sauceCtrl.displayAllSauces);
routerSauce.post('/', mwAuth, multer, sauceCtrl.createOne);
routerSauce.get('/:id', mwAuth, sauceCtrl.findOne);
routerSauce.put('/:id', mwAuth, multer, sauceCtrl.modifyOne);
routerSauce.delete('/:id', mwAuth, sauceCtrl.deleteOne);
routerSauce.post('/:id/like', mwAuth, sauceCtrl.likeOne);

module.exports = routerSauce;