document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector(".home-button");
    if (button) {
        button.addEventListener("click", () => {
            console.log("Navigating to मुख्य पृष्ठ...");
        });
    }
});
