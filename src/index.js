const socket = io("https://projekt-software-engineering-production.up.railway.app");


socket.on("connect", () => {
    console.log("connected");
});




const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
 



const img = new Image();
img.src = "/img/fatcat.png";
img.onload = function () {
    update();
};



let movement = { x: 0, y: 0,};
let x = 0;
let y = 0;
let vxl = 0;
let vxr = 0;
let vy = 0;
let grounded = false;
let otherPlayers = {};


socket.on("updatePlayers", (players) => {
    otherPlayers = players;
});


function updateMovement() {
    movement.x = x;
    movement.y = y;
}
function drawOtherPlayers() {
    Object.values(otherPlayers).forEach((player) => {
        if (player.id !== socket.id) {
            ctx.drawImage(img, player.x, player.y, 300, 300);
        }
    });
}




function collision() {
    if (y >= canvas.height - 250) {
        y = canvas.height - 250;
        grounded = true;
    }

    const playerRect = { x: x + 130, y: y, width: 30, height: 30 };  
    const obstacles = document.querySelectorAll(".obstacle, .obstacle2");

    obstacles.forEach(obstacle => {
        const obstacleRect = obstacle.getBoundingClientRect();
        if (
            playerRect.x < obstacleRect.x + obstacleRect.width &&
            playerRect.x + playerRect.width > obstacleRect.x &&
            playerRect.y < obstacleRect.y + obstacleRect.height &&
            playerRect.y + playerRect.height > obstacleRect.y
        ) {
            
            socket.emit('playerHit', socket.id);
        }
    });
}




function update(){
    ctx.clearRect(0,0,canvas.width,canvas.height)
    x += vxl;
    x += vxr;
    y += vy;
    ctx.drawImage(img, x, y, 300, 300);
    collision()
    updateMovement();
    drawOtherPlayers();
    requestAnimationFrame(update)
    collision()
    socket.emit("playerMove", movement);
}

update()




setInterval(function Gravity(){
    if (grounded == false){
        vy += 0.08
    }
})




addEventListener("keydown", function(e){
    if (e.code =='KeyD') vxr = 5;
    if (e.code =='KeyA') vxl = -5;
    if (e.code =='Space'){
        if (grounded){
            vy = -6, grounded = false;
        }
    } 
    socket.emit("playerMove", movement);


})


addEventListener("keyup", function(e){
    if (e.code =='KeyD') vxr = 0;
    if (e.code =='KeyA') vxl = 0;
console.log(e.code)
socket.emit("playerMove", movement);
})



let currentRoom = null;
document.getElementById("joinRoomButton").addEventListener("click", (e) => {
    e.preventDefault();

    const roomNumber = document.getElementById("roomInput").value.trim();
    if (!/^\d+$/.test(roomNumber)) {
        alert("Bitte eine gültige Zahl für die Lobby eingeben!");
        return;
    }
    socket.emit("create_or_join", roomNumber);

    
    socket.on("room_joined", (room) => {
        currentRoom = room;
        document.getElementById("page1").style.display = "none";
        document.getElementById("page2").style.display = "block";
    });

    
});













let currentIndex = 0;
let step = 0;

function loadQuestion() {
    const cards = JSON.parse(localStorage.getItem("cards")) || [];
    const questionBox = document.getElementById("questionBox");

    if (cards.length === 0) {
        questionBox.textContent = "Keine Frage verfügbar.";
        return;
    }

    const card = cards[currentIndex];

    if (step === 0) {
        
        questionBox.innerHTML = `<h3>Frage: ${card.question}</h3>`;
        const nextButton = document.createElement("button");
        nextButton.textContent = "Weiter";
        nextButton.onclick = () => {
            step = 1;
            loadQuestion();
        };
        questionBox.appendChild(nextButton);
    } else if (step === 1) {
        
        questionBox.innerHTML = 
        `<h3>Frage: ${card.question}</h3>
            <p>Antwort: ${card.answer}</p>`;
        const schlechtButton = document.createElement("button");
        schlechtButton.textContent = "Ich lag falsch";
        schlechtButton.onclick = () => {
            step = 0;
            currentIndex++;
            if (currentIndex >= cards.length) currentIndex = 0;
            loadQuestion();
        };
        const gutButton = document.createElement("button");
        gutButton.textContent = "Ich lag richtig";
        gutButton.onclick = () => {
            socket.emit('updateScore', 100); 
            step = 0;
            currentIndex++;
            if (currentIndex >= cards.length) currentIndex = 0;
            loadQuestion();
        };
        questionBox.appendChild(schlechtButton);
        questionBox.appendChild(gutButton);
    }
}


socket.on('totalScoreUpdate', (totalScore) => {
    const totalScoreBox = document.getElementById("totalScoreBox");
    totalScoreBox.textContent = `Gesamtpunkte aller Spieler: ${totalScore}`;
});

socket.on('playerScoreUpdate', (newScore) => {
    const scoreBox = document.getElementById("scoreBox");
    scoreBox.textContent = `Punkte: ${newScore}`;
});


window.onload = () => {
    loadQuestion();
};




