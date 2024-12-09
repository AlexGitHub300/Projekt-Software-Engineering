const questionBox = document.getElementById("questionBox");
const cards = JSON.parse(localStorage.getItem("cards")) || [];


 function renderCards() {
     const container = document.getElementById("cardsContainer");
     container.innerHTML = ""; 

     cards.forEach((card, index) => {
         const cardDiv = document.createElement("div");
         cardDiv.className = "card";
         cardDiv.innerHTML = 
              `<h3>Frage: ${card.question}</h3>
             <p>Antwort: ${card.answer}</p>
             <button onclick="deleteCard(${index})">Löschen</button>`;
         container.appendChild(cardDiv);
     });
 }

 
 document.getElementById("cardForm").addEventListener("submit", (e) => {
     e.preventDefault();
     const question = document.getElementById("question").value;
     const answer = document.getElementById("answer").value;

     
     cards.push({ question, answer });
     localStorage.setItem("cards", JSON.stringify(cards));
     e.target.reset();
     renderCards();
 });

 
 function deleteCard(index) {
     cards.splice(index, 1);
     localStorage.setItem("cards", JSON.stringify(cards));
     renderCards();
 }


 document.getElementById("downloadCards").addEventListener("click", () => {
     const blob = new Blob([JSON.stringify(cards, null, 2)], { type: "application/json" });
     const link = document.createElement("a");
     link.href = URL.createObjectURL(blob);
     link.download = "karten.json";
     link.click();
 });

 
 document.getElementById("uploadCards").addEventListener("change", (event) => {
     const file = event.target.files[0];
     if (file) {
         const reader = new FileReader();
         reader.onload = (e) => {
             const uploadedCards = JSON.parse(e.target.result);
             cards.splice(0, cards.length, ...uploadedCards); 
             localStorage.setItem("cards", JSON.stringify(cards));
             renderCards();
         };
         reader.readAsText(file);
     }
 });

window.addEventListener('load', renderCards);






