const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cryptoJs = require('crypto-js');
const httpStatusCode = require('http-status-codes');

const User = require('../models/modelUser');


// Creation of function for the creation of new users
exports.signup = (req, res, next) => {
  // Creating user email encryption
  const emailCrypt = cryptoJs
    .HmacSHA256(req.body.email, process.env.SECRET_KEY)
    .toString();

  // We start by encrypting the password because this is an asynchronous function and is long.
  // We retrieve the frontend password and do 10 passes for encryption
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: emailCrypt,
        password: hash
      });
      
      user.save()
      .then(() => {
        console.log('Utilisateur enregistré!');
        return res.status(httpStatusCode.CREATED).json({
          message: 'Compte crée avec succès !'
        })
      })
      .catch(error => {
        console.log("Création de compte impossible");
        return res.status(httpStatusCode.BAD_REQUEST).json({
          error: "Création de compte impossible !"
        })
      });
    })
    .catch(error => {
      console.log("Erreur serveur lors de l'enregistrement !");
      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        error : "Erreur serveur lors de l'enregistrement !"
      })
    });
};

// Creation of the function for connecting existing users to the database
exports.login = (req, res, next) => {
  const emailCrypt = cryptoJs
    .HmacSHA256(req.body.email, process.env.SECRET_KEY)
    .toString();


  User.findOne({ email: emailCrypt })
    .then(User => {
      // We check if the user exists in the database
      if (User === null) {
        console.log('Paire identifiant/mot de passe incorrect');
        // If the user does not exist then we return a vague error to avoid informing malicious people to retrieve information
        return res.status(httpStatusCode.UNAUTHORIZED).json({
          message: 'Paire identifiant/mot de passe incorrect'
        })
      } else {
        // If the user exists in the database then we will compare the password with that in the database
        bcrypt.compare(req.body.password, User.password)
          .then(valid => {
            // If the password is not good, then we return the same error as before
            if (!valid) {
              console.log('Paire identifiant/mot de passe incorrect');
              return res.status(httpStatusCode.UNAUTHORIZED).json({
                message: 'Paire identifiant/mot de passe incorrect'
              })
            } else {
              console.log('Authentification réussie !');
              // We return an object which will be used for request authentication
              return res.status(httpStatusCode.OK).json({
                userId: User._id,
                token: jwt.sign(
                  // We import a JsonWebToken function with the following arguments (payload)
                  { userId: User._id },
                  // Secret key for encoding
                  process.env.RANDOM_TOKEN_KEY,
                  // A configuration argument, a token expiration time
                  { expiresIn: '24h' }
                )
              });
            }
          })
          .catch(error => {
            console.log('Erreur serveur lors de la connexion !');
            return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
              error
            })
          });
      }
    })
    .catch(error => {
      console.log('Erreur serveur lors de la connexion !');
      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        error
      })
    });
};