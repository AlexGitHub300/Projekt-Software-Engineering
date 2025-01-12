//Verbindet Client mit dem Server
const socket = io("http://localhost:5000");

// Zum überprüen der Verbindung mit dem Server
socket.on("connect", () => {
    console.log("connected");
});



// Holt das HTML-Canvas-Element mit der ID "canvas"
const canvas = document.getElementById("canvas")
// Erstellt den Kontext für 2D-Zeichnungen auf dem Canvas
const ctx = canvas.getContext("2d")

// Setzt die Breite und Höhe des Canvas auf die Breite und Höhe des Browserfensters
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
 


// Erstellt ein Bildobjekt und lädt das Bild "fatcat.png"
const img = new Image();
img.src = "/img/fatcat.png";
img.onload = function () {
    update();// Startet das Update der Animation, sobald das Bild geladen ist
};


// Definiert Bewegungs- und Statusvariablen
let movement = { x: 0, y: 0,}; // Bewegung des Spielers
let x = 0; // Aktuelle X-Koordinate des Spielers
let y = 0; // Aktuelle Y-Koordinate des Spielers
let vxl = 0; // Geschwindigkeit nach links
let vxr = 0; // Geschwindigkeit nach rechts
let vy = 0; // Vertikale Geschwindigkeit (z. B. Sprung)
let grounded = false; // Gibt an, ob der Spieler den Boden berührt
let otherPlayers = {}; // Speichert Daten anderer Spieler

// Aktualisiert die Positionen anderer Spieler, wenn vom Server neue Daten empfangen werden
socket.on("updatePlayers", (players) => {
    otherPlayers = players;
});

// Aktualisiert die Bewegungsdaten des Spielers
function updateMovement() {
    movement.x = x;
    movement.y = y;
}
// Zeichnet andere Spieler auf dem Canvas
function drawOtherPlayers() {
    Object.values(otherPlayers).forEach((player) => {
        if (player.id !== socket.id) {
            ctx.drawImage(img, player.x, player.y, 300, 300);
        }
    });
}



// Überprüft Kollisionen zwischen Spieler und Boden/Objekten
function collision() {
    if (y >= canvas.height - 250) { // Wenn der Spieler den Boden berührt
        y = canvas.height - 250; // Begrenze die Y-Position auf den Boden
        grounded = true; // Setze grounded auf true
    }

    // Definiert die Begrenzung des Spielers (Hitbox)
    const playerRect = { x: x + 130, y: y, width: 30, height: 30 };  
    
    // Holt/Spawned alle Hindernisse (obstacle)
    const obstacles = document.querySelectorAll(".obstacle, .obstacle2");

    
    // Überprüft auf Kollision mit jedem Hindernis
    obstacles.forEach(obstacle => {
        const obstacleRect = obstacle.getBoundingClientRect();
        if (
            playerRect.x < obstacleRect.x + obstacleRect.width &&
            playerRect.x + playerRect.width > obstacleRect.x &&
            playerRect.y < obstacleRect.y + obstacleRect.height &&
            playerRect.y + playerRect.height > obstacleRect.y
        ) {
            
            socket.emit('playerHit', socket.id); // Informiert den Server über eine Kollision
        }
    });
}



// Führt die Haupt-Update-Schleife der Animation aus
function update(){
    ctx.clearRect(0,0,canvas.width,canvas.height)  // Löscht den Canvas
    x += vxl; // Aktualisiert die X-Position basierend auf der linken Geschwindigkeit
    x += vxr; // Aktualisiert die X-Position basierend auf der rechten Geschwindigkeit
    y += vy; // Aktualisiert die Y-Position
    ctx.drawImage(img, x, y, 300, 300); // Zeichnet das Spielerbild
    collision() // Überprüft Kollisionen
    updateMovement(); // Aktualisiert die Bewegungsdaten
    drawOtherPlayers(); // Zeichnet andere Spieler
    requestAnimationFrame(update) // Fordert das nächste Frame an
    socket.emit("playerMove", movement); // Sendet Bewegungsdaten an den Server
}
// Startet das erste Update der Animation
update()



// Simuliert Gravitation 
setInterval(function Gravity(){
    if (grounded == false){
        vy += 0.08
    }
})



// Event-Listener für Tastendrücke
addEventListener("keydown", function(e){
    if (e.code =='KeyD') vxr = 5;
    if (e.code =='KeyA') vxl = -5;
    if (e.code =='Space'){
        if (grounded){
            vy = -6, grounded = false;
        }
    } 
    socket.emit("playerMove", movement); // Sendet Bewegung an den Server


})

// Event-Listener für das Loslassen von Tasten
addEventListener("keyup", function(e){
    if (e.code =='KeyD') vxr = 0;
    if (e.code =='KeyA') vxl = 0;
socket.emit("playerMove", movement);
})


// Event-Listener für das Beitreten einer Lobby
let currentRoom = null;
document.getElementById("joinRoomButton").addEventListener("click", (e) => {
    e.preventDefault(); // Verhindert das Neuladen der Seite

    // Validiert die Eingabe (darf nur eine Zahl sein)
    const roomNumber = document.getElementById("roomInput").value.trim();
    if (!/^\d+$/.test(roomNumber)) {
        alert("Bitte eine gültige Zahl für die Lobby eingeben!");
        return;
    }
    socket.emit("create_or_join", roomNumber); // Sendet Beitrittsanfrage an den Server

    
    socket.on("room_joined", (room) => {  // Wenn der Server den Beitritt bestätigt
        currentRoom = room; // Speichert die aktuelle Lobby
        document.getElementById("page1").style.display = "none"; // Versteckt Seite 1
        document.getElementById("page2").style.display = "block"; // Zeigt Seite 2
        loadQuestion(); // Lädt die erste Frage

    });

    
});





//Startet von der ersten Frage 
let currentIndex = 0;
let step = 0;
// Lädt und zeigt die nächste Frage
function loadQuestion() {
    const cards = JSON.parse(localStorage.getItem("cards")) || [];
    const questionBox = document.getElementById("questionBox");

    if (cards.length === 0) {
        questionBox.textContent = "Keine Frage verfügbar.";
        return;
    }

    const card = cards[currentIndex];

    if (step === 0) { // Zeigt nur die Frage an
        
        questionBox.innerHTML = `<h3>Frage: ${card.question}</h3>`;
        const nextButton = document.createElement("button");
        nextButton.textContent = "Weiter";
        nextButton.onclick = () => {
            step = 1;
            loadQuestion();
        };
        questionBox.appendChild(nextButton);
    } else if (step === 1) { // Zeigt Frage und Antwort an, wenn der Button Weiter gedrückt wurde
        
        questionBox.innerHTML = 
        `<h3>Frage: ${card.question}</h3>
            <p>Antwort: ${card.answer}</p>`;
        const schlechtButton = document.createElement("button"); //Zeigt die nächste Frage
        schlechtButton.textContent = "Ich lag falsch";
        schlechtButton.onclick = () => {
            step = 0;
            currentIndex++;
            if (currentIndex >= cards.length) currentIndex = 0;
            loadQuestion();
        };
        const gutButton = document.createElement("button"); //Button, wenn gedrückt 100 + und zeigt nächste Frage 
        gutButton.textContent = "Ich lag richtig";
        gutButton.onclick = () => {
            socket.emit('updateScore', 100); 
            step = 0;
            currentIndex++;
            if (currentIndex >= cards.length) currentIndex = 0;
            loadQuestion();
        };
        //Buttons "Ich lag falsch" und "Ich lag richtig" im HTML-Element mit der ID questionBox einzufügen.
        questionBox.appendChild(schlechtButton); 
        questionBox.appendChild(gutButton);
    }
    
}

// Zeigt den Gesamtscore aller Spieler an
socket.on('totalScoreUpdate', (totalScore) => {
    const totalScoreBox = document.getElementById("totalScoreBox");
    totalScoreBox.textContent = `Gesamtpunkte aller Spieler: ${totalScore}`;
});
// Zeigt den Score des aktuellen Spielers an
socket.on('playerScoreUpdate', (newScore) => {
    const scoreBox = document.getElementById("scoreBox");
    scoreBox.textContent = `Punkte: ${newScore}`;
});

// Lädt die erste Frage, wenn die Seite geladen wird
window.onload = () => {
    loadQuestion();
};




