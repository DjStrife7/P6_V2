
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv').config();

// We import the routes created for the authentication and sauce elements
const modelRouteAuth = require('./routes/auth');
const modelRouteSauce = require('./routes/sauces');

const path = require('path');

// We create a constant which allows us to create an Express application
const app = express();


// We set up a connection to our MongoDB Atlas database and we ask it to send us information to tell us whether the connection is successful or not. And we check the body of the request.
mongoose.connect(process.env.DB_URL,
{ useNewUrlParser: true,
  useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB Atlas réussie !'))
  .catch(() => console.log('Connexion à MongoDB Atlas échouée !'));

app.use(express.json());

// We add the fact of being able to access our API from any origin, to select the authorized methods and to add the headers for the requests sent to our API. This will allow us to exchange between the different addresses (localhost:3000 and localhost:4200)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// We indicate the path for the route that we defined above by comparing it to modelRouteAuth and modelRouteSauce
app.use('/api/auth', modelRouteAuth);
app.use('/api/sauces', modelRouteSauce);
// We specify a routing manager for our images
app.use('/images', express.static(path.join(__dirname, 'images')));

// We bring our application to be able to access it from the other files of our project
module.exports = app;