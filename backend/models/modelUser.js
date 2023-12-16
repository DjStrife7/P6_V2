const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// On crée un shcéma pour les utilisateurs comprenant leur email et leur mot de passe
const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// On applique le validateur au schéma avant de pouvoir en faire un modèle
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);