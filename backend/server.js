// We import the HTTP package from node which allows us to create the server and our app file
const http = require('http');
const app = require('./app');

const MY_PORT = process.env.PORT;


app.set('port', MY_PORT);
const server = http.createServer(app);

server.listen(MY_PORT, () => {
  console.log(`Server running on port ${MY_PORT}`)
});