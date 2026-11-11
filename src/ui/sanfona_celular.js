  // Sanfona no celular (pedido de 11/11/2026): em até 640 px os blocos (.card com título h3) da ficha da Dex, do
  // Meu Time e do detalhe de chefão viram <details> fechados, com um resumo de uma linha no título. Os nós são
  // MOVIDOS, não recriados: ouvintes e ids seguem valendo. Um observador refaz a conversão depois de cada redesenho.
  // O estado aberto/fechado fica só na sessão (mapa em memória, por título). No desktop não faz nada.
  var sanfonaMedia = window.matchMedia ? window.matchMedia("(max-width: 640px)") : null;
  var sanfonaAbertas = {};
  var SANFONA_RAIZES = ["species-detail", "boss-detail", "view-team"];

  function sanfonaResumo(card) {
    var esc = card.querySelectorAll(".abi-grid .choosable").length;
    var inn = card.querySelectorAll(".abi-grid .innate").length;
    if (esc || inn) return esc + " + " + inn;
    var evo = card.querySelectorAll(".evo-chain > *").length;
    if (evo) return evo + (evo === 1 ? " forma" : " formas");
    var itens = card.querySelectorAll("li").length;
    return itens > 1 ? itens + " itens" : "";
  }

  function sanfonaConverter(card) {
    var h3 = card.firstElementChild;
    var titulo = h3.textContent.trim();
    var det = document.createElement("details");
    det.className = card.className + " sanfona";
    det.open = !!sanfonaAbertas[titulo];
    var sum = document.createElement("summary");
    sum.className = "sanfona-resumo";
    var resumo = sanfonaResumo(card);
    sum.innerHTML = '<span class="sanfona-titulo"></span>' + (resumo ? '<span class="sanfona-info mono"></span>' : "");
    sum.firstChild.textContent = titulo;
    if (resumo) sum.lastChild.textContent = "· " + resumo;
    det.appendChild(sum);
    card.removeChild(h3);
    while (card.firstChild) det.appendChild(card.firstChild);
    det.addEventListener("toggle", function () {
      sanfonaAbertas[titulo] = det.open;
      if (det.open && sum.scrollIntoView) {
        var calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        sum.scrollIntoView({ block: "start", behavior: calmo ? "auto" : "smooth" });
      }
    });
    card.parentNode.replaceChild(det, card);
  }

  function sanfonaAplicar() {
    if (!sanfonaMedia || !sanfonaMedia.matches) return;
    SANFONA_RAIZES.forEach(function (id) {
      var raiz = document.getElementById(id);
      if (!raiz) return;
      Array.prototype.slice.call(raiz.querySelectorAll(".card")).forEach(function (card) {
        var h3 = card.firstElementChild;
        if (!h3 || h3.tagName !== "H3" || card.closest(".sanfona") || card.parentNode.closest(".card")) return;
        if (/^Montar time/.test(h3.textContent.trim())) return;
        sanfonaConverter(card);
      });
      // Blocos que já eram <details> abertos por padrão (Auto Build): no celular seguem a memória da sessão.
      Array.prototype.slice.call(raiz.querySelectorAll("details.detail-group[open]:not([data-sanfona])")).forEach(function (d) {
        d.setAttribute("data-sanfona", "1");
        var t = d.querySelector("summary");
        var chave = t ? t.textContent.trim() : "";
        d.open = !!sanfonaAbertas[chave];
        d.addEventListener("toggle", function () { sanfonaAbertas[chave] = d.open; });
      });
    });
  }

  (function sanfonaLigar() {
    var pendente = false;
    var obs = new MutationObserver(function () {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(function () {
        pendente = false;
        obs.disconnect();
        sanfonaAplicar();
        sanfonaObservar();
      });
    });
    function sanfonaObservar() {
      SANFONA_RAIZES.forEach(function (id) {
        var raiz = document.getElementById(id);
        if (raiz) obs.observe(raiz, { childList: true, subtree: true });
      });
    }
    sanfonaObservar();
    sanfonaAplicar();
    // Girar o aparelho para tela larga: o estilo da sanfona some (só existe ≤640 px), então tudo abre; ao voltar, reaplica.
    if (sanfonaMedia && sanfonaMedia.addEventListener) sanfonaMedia.addEventListener("change", function () {
      if (sanfonaMedia.matches) { sanfonaAplicar(); return; }
      Array.prototype.slice.call(document.querySelectorAll("details.sanfona, details[data-sanfona]")).forEach(function (d) { d.open = true; });
    });
  })();
