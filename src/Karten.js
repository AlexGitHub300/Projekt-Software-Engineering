const questionBox = document.getElementById("questionBox"); // Holt das HTML-Element für die Fragebox
const cards = JSON.parse(localStorage.getItem("cards")) || []; // Lädt Karten aus dem lokalen Speicher oder initialisiert ein leeres Array, falls keine Karten vorhanden sind


 function renderCards() { // Funktion zum Anzeigen aller Karten im Container.
     const container = document.getElementById("cardsContainer"); // Erstellt ein neues <div> für jede Karte.
     container.innerHTML = ""; 

     cards.forEach((card, index) => {
         const cardDiv = document.createElement("div");
         cardDiv.className = "card"; // Setzt die CSS-Klasse "card" für das Styling
         cardDiv.innerHTML =         // Fügt den Inhalt der Karte (Frage, Antwort und Lösch-Button) ein
              `<h3>Frage: ${card.question}</h3>
             <p>Antwort: ${card.answer}</p>
             <button onclick="deleteCard(${index})">Löschen</button>`; // Button zum Löschen der Karte, ruft `deleteCard` mit dem Index der Karte auf
         container.appendChild(cardDiv); // Fügt das Karten-<div> in den Container ein
     });
 }

 
 document.getElementById("cardForm").addEventListener("submit", (e) => { // Fügt einen Event-Listener hinzu, um das Formular abzufangen.
     e.preventDefault();// Verhindert das die Seitenneuladet
     const question = document.getElementById("question").value; // Holt den eingegebenen Text für die Frage
     const answer = document.getElementById("answer").value; // Holt den eingegebenen Text für die Antwort

     
     cards.push({ question, answer }); // Fügt die neue Karte (Frage und Antwort) in das Array hinzu
     localStorage.setItem("cards", JSON.stringify(cards)); // Speichert das aktualisierte Karten-Array im lokalen Speicher
     e.target.reset(); // Setzt das Formular zurück
     renderCards(); // Rendert die Karten neu, um die neue Karte anzuzeigen
 });

 
 function deleteCard(index) { // Funktion zum Löschen einer Karte
     cards.splice(index, 1); // Entfernt die Karte mit dem angegebenen Index aus dem Array
     localStorage.setItem("cards", JSON.stringify(cards)); // Aktualisiert den lokalen Speicher
     renderCards(); // Rendert die Kartenliste neu
 }


 document.getElementById("downloadCards").addEventListener("click", () => { // Fügt einen Event-Listener für den Download-Button hinzu
     const blob = new Blob([JSON.stringify(cards, null, 2)], { type: "application/json" }); // Erstellt eine JSON-Datei aus den Karten-Daten
     const link = document.createElement("a"); // Erstellt ein unsichtbares <a>-Element.
     link.href = URL.createObjectURL(blob); // Setzt die Datei als Quelle des Links
     link.download = "karten.json"; // Gibt den Dateinamen für den Download an
     link.click(); // Simuliert einen Klick, um den Download auszulösen
 });

 
 document.getElementById("uploadCards").addEventListener("change", (event) => { // Event-Listener für das Hochladen von Karten
     const file = event.target.files[0]; // Holt die ausgewählte Datei
     if (file) { // Prüft, ob eine Datei ausgewählt wurde
         const reader = new FileReader(); // Erstellt ein FileReader-Objekt, um die Datei zu lesen
         reader.onload = (e) => { // Definiert, was passiert, wenn die Datei gelesen wurde
             const uploadedCards = JSON.parse(e.target.result); // Parst die JSON-Datei in ein Array von Karten
             cards.splice(0, cards.length, ...uploadedCards);  // Ersetzt die aktuellen Karten mit den hochgeladenen
             localStorage.setItem("cards", JSON.stringify(cards)); // Speichert die aktualisierten Karten im lokalen Speicher
             renderCards(); // Rendert die Karten neu
         };
         reader.readAsText(file); // Liest die Datei als Text
     }
 });

window.addEventListener('load', renderCards); // Lädt die Karten beim Laden der Seite und zeigt sie an






