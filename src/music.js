document.getElementById("playButton").addEventListener("click", () => {
    document.getElementById("audioElement").play();});
    playButton.addEventListener("click", () => {
// Startet das Audio
audioElement.play();
playButton.classList.add("playing"); // Optional: Button-Text ändern
playButton.disabled = true; // Optional: Button deaktivieren
    });