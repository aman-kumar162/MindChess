const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');
const { log } = require('console');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'w';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: "Chess 😜😜" });
});

io.on('connection', (socket) => {
    console.log("connected", socket.id);

    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", 'w');
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit('playerRole', 'b');
    } else {
        socket.emit("spectatorRole");
    }

    socket.on('disconnect', () => {
        if (socket.id === players.white) {
            delete players.white;
        } else if (socket.id === players.black) {
            delete players.black;
        }
    });

    socket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && socket.id !== players.white) return;
            if (chess.turn() === 'b' && socket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move); // Broadcast the valid move
                io.emit('boardState', chess.fen()); // Send the current board state
            } else {
                log("Invalid move:", move);
                socket.emit("invalidMove", move);
            }
        } catch (err) {
            log(err);
            socket.emit("invalidMove", move);
        }
    });
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
