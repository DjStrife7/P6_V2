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
    imageUrl: imageUrlLocation(req.protocol, req.get('host')) + `/${req.file.filename}`,
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
    imageUrl: imageUrlLocation(req.protocol, req.get('host')) + `/${req.file.filename}`
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
      if(sauce.usersLiked.includes(req.body.userId)) {
        res.status(httpStatusCode.UNAUTHORIZED).json({
          message: 'Opération non valide !'
        });
      } else {
        if(sauce.usersDisliked.includes(req.body.userId)) {
          pullDislike(req.params.id, req.body.userId, res);
        } else {
          pushLike(req.params.id, req.body.userId, res);
        }
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
      if(sauce.usersDisliked.includes(req.body.userId)) {
        res.status(httpStatusCode.UNAUTHORIZED).json({
          message: 'Opération non valide !'
        });
      } else {
        if(sauce.usersLiked.includes(req.body.userId)) {
          pullLike(req.params.id, req.body.userId, res);
        } else {
          pushDislike(req.params.id, req.body.userId, res);
        }
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
      if(sauce.usersLiked.includes(req.body.userId)) {
        pullLike(req.params.id, req.body.userId, res);
      };
      if(sauce.usersDisliked.includes(req.body.userId)) {
        pullDislike(req.params.id, req.body.userId, res);
      }
    })
    .catch((error) => {
      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        error
      })
    });
  };
};




// Création dess fonctions pour PUSH ou PULL sur la DB les informations de like ou de dislike
function pushLike(productId, userId, res) {
  modelSauce.updateOne({ _id: productId }, {
    $push: { usersLiked: userId },
    $inc: { likes: +1 },
  })
  .then(() => {
    res.status(httpStatusCode.OK).json({
      message: 'Votre like a été ajouté pour cette sauce !'
    })
  })
  .catch(error => {
    res.status(httpStatusCode.BAD_REQUEST).json({
      error
    })
  });
};

function pullLike(productId, userId, res) {
  modelSauce.updateOne({ _id: productId }, {
    $pull: { usersLiked: userId },
    $inc: { likes: -1 },
  })
  .then(() => {
    res.status(httpStatusCode.OK).json({
      message: 'Vous like a été supprimé pour cette sauce !'
    })
  })
  .catch(error => {
    res.status(httpStatusCode.BAD_REQUEST).json({
      error
    })
  });
};

function pushDislike(productId, userId, res) {
  modelSauce.updateOne({ _id: productId }, {
    $push: { usersDisliked: userId },
    $inc: { dislikes: +1 },
  })
  .then(() => {
    res.status(httpStatusCode.OK).json({
      message: "Votre dislike a été ajouté pour cette sauce !"
    })
  })
  .catch(error => {
    res.status(httpStatusCode.BAD_REQUEST).json({
      error
    });
  })
};

function pullDislike(productId, userId, res) {
  modelSauce.updateOne({ _id: productId }, {
    $pull: { usersDisliked: userId },
    $inc: { dislikes: -1 },
  })
  .then(() => {
    res.status(httpStatusCode.OK).json({
      message: "Votre dislike a été supprimé pour cette sauce !"
    })
  })
  .catch(error => {
    res.status(httpStatusCode.BAD_REQUEST).json({
      error
    });
  })
};

// Création d'une fonction pour l'URL de l'image
function imageUrlLocation(protocolHttp, hostName) {
  let baseUrl = `${protocolHttp}://${hostName}`;
  let imgLocation = '/images';

  return completeUrl = baseUrl + imgLocation;
}