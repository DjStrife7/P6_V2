// On importe le package multer
const multer = require('multer');


// On prépare un dictionnaire afin de pouvoir générer l'extension des fichiers images
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

// On crée un objet de récupération pour Multer
// On crée une fonction qui va nous permettre de stocker ses informations sur le disque
const storage = multer.diskStorage({
  // On a besoin de 2 éléments, destination qui concerne l'endroit ou Multer va retourner les fichiers
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  //filename qui va permettre à Multer de savoir quel nom appliqué
  filename: (req, file, callback) => {
    // On récupère le nom d'origine et on le split afin de supprimer les espace vide pour les remplacer après par des '_'
    const name = file.originalname.split('.')[0].split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    // On recrée un nom de fichier exploitable à partir du nom refait plus haut, en ajoutant la date, le '.' et l'extension via le MIME_TYPES
    callback(null, name + '_' + Date.now() + '.' + extension);
  }
});


// On exporte le middleware avec en objet "storage", on lui indique que ceci est un fichier unique de type image
module.exports = multer({ storage: storage }).single('image');