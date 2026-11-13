  // Lupa (11/11/2026): botão de lupa ao lado do nome de habilidade, inata ou golpe; abre um balão com o texto que a Dex já mostra.
  // Um componente só para o Time do Chefão e o Meu Time. Computador: passar o mouse ou focar abre. Celular: tocar abre e fecha.
  // O texto vem de descricaoDaHabilidade/descricaoDoGolpe (dados_base.js), as mesmas funções da ficha da Dex.
  var LUPA_ICONE = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l4.5 4.5"/></svg>';
  var lupaAtual = null; // { btn, fixado }

  // Devolve o HTML do botão, ou "" se o nome não existe nos dados (nada a mostrar).
  function lupaHtml(tipo, nome) {
    var id = tipo === "golpe" ? MOVE_ID_BY_NAME[nome] : ABILITY_ID_BY_NAME[nome];
    if (id === undefined || id === null) return "";
    return '<button type="button" class="lupa-btn" data-lupa="' + tipo + '" data-id="' + id + '" aria-expanded="false" aria-label="O que faz: ' + escapeHtml(nome) + '">' + LUPA_ICONE + '</button>';
  }

  function lupaBalao() {
    var b = document.getElementById("lupa-balao");
    if (!b) {
      b = document.createElement("div");
      b.id = "lupa-balao";
      b.setAttribute("role", "tooltip");
      b.hidden = true;
      document.body.appendChild(b);
    }
    return b;
  }

  function lupaFechar() {
    if (!lupaAtual) return;
    lupaAtual.btn.setAttribute("aria-expanded", "false");
    lupaAtual.btn.removeAttribute("aria-describedby");
    lupaBalao().hidden = true;
    lupaAtual = null;
  }

  function lupaAbrir(btn, fixado) {
    if (lupaAtual && lupaAtual.btn === btn) { if (fixado) lupaAtual.fixado = true; return; }
    lupaFechar();
    var id = btn.getAttribute("data-id");
    var balao = lupaBalao();
    balao.textContent = btn.getAttribute("data-lupa") === "golpe" ? descricaoDoGolpe(id) : descricaoDaHabilidade(id);
    balao.hidden = false;
    balao.style.left = "0px"; balao.style.top = "0px";
    var r = btn.getBoundingClientRect(), w = balao.offsetWidth, h = balao.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var x = Math.max(8, Math.min(r.left, vw - w - 8));
    var y = r.bottom + 6 + h <= vh - 8 ? r.bottom + 6 : Math.max(8, r.top - h - 6); // sem espaço embaixo: vira para cima
    balao.style.left = x + "px"; balao.style.top = y + "px";
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-describedby", "lupa-balao");
    lupaAtual = { btn: btn, fixado: !!fixado, top: r.top, left: r.left };
  }

  function lupaBotao(e) { return e.target.closest ? e.target.closest(".lupa-btn") : null; }
  document.addEventListener("pointerover", function (e) {
    var b = e.pointerType === "mouse" ? lupaBotao(e) : null;
    if (b) lupaAbrir(b, false);
  });
  document.addEventListener("pointerout", function (e) {
    if (e.pointerType === "mouse" && lupaBotao(e) && lupaAtual && !lupaAtual.fixado) lupaFechar();
  });
  document.addEventListener("focusin", function (e) {
    var b = lupaBotao(e);
    if (b) lupaAbrir(b, false);
  });
  document.addEventListener("focusout", function (e) {
    if (lupaBotao(e) && lupaAtual && !lupaAtual.fixado) lupaFechar();
  });
  document.addEventListener("click", function (e) {
    var b = lupaBotao(e);
    if (!b) { lupaFechar(); return; }
    e.stopPropagation(); // a lupa é alvo separado: não aciona o que o cartão ao redor faz
    if (lupaAtual && lupaAtual.btn === b && lupaAtual.fixado) lupaFechar();
    else lupaAbrir(b, true);
  }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") lupaFechar(); });
  // Só fecha se o botão saiu do lugar: o balão é fixo, então rolagem sem deslocamento (evento atrasado do toque, sanfona abrindo) não deve fechá-lo.
  window.addEventListener("scroll", function () {
    if (!lupaAtual) return;
    var r = lupaAtual.btn.getBoundingClientRect();
    if (Math.abs(r.top - lupaAtual.top) > 2 || Math.abs(r.left - lupaAtual.left) > 2) lupaFechar();
  }, true);
  window.addEventListener("resize", lupaFechar);
