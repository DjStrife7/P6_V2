const modelSauce = require('../models/modelSauce');
// We import the file system module
const fs = require('fs');
const httpStatusCode = require('http-status-codes');


// Creation of a function to return the table of sauces from the database
exports.displayAllSauces = (req, res, next) => {
  modelSauce.find()
    .then(sauces => {
      console.log(sauces);
      return res.status(httpStatusCode.OK).json(sauces)
    })
    .catch(error => {
      console.log("Impossible d'afficher la liste des sauces !");
      return res.status(httpStatusCode.BAD_REQUEST).json({
        error : "Impossible d'afficher la liste des sauces !"
      })
    });
};

// Creation of a function to return the sauce selected by the user via its _id
exports.findOne = (req, res, next) => {
  modelSauce.findOne({ _id: req.params.id })
    .then(sauce => {
      console.log("Affichage de la sauce effectuée !");
      return res.status(httpStatusCode.OK).json(sauce)
    })
    .catch(error => {
      console.log("Impossible de trouver la sauce !");
      return res.status(httpStatusCode.BAD_REQUEST).json({
        error : "Impossible de trouver la sauce !"
      })
    });
};

// Creation of a function for creating a new sauce in the database
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
      console.log('Sauce ajoutée avec succès !');
      return res.status(httpStatusCode.CREATED).json({
        message: 'Sauce ajoutée !'
      })
    })
    .catch(error => {
      console.log("Impossible d'ajouter la sauce !");
      return res.status(httpStatusCode.BAD_REQUEST).json({
        error : "Impossible d'ajouter la sauce !"
      })
    });
};

// Creation of a function for updating a sauce via its _id
exports.modifyOne = (req, res, next) => {
  const sauceObject = req.file ? {
    ...JSON.parse(req.body.sauce),
    imageUrl: imageUrlLocation(req.protocol, req.get('host')) + `/${req.file.filename}`
  } : { ...req.body };

  delete sauceObject._userId;
  modelSauce.findOne({_id: req.params.id})
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        console.log("Vous n'êtes pas authorisé à modifier cette sauce !");
        return res.status(httpStatusCode.UNAUTHORIZED).json({
          message: 'Action non-autorisée !'
        });
      } else {
        const filename = sauce.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
            modelSauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id })
              .then(() => {
                console.log('Sauce modifiée avec succès !');
                return res.status(httpStatusCode.OK).json({
                  message: 'Sauce modifiée !'
                });
              })
              .catch(error => {
                console.log("Vous n'êtes pas authorisé à modifier cette sauce !");
                return res.status(httpStatusCode.UNAUTHORIZED).json({
                  error : "Vous n'êtes pas authorisé à modifier cette sauce !"
                })
              });  
          });
        }
    })
    .catch((error) => {
      console.log("Erreur serveur lors de la modification de la sauce !");
      return res.status(httpStatusCode.BAD_REQUEST).json({
        error : "Erreur serveur lors de la modification de la sauce !"
      });
    });
};

// Creation of a function to delete the sauce selected via its _id
exports.deleteOne = (req, res, next) => {
  modelSauce.findOne({ _id: req.params.id})
      .then((sauce) => {
         if (sauce.userId != req.auth.userId) {
          console.log("Vous n'êtes pas authorisé à supprimer cette sauce !");
          return res.status(httpStatusCode.FORBIDDEN).json({
            message: 'Action interdite !'
          });
         } else {
          const filename = sauce.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
            modelSauce.deleteOne({_id: req.params.id})
              .then(() => {
                console.log("Sauce supprimée avec succès !");
                return res.status(httpStatusCode.OK).json({
                  message: 'Sauce supprimée !'
                });
              })
              .catch(error => {
                console.log("Vous n'êtes pas authorisé à supprimer cette sauce !");
                return res.status(httpStatusCode.UNAUTHORIZED).json({
                  error : "Vous n'êtes pas authorisé à supprimer cette sauce !"
                })
              });
          });
         }
      })
      .catch(error => {
        console.log("Erreur serveur lors de la suppression de la sauce !");
        return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
          error : "Erreur serveur lors de la suppression de la sauce !"
        })
      });
};

// Creation of a function for creating "like" or "dislike" for a sauce via its _id
exports.likeOne = (req, res, next) => {
  const like = req.body.like;

  // Added a function to check that the input is 1, -1 or 0
  if(like != 1 && like != -1 && like != 0) {
    console.log("Erreur serveur lors de la modification de votre avis !");
    return res.status(httpStatusCode.UNAUTHORIZED).json({
      message: 'Opération non-authorisée !'
    });
  }

  // Adding a like
  if(like === 1) {
    modelSauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if(sauce.usersLiked.includes(req.body.userId)) {
        console.log("Vous avez déjà liked cette sauce !");
        return res.status(httpStatusCode.UNAUTHORIZED).json({
          message: 'Opération non authorisé !'
        });
      } else {
        if(sauce.usersDisliked.includes(req.body.userId)) {
          console.log("like=1 -> Vous avez déjà disliked cette sauce !");
          pullDislike(req.params.id, req.body.userId, res);
        } else {
          console.log("like=1 -> Vous avez liked cette sauce !");
          pushLike(req.params.id, req.body.userId, res);
        }
      }
    })
    .catch((error) => {
      console.log("Erreur serveur lors de l'ajout d'un like à la sauce !");
      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        error : "Erreur serveur lors de l'ajout d'un like à la sauce !"
      })
    });
  };

  // Adding a dislike
  if(like === -1) {
    modelSauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if(sauce.usersDisliked.includes(req.body.userId)) {
        console.log("Vous avez déjà disliked cette sauce !");
        return res.status(httpStatusCode.UNAUTHORIZED).json({
          message: 'Opération non valide !'
        });
      } else {
        if(sauce.usersLiked.includes(req.body.userId)) {
          console.log("like=-1 -> Vous avez déjà liked cette sauce !");
          pullLike(req.params.id, req.body.userId, res);
        } else {
          console.log("like=-1 -> Vous avez disliked cette sauce !");
          pushDislike(req.params.id, req.body.userId, res);
        }
      }

    })
    .catch((error) => {
      console.log("Erreur serveur lors de l'ajout d'un dislike à la sauce !");
      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        error : "Erreur serveur lors de l'ajout d'un dislike à la sauce !"
      })
    });
  };

  // Deleting the review
  if(like === 0) {
    modelSauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if(sauce.usersLiked.includes(req.body.userId)) {
        console.log("like=0 -> Vous avez supprimé votre like de cette sauce !");
        pullLike(req.params.id, req.body.userId, res);
      } else {
        if(sauce.usersDisliked.includes(req.body.userId)) {
          console.log("like=0 -> Vous avez supprimé votre dislike de cette sauce !");
          pullDislike(req.params.id, req.body.userId, res);
        } else {
          console.log("Vous n'avez pas donné votre avis pour cette sauce !");
          return res.status(httpStatusCode.UNAUTHORIZED).json({
            error : "Vous n'avez pas donné votre avis pour cette sauce !"
          });
        }
      };
    })
    .catch((error) => {
      console.log("Erreur serveur lors de la suppression de votre avis !");
      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        error : "Erreur serveur lors de la suppression de votre avis !"
      })
    });
  };
  
};




// Creation of functions for PUSH or PULL on the DB like or dislike information
function pushLike(productId, userId, res) {
  modelSauce.updateOne({ _id: productId }, {
    $push: { usersLiked: userId },
    $inc: { likes: +1 },
  })
  .then(() => {
    console.log("pushLike -> Votre like a été ajouté avec succès !");
    return res.status(httpStatusCode.OK).json({
      message: 'pushLike -> Votre like a été ajouté pour cette sauce !'
    })
  })
  .catch(error => {
    console.log("Erreur serveur lors de l'ajout de votre like !");
    return res.status(httpStatusCode.BAD_REQUEST).json({
      error : "Erreur serveur lors de l'ajout de votre like !"
    })
  });
};

function pullLike(productId, userId, res) {
  modelSauce.updateOne({ _id: productId }, {
    $pull: { usersLiked: userId },
    $inc: { likes: -1 },
  })
  .then(() => {
    console.log("pullLike -> Votre like a été supprimé avec succès !");
    return res.status(httpStatusCode.OK).json({
      message: 'pullLike -> Votre like a été supprimé pour cette sauce !'
    })
  })
  .catch(error => {
    console.log("Erreur serveur lors de la suppression de votre like !");
    return res.status(httpStatusCode.BAD_REQUEST).json({
      error : "Erreur serveur lors de la suppression de votre like !"
    })
  });
};

function pushDislike(productId, userId, res) {
  modelSauce.updateOne({ _id: productId }, {
    $push: { usersDisliked: userId },
    $inc: { dislikes: +1 },
  })
  .then(() => {
    console.log("pushDislike -> Votre dislike a été ajouté avec succès !");
    return res.status(httpStatusCode.OK).json({
      message: "pushDislike -> Votre dislike a été ajouté pour cette sauce !"
    })
  })
  .catch(error => {
    console.log("Erreur serveur lors de l'ajout de votre dislike !");
    return res.status(httpStatusCode.BAD_REQUEST).json({
      error : "Erreur serveur lors de l'ajout de votre dislike !"
    });
  })
};

function pullDislike(productId, userId, res) {
  modelSauce.updateOne({ _id: productId }, {
    $pull: { usersDisliked: userId },
    $inc: { dislikes: -1 },
  })
  .then(() => {
    console.log("pullDislike -> Votre dislike a été supprimé avec succès !");
    return res.status(httpStatusCode.OK).json({
      message: "pullDislike -> Votre dislike a été supprimé pour cette sauce !"
    })
  })
  .catch(error => {
    console.log("Erreur serveur lors de la suppression de votre dislike !");
    return res.status(httpStatusCode.BAD_REQUEST).json({
      error : "Erreur serveur lors de la suppression de votre dislike !"
    });
  })
};

// Création d'une fonction pour l'URL de l'image
function imageUrlLocation(protocolHttp, hostName) {
  const baseUrl = `${protocolHttp}://${hostName}`;
  const imgLocation = '/images';

  return completeUrl = baseUrl + imgLocation;
}