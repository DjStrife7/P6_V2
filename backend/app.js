
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv').config();

// On importe les routes créées pour les éléments d'authentification et de sauces
const modelRouteAuth = require('./routes/auth');
const modelRouteSauce = require('./routes/sauces');

const path = require('path');

// On crée une constante qui nous permet de créer une application Express
const app = express();


// On paramètre une connexion à notre base de données MongoDB Atlas et on lui demande de nous renvoyer une information pour nous dire si la connexion est bien effectuée ou non. Et on vérifie le corps de la requête.
mongoose.connect(process.env.DB_URL,
{ useNewUrlParser: true,
  useUnifiedTopology: true })
.then(() => console.log('Connexion à MongoDB Atlas réussie !'))
.catch(() => console.log('Connexion à MongoDB Atlas échouée !'));

app.use(express.json());

// On ajoute ce middleware afin de pouvoir accèder à notre API depuis n'importe quel origine, de sélectionner les méthodes authorisées et d'ajouter les headers pour les requêtes envoyées vers notre API. Cela nous permettra l'échange entre les différentes adresses (localhost:3000 et localhost:4200)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// On indique le chemin pour la route que l'on a définit plus haut en le rapprochant de modelRouteAuth et modelRouteSauce
app.use('/api/auth', modelRouteAuth);
app.use('/api/sauces', modelRouteSauce);
// On indique un gestionnaire de routage pour nos images
app.use('/images', express.static(path.join(__dirname, 'images')));

// On exporte notre application pour pouvoir y accèder depuis les autres fichiers de notre projet
module.exports = app;