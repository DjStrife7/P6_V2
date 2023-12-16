const modelSauce = require("../models/modelSauce");
// On importe le module file system
const fs = require('fs');

// Création d'une fonction pour renvoyer le tableau des sauces depuis la base de donnée
exports.displayAllSauces = (req, res, next) => {
  // console.log('Tableau des sauces');
  modelSauce.find()
    .then(sauces => {
      res.status(200).json(sauces)
    })
    .catch(error => {
      res.status(400).json({
        error
      })
    });
};

// Création d'une fonction pour renvoyer la sauce sélectionné par l'utilisateur via son _id
exports.findOne = (req, res, next) => {
  modelSauce.findOne({ _id: req.params.id })
    .then(sauce => {
      res.status(200).json(sauce)
    })
    .catch(error => {
      res.status(400).json({
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
      res.status(201).json({
        message: 'Sauce ajoutée !'
      })
    })
    .catch(error => {
      res.status(400).json({
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
        res.status(401).json({
          message: 'Non-autorisé'
        });
      } else {
        const filename = sauce.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
            modelSauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id })
              .then(() => {
                res.status(200).json({
                  message: 'Sauce modifiée !'
                });
              })
              .catch(error => {
                res.status(401).json({
                  error
                })
              });  
          });
        }
    })
    .catch((error) => {
      res.status(400).json({
        error
      });
    });
};

// Création d'une fonction pour supprimer la sauce sélectionnée via son _id
exports.deleteOne = (req, res, next) => {
  modelSauce.findOne({ _id: req.params.id})
      .then((sauce) => {
         if (sauce.userId != req.auth.userId) {
          res.status(401).json({
            message: 'Non-autorisé'
          });
         } else {
          const filename = sauce.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
            modelSauce.deleteOne({_id: req.params.id})
              .then(() => {
                res.status(200).json({
                  message: 'Sauce supprimée !'
                });
              })
              .catch(error => {
                res.status(401).json({
                  error
                })
              });
          });
         }
      })
      .catch(error => {
        res.status(500).json({
          error
        })
      });
};

// Création d'une fonction pour la création de "like" ou de "dislike" pour une sauce via son _id
exports.likeOne = (req, res, next) => {
  modelSauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      // On crée une const pour pouvoir modifier les valeurs que nous voulons éditer par la suite
      const newValues = {
        usersLiked: sauce.usersLiked,
        usersDisliked: sauce.usersDisliked,
        likes: 0,
        dislikes: 0
      }
      // On met en place une structure conditionnelle SWITCH/CASE qui va nous permettre d'executer une fonction en rapport avec la valeur d'une variable, en l'occurrence dans notre cas ce sera like
      switch (req.body.like) {
        // Dans le cas où l'utilisateur clique sur like, on pousse la nouvelle valeur dans le tableau usersLiked son userId
        case 1:
          newValues.usersLiked.push(req.body.userId);
          break;
        // Dans le cas où l'utilisateur enlève son avis, alors on execute une structure conditionnelle IF/ELSE  
        case 0:
          if (newValues.usersLiked.includes(req.body.userId)) {
            // Si l'utilisateur souhaite enlever son like alors on créer une const avec la méthode indexOf pour nous renvoyer la premier élément du tableau  et si il ne trouve rien il renverra automatiquement -1
            const indexLike = newValues.usersLiked.indexOf(req.body.userId);
            newValues.usersLiked.splice(indexLike, 1);
          } else {
            const indexDislike = newValues.usersDisliked.indexOf(req.body.userId);
            newValues.usersDisliked.splice(indexDislike, 1);
          }
          break;
        // Dans le cas où l'utilisateur clique sur dislike, on pousse la nouvelle valeur dans le tableau usersDisliked son userId  
        case -1:
          newValues.usersDisliked.push(req.body.userId);
          break;
      };

      // On met en place un système pour calculer les valeurs de nos like et Dislike pour notre sauce
      newValues.likes = newValues.usersLiked.length;
      newValues.dislikes = newValues.usersDisliked.length;
      
      // Ensuite on met à jour notre sauce et on l'affiche
      modelSauce.updateOne({ _id: req.params.id }, newValues)
        .then(() => {
          res.status(201).json({
            message: 'Votre avis a été mis à jour !'
          })
        })
        .catch((error) => {
          res.status(400).json({
            error
          });
        })

    })
    .catch((error) => {
      res.status(500).json({
        error
      })
    })
  };