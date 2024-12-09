const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require('path');



const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);


const PORT = process.env. PORT || 5000;



app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/img', express.static(path.join(__dirname, '../img')));
app.use('/js', express.static(path.join(__dirname, 'src'))); 
app.use('/audio', express.static(path.join(__dirname, 'audio'))); 
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static("src"));
console.log('Musik-Dateien sind im Ordner:', path.join(__dirname, 'audio'));




const players = {}; 
let score = {};
const rooms = {};





io.on("connect", (socket) => {
    socket.on("create_or_join", (roomNumber) => {
        if (!rooms[roomNumber]) {
            rooms[roomNumber] = [];
        }
  
        rooms[roomNumber].push(socket.id);
        socket.join(roomNumber);
        socket.currentRoom = roomNumber;
        players[socket.id] = { id: socket.id, x: 0, y: 0, room: roomNumber,score: 0 };
        console.log(`Spieler ${socket.id} ist Raum ${roomNumber} beigetreten`);

        
        socket.emit("room_joined", roomNumber);
        updatePlayersInRoom(roomNumber);
  

        socket.on("playerMove", (movement) => {
            const room = socket.currentRoom;
            if (room && players[socket.id]) {
                players[socket.id].x = movement.x;
                players[socket.id].y = movement.y;
                updatePlayersInRoom(room);
            }
        });



        socket.on('updateScore', (scoreChange) => {
            const room = socket.currentRoom;
        
            if (room && players[socket.id]) {
                const parsedChange = parseInt(scoreChange, 10);
              
                players[socket.id].score = Math.max(0, players[socket.id].score + parsedChange);
                socket.emit('playerScoreUpdate', players[socket.id].score);
        
                
                let totalScore = 0;
                for (let playerId in players) {
                    const player = players[playerId];
                    if (player.room === room) {
                        totalScore += player.score;
                    }
                }
                io.to(room).emit('totalScoreUpdate', totalScore);
            }
        });
        
        


        socket.on('playerHit', (playerId) => {
            if (players[playerId]) {
                const now = Date.now();
        
                if (players[playerId].lastHit && now - players[playerId].lastHit < 2000) {
                    return;
                }
        
                players[playerId].lastHit = now;
                players[playerId].score = Math.max(0, players[playerId].score - 25);
                io.to(playerId).emit('playerScoreUpdate', players[playerId].score);
        
                
                const room = players[playerId].room;
                if (room) {
                    let totalScore = 0;
                    for (const id in players) {
                        if (players[id].room === room) {
                            totalScore += players[id].score;
                        }
                    }
                    io.to(room).emit('totalScoreUpdate', totalScore);
                }
            }
        });
        




        socket.on("disconnect", () => {
            const room = socket.currentRoom;
    
            if (room) {
                rooms[room] = rooms[room].filter((id) => id !== socket.id);
                delete players[socket.id];
    
                if (rooms[room].length === 0) {
                    delete rooms[room]; 
                } else {
                    updatePlayersInRoom(room);
                }
            }
        });
    
        function getPlayersInRoom(room) {
            return rooms[room].map((id) => players[id]); 
        }
    
       
        function updatePlayersInRoom(room) {
            const playersInRoom = getPlayersInRoom(room);
            io.to(room).emit("updatePlayers", playersInRoom); 
        }
    });



    
    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        if (players[socket.id]) {
            delete players[socket.id];
        }
        io.emit("updatePlayers", players);
    });


});




httpServer.listen(5000);





