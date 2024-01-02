const multer = require('multer');


// We prepare a dictionary in order to be able to generate the extension of the image files
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

// We create a recovery object for Multer
// We create a function which will allow us to store its information on disk
const storage = multer.diskStorage({
  // We need 2 elements, destination which concerns the place where Multer will return the files
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  //filename which will allow Multer to know which name is applied
  filename: (req, file, callback) => {
    // We recover the original name and split it in order to remove the empty spaces and then replace them with '_'
    const name = file.originalname.split('.')[0].split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    // We recreate a usable file name from the name redone above, adding the date, the '.' and extension via MIME_TYPES
    callback(null, name + '_' + Date.now() + '.' + extension);
  }
});


// We export the middleware with the “storage” object, we tell it that this is a single image type file
module.exports = multer({ storage: storage }).single('image');