const jwt = require('jsonwebtoken');
const httpStatusCode = require('http-status-codes');

// We prepare a function which will be the middleware
module.exports = (req, res, next) => {
  try {
    // We create a const in order to retrieve the token, and we divide the character string into an array and we choose the second element of this array
    const token = req.headers.authorization.split(' ')[1];
    // Then we decode the token
    const decodedToken = jwt.verify(token, process.env.RANDOM_TOKEN_KEY);
    // We recover the userId of the decoded token
    const userId = decodedToken.userId;

    req.auth = {
      userId: userId,
    };
    if(req.body.userId && req.body.userId !== userId) {
      console.log("Id de l'utilisateur n'est pas valide !");
      return res.status(httpStatusCode.BAD_REQUEST).json({
        error: "L'id de l'utilisateur n'est pas valide !"
      })
    } else {
      next();
    }
  } 
  
  catch(error) {
    console.log("Erreur serveur lors de l'authentification : " + error.message);
    return res.status(httpStatusCode.UNAUTHORIZED).json({ 
      error : "Erreur serveur lors de l'authentification !"
    })
  }
};