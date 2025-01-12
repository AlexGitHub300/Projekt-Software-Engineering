const express = require("express"); // Importiert das Express-Framework, um den Webserver zu erstellen
const { createServer } = require("http"); // Importiert die Funktion, um einen HTTP-Server zu erstellen
const { Server } = require("socket.io");  // Importiert die Socket.IO-Server-Klasse für Echtzeit-Kommunikation
const path = require('path'); // Importiert das Path-Modul, um mit Dateipfaden zu arbeiten


// Erstellt die Server-Instanzen
const app = express(); // Erstellt eine Express-Anwendung.
const httpServer = createServer(app); // Erstellt einen HTTP-Server, der mit der Express-Anwendung gekoppelt ist
const io = new Server(httpServer); // Erstellt einen Socket.IO-Server, der mit dem HTTP-Server verbunden ist


// Definiert den Port, auf dem der Server laufen soll
const PORT = process.env. PORT || 5000;


// Definiert statische Verzeichnisse, die der Client verwenden kann
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/img', express.static(path.join(__dirname, '../img')));
app.use('/js', express.static(path.join(__dirname, 'src'))); 
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static("src"));




// Initialisiert Datenstrukturen
const players = {}; // Speichert Informationen zu den Spielern
let score = {}; // Speichert die Punktestände der Spieler
const rooms = {}; // Speichert Informationen zu den Spielräumen




// Event-Listener für Socket.IO-Verbindungen
io.on("connect", (socket) => { // Wird ausgeführt, wenn ein neuer Client eine Verbindung herstellt
    socket.on("create_or_join", (roomNumber) => { // Event, wenn ein Spieler einen Raum erstellen oder beitreten will
        if (!rooms[roomNumber]) { // Wenn der Raum noch nicht existiert:
            rooms[roomNumber] = []; // Erstellt eine neue Liste für den Raum
        }
  
        rooms[roomNumber].push(socket.id); // Fügt die Socket-ID des Spielers zur Raumliste hinzu
        socket.join(roomNumber); // Der Spieler tritt dem Raum bei

        socket.currentRoom = roomNumber; // Speichert die aktuelle Raumnummer des Spielers
        players[socket.id] = { id: socket.id, x: 0, y: 0, room: roomNumber,score: 0 }; // Initialisiert Spielerinformationen
        

        
        socket.emit("room_joined", roomNumber); // Sendet dem Spieler ein Event, dass er erfolgreich beigetreten ist
        updatePlayersInRoom(roomNumber); // Aktualisiert alle Spieler im Raum
  

        socket.on("playerMove", (movement) => { // Event, wenn sich ein Spieler bewegt
            const room = socket.currentRoom;  // Holt die aktuelle Raumnummer
            if (room && players[socket.id]) { // Überprüft, ob der Spieler existiert und in einem Raum ist
                players[socket.id].x = movement.x; // Aktualisiert die X-Koordinate
                players[socket.id].y = movement.y; // Aktualisiert die Y-Koordinate
                updatePlayersInRoom(room); // Aktualisiert die Spielerinformationen im Raum
            }
        });



        socket.on('updateScore', (scoreChange) => { // Event, wenn der Spieler seinen Punktestand ändert.
            const room = socket.currentRoom;
        
            if (room && players[socket.id]) {
                const parsedChange = parseInt(scoreChange, 10); // Konvertiert die Punktänderung in eine Zahl
              
                players[socket.id].score = Math.max(0, players[socket.id].score + parsedChange); // Aktualisiert den Punktestand des Spielers
                socket.emit('playerScoreUpdate', players[socket.id].score); // Sendet den neuen Punktestand an den Spieler
        
                // Berechnet den Gesamtpunktestand aller Spieler im Raum
                let totalScore = 0;
                for (let playerId in players) {
                    const player = players[playerId];
                    if (player.room === room) {
                        totalScore += player.score;
                    }
                }
                io.to(room).emit('totalScoreUpdate', totalScore); // Sendet den Gesamtpunktestand an alle Spieler im Raum
            }
        });
        
        


        socket.on('playerHit', (playerId) => { // Event, wenn ein Spieler getroffen wird
            if (players[playerId]) {
                const now = Date.now(); // Holt die aktuelle Zeit
        
                if (players[playerId].lastHit && now - players[playerId].lastHit < 2000) {
                    return; // Verhindert mehrfaches Treffen innerhalb von 2 Sekunden
                }
        
                players[playerId].lastHit = now; // Aktualisiert die letzte Trefferzeit
                players[playerId].score = Math.max(0, players[playerId].score - 25); // Verringert den Punktestand
                io.to(playerId).emit('playerScoreUpdate', players[playerId].score); // Sendet den neuen Punktestand an den Spieler
        
                
                // Berechnet den Gesamtpunktestand im Raum nach abzug der Punkte
                const room = players[playerId].room;
                if (room) {
                    let totalScore = 0;
                    for (const id in players) {
                        if (players[id].room === room) {
                            totalScore += players[id].score;
                        }
                    }
                    io.to(room).emit('totalScoreUpdate', totalScore); // Sendet den Gesamtpunktestand an den Raum
                }
            }
        });
        




        socket.on("disconnect", () => {  // Event, wenn ein Spieler die Verbindung trennt
            const room = socket.currentRoom; // Holt die aktuelle Raumnummer
    
            if (room) {
                rooms[room] = rooms[room].filter((id) => id !== socket.id); // Entfernt den Spieler aus dem Raum
                delete players[socket.id]; // Entfernt den Spieler aus der Spielerliste.
    
                if (rooms[room].length === 0) { // Wenn der Raum leer ist:
                    delete rooms[room]; // Löscht den Raum
                } else {
                    updatePlayersInRoom(room); // Aktualisiert die Spieler im Raum
                }
            }
        });
    
        function getPlayersInRoom(room) { // Gibt alle Spieler in einem Raum zurück
            return rooms[room].map((id) => players[id]); 
        }
    
       
        function updatePlayersInRoom(room) { // Aktualisiert die Spielerinformationen im Raum
            const playersInRoom = getPlayersInRoom(room);
            io.to(room).emit("updatePlayers", playersInRoom); // Sendet die aktualisierten Spielerinformationen an alle im Raum
        }
    });



    
    socket.on("disconnect", () => { // Zweites Disconnect-Event für globale Aktualisierungen
        console.log("user disconnected", socket.id); // Loggt die Trennung des Spielers
        if (players[socket.id]) {
            delete players[socket.id]; // Entfernt den Spieler aus der Spielerliste
        }
        io.emit("updatePlayers", players); // Aktualisiert alle Spielerinformationen
    });


});


// Startet den HTTP-Server auf dem angegebenen Port

httpServer.listen(5000);





