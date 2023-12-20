const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const maskData = require('maskdata');
const httpStatusCode = require('http-status-codes');

const User = require('../models/modelUser');


// On crée une const pour masquer l'adresse email
const emailMasked2Options = {
  maskWith: "*",
  unmaskedStartCharactersBeforeAt: 2,
  unmaskedStartCharactersAfterAt: 2,
  maskAtTheRate: false
};


// Création de fonction pour la création de nouveaux utilisateurs
exports.signup = (req, res, next) => {
  // On commence par encrypter le mot passe car ceci est une fonction asynchrone et est longue
  // On récupère le mot de passe du frontend et on fait 10 passes pour l'encryptage 
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: maskData.maskEmail2(req.body.email, emailMasked2Options),
        password: hash
      });
      
      user.save()
      .then(() => {
        return res.status(httpStatusCode.CREATED).json({
          message: 'Utilisateur enregistré !'
        })
      })
      .catch(error => {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          error: "Erreur d'enregistrement !"
        })
      });
    })
    .catch(error => {
      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        error
      })
    });
};

// Création de la fonction pour la connexion des utilisateurs existants dans la base de donnée
exports.login = (req, res, next) => {
  User.findOne({ email: maskData.maskEmail2(req.body.email, emailMasked2Options) })
    .then(User => {
      // On vérifie si l'utilisateur existe dans la base de donnée
      if (User === null) {
        // Si l'utilisateur n'existe pas alors on renvoi une erreur vague pour éviter d'informer les personnes malveillantes de récupérer des informations
        return res.status(httpStatusCode.FORBIDDEN).json({
          message: 'Paire identifiant/mot de passe incorrect'
        })
      } else {
        // Si l'utilisateur existe dans la base de donnée alors on va comparer le mot de passe avec celui dans la base de donnée
        bcrypt.compare(req.body.password, User.password)
          .then(valid => {
            // Si le mot de passe n'est pas bon, alors on renvoi la même erreur que précèdemment
            if (!valid) {
              return res.status(httpStatusCode.FORBIDDEN).json({
                message: 'Paire identifiant/mot de passe incorrect'
              })
            } else {
              // On retourne un objet qui va servir à l'authentification des requêtes
              return res.status(httpStatusCode.OK).json({
                userId: User._id,
                token: jwt.sign(
                  // On importe une fonction JsonWebToken avec les arguments suivants (payload)
                  { userId: User._id },
                  // Clé secrète pour l'encodage
                  process.env.RANDOM_TOKEN_KEY,
                  // Un argument de configuration, un délai d'expiration du token
                  { expiresIn: '24h' }
                )
              });
            }
          })
          .catch(error => {
            return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
              error
            })
          });
      }
    })
    .catch(error => {
      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        error
      })
    });
};