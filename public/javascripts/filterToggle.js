document.addEventListener("DOMContentLoaded", () => {
  console.log("[filterToggle.js] loaded");
  document.querySelectorAll(".filter-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tgt = btn.dataset.target;
      const el = document.getElementById(tgt);
      if (el) {
        el.classList.toggle("open");
        console.log(
          `[filterToggle.js] toggled #${tgt} → ${
            el.classList.contains("open") ? "open" : "closed"
          }`
        );
      }
    });
  });
});
