// On importe le package HTTP de node qui nous permet de créer le serveur et notre fichier app
const http = require('http');
const app = require('./app');

const MY_PORT = process.env.PORT;


app.set('port', MY_PORT || 3000);
const server = http.createServer(app);

server.listen(MY_PORT, () => {
  console.log(`Server running on port ${MY_PORT}`)
});