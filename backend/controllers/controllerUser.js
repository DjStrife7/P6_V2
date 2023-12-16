// On importe le package Bcrypt & JsonWebToken qui va nous servir à l'encryptage des mot de passe utilisateurs
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// On importe le modèle user afin de lire et enregistrer des utilisateurs dans ces middlewares
const User = require('../models/modelUser');

// Création de fonction pour la création de nouveaux utilisateurs
exports.signup = (req, res, next) => {
  // On commence par encrypter le mot passe car ceci est une fonction asynchrone et est longue
  // On récupère le mot de passe du frontend et on fait 10 passes pour l'encryptage 
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: req.body.email,
        password: hash
      });
      // On enregistre l'utilisateur dans la base de donnée
      user.save()
      .then(() => {
        res.status(201).json({
          message: 'Utilisateur enregistré !'
        })
      })
      .catch(error => {
        res.status(400).json({
          error
        })
      });
    })
    .catch(error => {
      // On affiche une erreur serveur via le code 500
      res.status(500).json({
        error
      })
    });
};

// Création de la fonction pour la connexion des utilisateurs existants dans la base de donnée
exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then(User => {
      // On vérifie si l'utilisateur existe dans la base de donnée
      if (User === null) {
        // Si l'utilisateur n'existe pas alors on renvoi une erreur vague pour éviter d'informer les personnes malveillantes de récupérer des informations
        res.status(401).json({
          message: 'Paire identifiant/mot de passe incorrect'
        })
      } else {
        // Si l'utilisateur existe dans la base de donnée alors on va comparer le mot de passe avec celui dans la base de donnée
        bcrypt.compare(req.body.password, User.password)
          .then(valid => {
            // Si le mot de passe n'est pas bon, alors on renvoi la même erreur que précèdemment
            if (!valid) {
              res.status(401).json({
                message: 'Paire identifiant/mot de passe incorrect'
              })
            } else {
              // On retourne un objet qui va servir à l'authentification des requêtes
              res.status(200).json({
                userId: User._id,
                token: jwt.sign(
                  // On importe une fonction JsonWebToken avec les arguments suivants (payload)
                  { userId: User._id },
                  // Clé secrète pour l'encodage
                  'RANDOM_TOKEN_SECRET',
                  // Un argument de configuration, un délai d'expiration du token
                  { expiresIn: '24h' }
                )
              });
            }
          })
          .catch(error => {
            res.status(500).json({
              error
            })
          });
      }
    })
    .catch(error => {
      res.status(500).json({
        error
      })
    });
};