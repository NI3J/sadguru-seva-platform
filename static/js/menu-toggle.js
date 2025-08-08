// 🌸 Toggle navigation visibility on hamburger click
function toggleMenu() {
  const nav = document.getElementById("nav-links");
  nav.classList.toggle("hidden");
}
// static/js/menu-toggle.js

document.addEventListener('DOMContentLoaded', function () {
  const toggleButton = document.querySelector('#menu-toggle');
  const navMenu = document.querySelector('#nav-menu');

  if (toggleButton && navMenu) {
    toggleButton.addEventListener('click', function () {
      navMenu.classList.toggle('active');
      toggleButton.classList.toggle('open'); // Optional for icon animation
    });
  } else {
    console.warn('Menu toggle or nav menu not found in DOM');
  }
});
