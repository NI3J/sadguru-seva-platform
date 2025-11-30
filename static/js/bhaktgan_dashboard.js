document.addEventListener("DOMContentLoaded", function () {
  const rows = document.querySelectorAll(".bhakt-table tbody tr");
  rows.forEach((row) => {
    row.addEventListener("click", () => {
      const name = row.cells[0].textContent;
      alert(`जय गुरुदेव 🙏🏼\n\nभक्त: ${name}`);
    });
  });
});
