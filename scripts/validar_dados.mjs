// Travas de dado do build (fase 8 da refatoração, 2026-09-24: porte em Node de
// validate_builds.ps1 e validate_data_invariants.ps1, que só rodavam no
// Windows). Rodam em TODO build e abortam em vez de avisar - dado inválido
// vira conselho errado na tela do jogador, e nenhum teste de tela pega isso
// (a tela renderiza feliz um golpe inventado).
//
// Uso direto: node scripts/validar_dados.mjs   (o build chama as duas funções)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DADOS = fileURLToPath(new URL("../data/", import.meta.url));
const carregar = (nome) => JSON.parse(readFileSync(DADOS + nome, "utf8").replace(/^\uFEFF/, ""));
const lista = (v) => (v === null || v === undefined ? [] : Array.isArray(v) ? v : [v]);

// ---------------------------------------------------------------------------
// builds.json: nenhuma build cita habilidade ou golpe que a espécie não tem.
// Motivo real (2026-09-16): a expansão de 18 -> 221 builds vinda do Discord
// shipou 29 entradas inválidas (mega validada contra a união base+mega, mapa
// de "erros de digitação" que inventou nomes, tolerância de 1 letra que
// gravava a grafia do post em vez da do jogo).
// ---------------------------------------------------------------------------
export const FONTES = ["discord-build-workshop-2.65", "discord-movesets", "curadoria-do-projeto", "ia-curada-playtester", "dex-strategy-do-jogo", "video-megafidough"];
const FORMATOS = ["1x1", "dupla"];
// Até 3 curadas por espécie, uma por estilo; o valor pode ser objeto ou lista
// (o app normaliza em curadasDe(), src/regras/plano_build.js).
const ESTILOS = ["ofensivo", "equilibrado", "defensivo"];

export function validarBuilds(dex = carregar("dex_compact.json"), builds = carregar("builds.json")) {
  const habPorSname = new Map();
  const golpePorSname = new Map();
  for (const s of dex.species) {
    if (!s || !s.sname) continue;
    const habs = new Set();
    for (const id of [...lista(s.ab), ...lista(s.inn)]) {
      const nome = dex.abilities[id] && dex.abilities[id][0];
      if (nome) habs.add(String(nome));
    }
    habPorSname.set(s.sname, habs);
    const golpes = new Set();
    for (const par of lista(s.lm)) { const n = dex.moves[par[1]] && dex.moves[par[1]][0]; if (n) golpes.add(String(n)); }
    for (const id of lista(s.tu)) { const n = dex.moves[id] && dex.moves[id][0]; if (n) golpes.add(String(n)); }
    golpePorSname.set(s.sname, golpes);
  }
  const versaoDoDado = String(dex.meta.version);
  const problemas = [];
  const entradas = [];
  for (const [chave, valor] of Object.entries(builds)) {
    const itens = lista(valor);
    if (itens.length > 3) problemas.push(`${chave} : ${itens.length} builds - maximo 3 (uma por estilo)`);
    const estilos = new Set();
    for (const b of itens) {
      if ("estilo" in b) {
        const e = String(b.estilo);
        if (!ESTILOS.includes(e)) problemas.push(`${chave} : estilo '${e}' invalido (use: ${ESTILOS.join(", ")})`);
        else if (estilos.has(e)) problemas.push(`${chave} : duas builds com estilo '${e}'`);
        else estilos.add(e);
      }
      entradas.push([chave, b]);
    }
  }
  for (const [sname, b] of entradas) {
    if (!FONTES.includes(String(b.fonte))) problemas.push(`${sname} : fonte '${b.fonte}' invalida (use: ${FONTES.join(", ")})`);
    if (!b.versao) problemas.push(`${sname} : sem campo versao (contra qual versao do jogo a build foi validada)`);
    else if (String(b.versao) !== versaoDoDado) problemas.push(`${sname} : validada contra ${b.versao}, mas o dado atual e ${versaoDoDado} - revisar a build antes de atualizar o campo`);
    if ("formato" in b && !FORMATOS.includes(String(b.formato))) problemas.push(`${sname} : formato '${b.formato}' invalido (use: ${FORMATOS.join(", ")})`);
    if (!habPorSname.has(sname)) { problemas.push(`${sname} : especie nao existe em dex_compact.json`); continue; }
    if (b.ability && !habPorSname.get(sname).has(String(b.ability))) problemas.push(`${sname} : habilidade '${b.ability}' nao pertence a esta especie`);
    const vistos = new Set();
    for (const m of lista(b.moves)) {
      const mv = m ? String(m) : "";
      if (!mv) continue;
      if (!golpePorSname.get(sname).has(mv)) problemas.push(`${sname} : golpe '${mv}' nao e aprendido por esta especie`);
      if (vistos.has(mv)) problemas.push(`${sname} : golpe '${mv}' repetido no mesmo set`);
      vistos.add(mv);
    }
    // Plano de golpes (build promovida da IA): parte de um golpe do set e leva
    // a um golpe que a espécie aprende de verdade.
    if (b.plano) {
      for (const [de, para] of Object.entries(b.plano)) {
        if (!vistos.has(String(de))) problemas.push(`${sname} : plano parte de '${de}', que nao esta no set`);
        if (!golpePorSname.get(sname).has(String(para))) problemas.push(`${sname} : plano leva a '${para}', que esta especie nao aprende`);
      }
    }
  }
  return { problemas, resumo: `${entradas.length} builds em ${Object.keys(builds).length} especies, todas com habilidade e golpes reais da propria especie, fonte e versao ${versaoDoDado}` };
}

// ---------------------------------------------------------------------------
// Invariantes dos outros dados derivados (item Q2 da pauta técnica). Mesmos 9
// grupos do script antigo - ver o comentário de cada um.
// ---------------------------------------------------------------------------
export function validarInvariantes() {
  const dex = carregar("dex_compact.json");
  const roles = carregar("move_roles.json");
  const megaForms = carregar("mega_forms.json");
  const synergy = carregar("species_ability_synergy.json");
  const erros = [];
  const erro = (m) => erros.push(m);

  const splits = lista(dex.splits);
  const evoKinds = lista(dex.evoKinds);
  const items = new Set(dex.items.filter(Boolean).map(String));
  const moveNames = new Set(dex.moves.filter(Boolean).map((m) => String(m[0])));
  const abilityNames = new Set(dex.abilities.filter(Boolean).map((a) => String(a[0])));
  const porSname = new Map(); const porX = new Map();
  for (const s of dex.species) { if (!s) continue; porSname.set(String(s.sname), s); porX.set(Number(s.x), s); }

  // 1. rótulos que o app compara existem
  if (!splits.includes("STATUS")) erro("splits nao tem o rotulo STATUS");
  for (const r of ["EVO_LEVEL", "EVO_LEVEL_MALE", "EVO_LEVEL_FEMALE", "EVO_MEGA_EVOLUTION", "EVO_MOVE_MEGA_EVOLUTION", "EVO_PRIMAL_REVERSION"]) {
    if (!evoKinds.includes(r)) erro(`evoKinds nao tem o rotulo ${r}`);
  }

  // 2. move_roles cobre exatamente os golpes de status
  const idxStatus = splits.indexOf("STATUS");
  const statusIds = new Map();
  dex.moves.forEach((m, id) => { if (m && m[2] === idxStatus && m[0] && m[0] !== "-") statusIds.set(String(id), m[0]); });
  for (const [id, nome] of statusIds) if (!(id in roles)) erro(`move_roles.json sem papel pro golpe de status ${nome} (id ${id})`);
  for (const id of Object.keys(roles)) if (!statusIds.has(id)) erro(`move_roles.json tem o id ${id}, que nao e golpe de status`);

  // 3. mega_forms: pedra é item real; forma é espécie real e alvo de Mega/Primal
  const idxMega = ["EVO_MEGA_EVOLUTION", "EVO_MOVE_MEGA_EVOLUTION", "EVO_PRIMAL_REVERSION"].map((r) => evoKinds.indexOf(r));
  const alvosMega = new Set();
  for (const s of porSname.values()) for (const ev of lista(s.ev)) if (ev && idxMega.includes(ev[0])) alvosMega.add(Number(ev[2]));
  for (const [pedra, forma] of Object.entries(megaForms)) {
    if (!items.has(String(pedra))) erro(`mega_forms.json: pedra '${pedra}' nao existe nos itens`);
    if (!porSname.has(String(forma))) erro(`mega_forms.json: forma '${forma}' (pedra ${pedra}) nao existe`);
    else if (!alvosMega.has(Number(porSname.get(String(forma)).x))) erro(`mega_forms.json: '${forma}' (pedra ${pedra}) nao e alvo de Mega/Primal de nenhuma base`);
  }
  const comPedra = new Set(Object.values(megaForms).map(String));
  let megaSemPedra = 0;
  for (const x of alvosMega) if (porX.has(x) && !comPedra.has(String(porX.get(x).sname))) megaSemPedra++;

  // 4. evolução por nível: nível numérico e destino real (-1 = a própria fonte
  // não traz a forma de destino - lacuna conhecida do NextDex, não erro nosso)
  const idxNivel = ["EVO_LEVEL", "EVO_LEVEL_MALE", "EVO_LEVEL_FEMALE"].map((r) => evoKinds.indexOf(r));
  let destinoAusenteNaFonte = 0;
  for (const s of porSname.values()) {
    for (const ev of lista(s.ev)) {
      if (!ev) continue;
      if (idxNivel.includes(ev[0])) {
        const n = /^\s*[+-]?\d+\s*$/.test(String(ev[1])) ? parseInt(ev[1], 10) : NaN;
        if (!(n >= 1 && n <= 100)) erro(`${s.sname}: evolucao por nivel com nivel invalido '${ev[1]}'`);
      }
      if (Number(ev[2]) === -1) { destinoAusenteNaFonte++; continue; }
      if (!porX.has(Number(ev[2]))) erro(`${s.sname}: evolucao aponta pra especie inexistente (x=${ev[2]})`);
    }
  }

  // 5. sinergia habilidade x golpe só cita espécie, habilidade e golpe reais
  for (const [sn, habs] of Object.entries(synergy)) {
    if (!porSname.has(sn)) { erro(`species_ability_synergy.json: especie ${sn} nao existe`); continue; }
    for (const h of lista(habs)) {
      if (!abilityNames.has(String(h.name))) erro(`species_ability_synergy.json: ${sn} cita habilidade inexistente '${h.name}'`);
      for (const g of lista(h.golpes)) if (!moveNames.has(String(g))) erro(`species_ability_synergy.json: ${sn} cita golpe inexistente '${g}'`);
    }
  }

  // 6. descrição de fonte externa sem nada com cara de tag (vai pra IA dentro
  // de <dados_do_jogo>; um "</dados_do_jogo>" num texto fecharia o bloco -
  // item S3). Nomes ficam de fora: existe habilidade chamada "3 > 1".
  // Porte da fase 8 (2026-09-24): no script antigo, em PowerShell, a vírgula
  // tem precedência sobre o "+" e as descrições de golpe e habilidade viravam
  // UMA string só - a checagem nunca olhou pra elas (só pros arquivos de
  // tradução). Olhando de verdade, apareceu "Move BP < 51" (Perfectionist):
  // comparação, não tag. A trava agora mira o que imita um delimitador: "<"
  // abrindo tag (letra, "/", "!" ou "?" logo depois).
  const descricoes = [];
  for (const m of dex.moves) if (m) descricoes.push(["golpe " + m[0], String(m[6] ?? "")]);
  for (const a of dex.abilities) if (a) descricoes.push(["habilidade " + a[0], String(a[1] ?? "")]);
  for (const f of ["move_translations_pt.json", "ability_translations_pt.json", "item_descriptions.json", "item_translations_pt.json"]) {
    for (const [k, v] of Object.entries(carregar(f))) descricoes.push([`${f}/${k}`, String(v ?? "")]);
  }
  for (const [onde, texto] of descricoes) if (/<\s*[/A-Za-z!?]/.test(texto)) erro(`descricao externa com cara de tag (${onde}) - poderia imitar o delimitador do prompt da IA`);

  // 7. species_rank/species_role: uma entrada por espécie, nem mais nem menos
  // (percentil sobre a população inteira - arquivo desatualizado distorce todas)
  const rank = carregar("species_rank.json");
  const role = carregar("species_role.json");
  for (const sn of porSname.keys()) {
    if (!(sn in rank)) erro(`species_rank.json: falta a especie ${sn} (existe em dex_compact.json)`);
    if (!(sn in role)) erro(`species_role.json: falta a especie ${sn} (existe em dex_compact.json)`);
  }
  for (const sn of Object.keys(rank)) if (!porSname.has(sn)) erro(`species_rank.json: cita ${sn}, que nao existe (mais) em dex_compact.json`);
  for (const sn of Object.keys(role)) if (!porSname.has(sn)) erro(`species_role.json: cita ${sn}, que nao existe (mais) em dex_compact.json`);

  // 8. meta_rank_adjustments.json só cita espécie real
  const metaAdj = carregar("meta_rank_adjustments.json");
  for (const sn of Object.keys(metaAdj)) if (!porSname.has(sn)) erro(`meta_rank_adjustments.json: cita ${sn}, que nao existe em dex_compact.json`);

  // 9. condition_move_synergy.json: espécie e golpe reais, sem combo duplicado
  // (a duplicação já aconteceu - 2026-09-23, Kyogre Primal)
  const cond = carregar("condition_move_synergy.json");
  const clima = lista(cond.comboClimaAutossuficiente);
  const hpBaixo = lista(cond.comboHpBaixoComRecuo);
  const vistosClima = new Set(); const vistosHp = new Set();
  for (const c of clima) {
    if (!porSname.has(String(c.sname))) erro(`condition_move_synergy.json (clima): cita a especie '${c.sname}', que nao existe em dex_compact.json`);
    if (!moveNames.has(String(c.golpe))) erro(`condition_move_synergy.json (clima): cita o golpe '${c.golpe}', que nao existe em dex_compact.json`);
    const chave = `${c.sname}|${c.habilidade}|${c.golpe}`;
    if (vistosClima.has(chave)) erro(`condition_move_synergy.json (clima): combo duplicado '${chave}'`);
    vistosClima.add(chave);
  }
  for (const c of hpBaixo) {
    if (!porSname.has(String(c.sname))) erro(`condition_move_synergy.json (hp baixo): cita a especie '${c.sname}', que nao existe em dex_compact.json`);
    for (const g of lista(c.golpesRecuo)) if (!moveNames.has(String(g))) erro(`condition_move_synergy.json (hp baixo): cita o golpe '${g}', que nao existe em dex_compact.json`);
    const chave = `${c.sname}|${c.habilidade}`;
    if (vistosHp.has(chave)) erro(`condition_move_synergy.json (hp baixo): combo duplicado '${chave}'`);
    vistosHp.add(chave);
  }

  return {
    problemas: erros,
    resumo: `${descricoes.length} descricoes externas sem cara de tag, ${statusIds.size} golpes de status com papel, ${Object.keys(megaForms).length} pedras mega validas, ${Object.keys(synergy).length} especies com sinergia; ${megaSemPedra} formas mega/primal sem pedra conhecida - regra de pedra nao se aplica a elas; ${destinoAusenteNaFonte} evolucoes cuja forma de destino nao existe na fonte; species_rank/species_role sincronizados 1:1 com ${porSname.size} especies; ${Object.keys(metaAdj).length} especie(s) com ajuste de meta em meta_rank_adjustments.json; ${clima.length} combo(s) de clima + ${hpBaixo.length} combo(s) de HP baixo em condition_move_synergy.json`,
  };
}

// Execução direta: as duas travas, saída igual à do build.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let falhou = false;
  for (const [nome, fn] of [["validar builds", validarBuilds], ["invariantes dos dados", validarInvariantes]]) {
    const r = fn();
    if (r.problemas.length) {
      falhou = true;
      console.error(`${nome}: ${r.problemas.length} problema(s):`);
      for (const p of r.problemas.slice(0, 30)) console.error("  - " + p);
    } else console.log(`${nome}: OK (${r.resumo})`);
  }
  if (falhou) process.exit(1);
}
