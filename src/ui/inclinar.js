  // ===== src/ui/inclinar.js =====
  // Inclinação do cartão de build (Meu Time e detalhe da PC Box), direção A de 13/11/2026:
  // até 8 graus seguindo o ponteiro. Só grava --rx/--ry/--lx/--ly; o CSS (profundidade.css) faz o resto.
  // Desligada com prefers-reduced-motion: reduce.
  (function () {
    var MAX = 8;
    var SEL = ".team-slot.cartao-membro, .pcbox-detail.cartao-membro";
    var reduz = window.matchMedia("(prefers-reduced-motion: reduce)");
    function zerar(el) {
      el.style.removeProperty("--rx"); el.style.removeProperty("--ry");
      el.style.removeProperty("--lx"); el.style.removeProperty("--ly");
    }
    document.addEventListener("pointermove", function (e) {
      if (reduz.matches) return;
      var el = e.target.closest && e.target.closest(SEL);
      if (!el) return;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", ((px - 0.5) * 2 * MAX).toFixed(2) + "deg");
      el.style.setProperty("--rx", ((0.5 - py) * 2 * MAX).toFixed(2) + "deg");
      el.style.setProperty("--lx", (px * 100).toFixed(0) + "%");
      el.style.setProperty("--ly", (py * 100).toFixed(0) + "%");
    }, { passive: true });
    function sair(e) {
      var el = e.target.closest && e.target.closest(SEL);
      if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) zerar(el);
    }
    document.addEventListener("pointerout", sair, { passive: true });
    document.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") sair(e); }, { passive: true });
    document.addEventListener("pointercancel", sair, { passive: true });
  })();
