// On importe le package jsonWebToken
const jwt = require('jsonwebtoken');

// On prépare une fonction qui sera le middleware
module.exports = (req, res, next) => {
  try {
    // On crée une const afin de récupérer le token, et on divise la chaine de caractère en tableau et on choisit le deuxième élément de ce tableau
    const token = req.headers.authorization.split(' ')[1];
    // Ensuite on décode le token
    const decodedToken = jwt.verify(token, process.env.RANDOM_TOKEN_KEY);
    // On récupère le userId du token décodé
    const userId = decodedToken.userId;
    // console.log('token :' + token);
    // console.log('userId :' + userId);
    req.auth = {
      userId: userId,
    };
    // console.log(req.auth.userId);
    next();
  } 
  
  catch(error) {
    // console.log(error);
    res.status(401).json({ error })
  }
};