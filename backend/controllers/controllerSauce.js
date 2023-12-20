const modelSauce = require('../models/modelSauce');
// On importe le module file system
const fs = require('fs');
const httpStatusCode = require('http-status-codes');


// Création d'une fonction pour renvoyer le tableau des sauces depuis la base de donnée
exports.displayAllSauces = (req, res, next) => {
  modelSauce.find()
    .then(sauces => {
      return res.status(httpStatusCode.OK).json(sauces)
    })
    .catch(error => {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        error
      })
    });
};

// Création d'une fonction pour renvoyer la sauce sélectionné par l'utilisateur via son _id
exports.findOne = (req, res, next) => {
  modelSauce.findOne({ _id: req.params.id })
    .then(sauce => {
      return res.status(httpStatusCode.OK).json(sauce)
    })
    .catch(error => {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        error
      })
    });
};

// Création d'une fonction pour la création d'une nouvelle sauce dans la base de donnée
exports.createOne = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new modelSauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: []
  });

  sauce.save()
    .then(() => {
      return res.status(httpStatusCode.CREATED).json({
        message: 'Sauce ajoutée !'
      })
    })
    .catch(error => {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        error
      })
    });
};

// Création d'une fonction pour la mise à jour d'une sauce via son _id
exports.modifyOne = (req, res, next) => {
  const sauceObject = req.file ? {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete sauceObject._userId;
  modelSauce.findOne({_id: req.params.id})
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        return res.status(httpStatusCode.UNAUTHORIZED).json({
          message: 'Non-autorisé'
        });
      } else {
        const filename = sauce.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
            modelSauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id })
              .then(() => {
                return res.status(httpStatusCode.OK).json({
                  message: 'Sauce modifiée !'
                });
              })
              .catch(error => {
                return res.status(httpStatusCode.UNAUTHORIZED).json({
                  error
                })
              });  
          });
        }
    })
    .catch((error) => {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        error
      });
    });
};

// Création d'une fonction pour supprimer la sauce sélectionnée via son _id
exports.deleteOne = (req, res, next) => {
  modelSauce.findOne({ _id: req.params.id})
      .then((sauce) => {
         if (sauce.userId != req.auth.userId) {
          return res.status(httpStatusCode.FORBIDDEN).json({
            message: 'Non-autorisé'
          });
         } else {
          const filename = sauce.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
            modelSauce.deleteOne({_id: req.params.id})
              .then(() => {
                return res.status(httpStatusCode.OK).json({
                  message: 'Sauce supprimée !'
                });
              })
              .catch(error => {
                return res.status(httpStatusCode.UNAUTHORIZED).json({
                  error
                })
              });
          });
         }
      })
      .catch(error => {
        return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
          error
        })
      });
};

// Création d'une fonction pour la création de "like" ou de "dislike" pour une sauce via son _id
exports.likeOne = (req, res, next) => {
  const like = req.body.like;

  // Ajout d'un like
  if(like === 1) {
    modelSauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      // On regarde tout d'abord si l'utilisateur n'a pas déjà like ou dislike la sauce
      if(sauce.usersLiked.includes(req.body.userId) || sauce.usersDisliked.includes(req.body.userId)) {
        res.status(httpStatusCode.UNAUTHORIZED).json({
          message: 'Opération non valide !'
        });
      } else {
        modelSauce.updateOne({ _id: req.params.id }, {
          // Du coup, on push le userId dans le tableau userLiked de la sauce
          $push: { usersLiked: req.body.userId },
          // Et on ajoute le like dans le compteur de la sauce
          $inc: { likes: +1 },
        })
        .then(() => {
          res.status(httpStatusCode.OK).json({
            message: 'Vous aimez cette sauce !'
          })
        })
        .catch(error => {
          res.status(httpStatusCode.BAD_REQUEST).json({
            error
          })
        });
      }

    })
    .catch((error) => {
      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        error
      })
    });
  };
  // Ajout d'un dislike
  if(like === -1) {
    modelSauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      // On regarde tout d'abord si l'utilisateur n'a pas déjà like ou dislike la sauce
      if(sauce.usersLiked.includes(req.body.userId) || sauce.usersDisliked.includes(req.body.userId)) {
        res.status(httpStatusCode.UNAUTHORIZED).json({
          message: 'Opération non valide !'
        });
      } else {
        modelSauce.updateOne({ _id: req.params.id }, {
          // Du coup, on push le userId dans le tableau userDisliked de la sauce
          $push: { usersDisliked: req.body.userId },
          // Et on ajoute le dislike dans le compteur de la sauce
          $inc: { dislikes: +1 },
        })
        .then(() => {
          res.status(httpStatusCode.OK).json({
            message: "Vous n'avez pas aimez cette sauce !"
          })
        })
        .catch(error => {
          res.status(httpStatusCode.BAD_REQUEST).json({
            error
          });
        })
      }

    })
    .catch((error) => {
      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        error
      })
    });
  };
  // Suppression de l'avis
  if(like === 0) {
    modelSauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      // On regarde tout d'abord si l'utilisateur est dans le tableau des like de la sauce
      if(sauce.usersLiked.includes(req.body.userId)) {
        modelSauce.updateOne({ _id: req.params.id }, {
          // Du coup, on pull le userId du le tableau userLiked de la sauce
          $pull: { usersLiked: req.body.userId },
          // Et on retire le like dans le compteur de la sauce
          $inc: { likes: -1 },
        })
        .then(() => {
          res.status(httpStatusCode.OK).json({
            message: "Votre avis a été retiré !"
          })
        })
        .catch(error => {
          res.status(httpStatusCode.BAD_REQUEST).json({
            error
          })
        });
      };
      // On regarde tout d'abord si l'utilisateur est dans le tableau des dislike de la sauce
      if(sauce.usersDisliked.includes(req.body.userId)) {
        modelSauce.updateOne({ _id: req.params.id }, {
          // Du coup, on pull le userId du le tableau userDisliked de la sauce
          $pull: { usersDisliked: req.body.userId },
          // Et on retire le dislike dans le compteur de la sauce
          $inc: { dislikes: -1 },
        })
        .then(() => {
          res.status(httpStatusCode.OK).json({
            message: "Votre avis a été retiré !"
          })
        })
        .catch(error => {
          res.status(httpStatusCode.BAD_REQUEST).json({
            error
          });
        })
      };
    })
    .catch((error) => {
      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        error
      })
    });
  };
};