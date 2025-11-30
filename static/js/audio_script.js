// 🌸 Element References
const audioPlayer = document.getElementById('audioPlayer');
const babaImage = document.getElementById('babaImage');

// 🎵 Bhajan and Image Lists (populated from template)
const bhaktiAudios = [
  '/static/audio/Bhaktigeet/Sare-tirath-dham.mp3',
  '/static/audio/Bhaktigeet/Shree-Krashna-Govind-Hare-Murare.mp3',
  '/static/audio/Bhaktigeet/Vithal-Maza.mp3'
];

const babaImages = [
  '/static/images/Baba/Baba1.jpeg',
  '/static/images/Baba/Baba2.jpeg',
  '/static/images/Baba/Baba3.jpeg'
];

let currentTrack = 0;

// 🔄 Update Baba Image
function updateImage(index) {
  if (babaImage) {
    babaImage.src = babaImages[index];
  }
}

// ▶️ Play Bhajan by Index
function playBhajan(index) {
  if (audioPlayer) {
    audioPlayer.src = bhaktiAudios[index];
    audioPlayer.play();
  }
  updateImage(index);
}

// ⏭️ Play Next Bhajan
function playNextBhajan() {
  currentTrack = (currentTrack + 1) % bhaktiAudios.length;
  playBhajan(currentTrack);
}

// 🔔 Auto-play next when current ends
if (audioPlayer) {
  audioPlayer.addEventListener('ended', playNextBhajan);
}

// 🕉️ Optional: Start with first bhajan on page load
window.addEventListener('DOMContentLoaded', () => {
  playBhajan(currentTrack);
});
