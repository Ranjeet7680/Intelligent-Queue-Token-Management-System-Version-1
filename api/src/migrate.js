const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

const tokensRoutes = require('./routes/tokens');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

// attach io so routes can emit
app.locals.io = io;

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('joinCounter', (counterId) => {
    socket.join(`counter:${counterId}`);
  });
  socket.on('joinKiosk', () => {
    socket.join('kiosk:all');
  });
  socket.on('disconnect', () => {
    // console.log('socket disconnected', socket.id);
  });
});

// API routes
app.use('/api/tokens', tokensRoutes);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
