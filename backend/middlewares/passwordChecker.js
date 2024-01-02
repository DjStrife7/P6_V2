const passwordValidator = require('password-validator');
const httpStatusCode = require('http-status-codes');


const passwordSchema = new passwordValidator();

passwordSchema
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits(2)                                // Must have at least 2 digits
.has().not().spaces()                           // Should not have spaces
.is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values


module.exports = (req, res, next) => {
  if(passwordSchema.validate(req.body.password)){
    next();
  } else {
    console.log('Mot de passe trop faible !');
    return res.status(httpStatusCode.BAD_REQUEST).json({
      error: `Votre mot de passe doit contenir au moins 8 caractères ! ${passwordSchema.validate('req.body.password', { list: true })}`
    }) 
  }
}