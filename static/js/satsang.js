document.addEventListener("DOMContentLoaded", () => {
  const nextBtn = document.getElementById("next-satsang");

  if (nextBtn) {
    const nextPage = nextBtn.getAttribute("data-next");
    nextBtn.addEventListener("click", () => {
      window.location.href = `/knowledge/satsang?page=${nextPage}`;
    });
  }

  // 🌸 Fade-in animation for satsang container
  const content = document.querySelector(".satsang-container");
  if (content) {
    content.style.opacity = 0;
    setTimeout(() => {
      content.style.transition = "opacity 1.5s ease-in-out";
      content.style.opacity = 1;
    }, 100);
  }
});
