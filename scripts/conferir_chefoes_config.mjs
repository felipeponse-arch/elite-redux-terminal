// Confere os times dos chefões do bosses.json contra a config oficial do jogo
// (er-config, TrainerList.textproto: bloco "ace" = time Padrão, "elite" = Insane).
// Ticket 02 (07/10/2026): Elite 4, Campeão e equipes Aqua/Magma - o usuário nunca teve
// vídeo dessas lutas, então a config oficial é a única fonte.
//
// Uso: node scripts/conferir_chefoes_config.mjs <TrainerList.textproto> [--categorias=regex] [--json] [--aplicar]
// --aplicar preenche no bosses.json o item que a NextDex perdeu (ver preencherItensPerdidos).
// A AbilityList.textproto da mesma versão tem que estar ao lado (mesmo nome, trocando TrainerList).
// Desde 15/10/2026 (ticket versao-nova/05, decisão do Felipe: o app mira a versão mais nova) a config é a MAIS NOVA (d1a9a4c, 14/10/2026);
// o commit 7be1617 (14/03) era a versão do dado antigo. --aplicar-tudo troca no bosses.json os mons que a config diz diferentes.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

// Parser mínimo do textproto: só o que a config de treinadores usa (blocos e "chave: valor").
export function lerTreinadores(texto) {
  const out = {};
  let tr = null, bloco = null, mon = null;
  for (const bruta of texto.split(/\r?\n/)) {
    const l = bruta.trim();
    if (l === "trainer {") { tr = { id: "", times: {} }; continue; }
    if (!tr) continue;
    if (/^(ace|elite|hell) \{$/.test(l)) { bloco = l.split(" ")[0]; tr.times[bloco] = []; continue; }
    if (l === "mon {" && bloco) { mon = { moves: [], evs: [0, 0, 0, 0, 0, 0] }; tr.times[bloco].push(mon); continue; }
    if (l === "}") {
      if (mon) mon = null; else if (bloco) bloco = null; else { out[tr.id] = tr; tr = null; }
      continue;
    }
    const m = l.match(/^(\w+): (.*)$/);
    if (!m) continue;
    const [, k, vBruto] = m;
    const v = vBruto.replace(/^"|"$/g, "");
    if (!mon) { if (k === "id") tr.id = v; continue; }
    const iEv = ["hp_ev", "atk_ev", "def_ev", "spatk_ev", "spdef_ev", "spe_ev"].indexOf(k);
    if (iEv >= 0) mon.evs[iEv] = parseInt(v, 10);
    else if (k === "move") mon.moves.push(v);
    else mon[k] = v;
  }
  return out;
}

// Nome do app -> constante da config ("Toxtricity Redux Fuzz" -> TOXTRICITY_REDUX_FUZZ).
export const constante = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/['’.%:]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
const semPrefixo = (s) => String(s || "").replace(/^(SPECIES|ITEM|NATURE|ABILITY|MOVE)_/, "");

// Nomes internos do próprio dado do app (NextDex traz NAME de espécie, golpe e item; habilidade pela
// posição, que bate com a AbilityList da config). Sem eles, nomes de tela como "Boiling Flame"
// (SUPERHOT_FLAME) e "Tidal Rush" (WATER_GALE_WINGS) virariam diferença falsa.
export function mapasDoDado(gameData, abilityIds) {
  const porNome = (lista) => Object.fromEntries(lista.filter(Boolean).map((x) => [x.name, x.NAME]));
  return { especie: (m) => gameData.species[m.x] && gameData.species[m.x].NAME, golpe: porNome(gameData.moves),
    item: porNome(gameData.items), habilidade: (m) => abilityIds[m.abiId],
    escolhiveis: (m) => ((gameData.species[m.x] || {}).stats || {}).abis ? gameData.species[m.x].stats.abis.map((i) => abilityIds[i]) : null };
}
let MAPAS = null;
export function usarMapas(m) { MAPAS = m; }

export function compararMon(app, cfg) {
  const dif = [];
  const campo = (rotulo, a, c, interno) => { if ((interno ? semPrefixo(interno) : constante(a)) !== semPrefixo(c)) dif.push(rotulo + ": app " + (a || "-") + " / jogo " + (semPrefixo(c) || "-")); };
  campo("espécie", app.n, cfg.species, MAPAS && MAPAS.especie(app));
  campo("item", app.item, cfg.item || "ITEM_NONE", MAPAS && (app.item ? MAPAS.item[app.item] : "ITEM_NONE"));
  campo("natureza", app.nat, cfg.nature || "NATURE_HARDY"); // sem natureza na config = Hardy (padrão do jogo)
  // Habilidade fora da lista escolhível da espécie: o gerador oficial (TrainerPartyGenerator.kt) não grava
  // nenhuma e o jogo usa a posição 0. Então o certo é o app mostrar a posição 0, não a da config.
  const lista = MAPAS && MAPAS.escolhiveis(app);
  const cfgHab = lista && lista[0] && lista.indexOf(cfg.ability) === -1 ? lista[0] : cfg.ability;
  campo("habilidade", app.abi, cfgHab, MAPAS && MAPAS.habilidade(app));
  const ma = (app.mv || []).map((n) => (MAPAS && MAPAS.golpe[n] ? semPrefixo(MAPAS.golpe[n]) : constante(n))).sort().join(","), mc = cfg.moves.map(semPrefixo).sort().join(",");
  if (ma !== mc) dif.push("golpes: app " + (app.mv || []).join(", ") + " / jogo " + cfg.moves.map(semPrefixo).join(", "));
  if (app.evsRaw && app.evsRaw.join(",") !== cfg.evs.join(",")) dif.push("EVs: app " + app.evsRaw.join("/") + " / jogo " + cfg.evs.join("/"));
  return dif;
}

export function conferir(bosses, treinadores, filtro) {
  const rel = [];
  for (const b of bosses.filter((x) => filtro.test(x.cat))) {
    const id = "TRAINER_" + constante(b.name);
    const t = treinadores[id];
    if (!t) { rel.push({ chefao: b.name, problema: "não existe na config (" + id + ")" }); continue; }
    for (const [variante, chaveApp, chaveCfg] of [["Padrão", "party", "ace"], ["Insane", "insane", "elite"]]) {
      const app = b[chaveApp] || [], cfg = t.times[chaveCfg] || [];
      if (!app.length && !cfg.length) continue;
      if (!app.length) { rel.push({ chefao: b.name, variante, problema: "app sem time (jogo tem " + cfg.length + ")" }); continue; }
      if (app.length !== cfg.length) rel.push({ chefao: b.name, variante, problema: "tamanho: app " + app.length + " / jogo " + cfg.length });
      for (let i = 0; i < Math.min(app.length, cfg.length); i++) {
        const d = compararMon(app[i], cfg[i]);
        if (d.length) rel.push({ chefao: b.name, variante, posicao: i + 1, problema: d.join(" | ") });
      }
    }
  }
  return rel;
}

// Item que a NextDex perdeu (app sem item, config com item). O jogo copia o item da config
// direto para o time (battle_main.c: SetMonData(..., MON_DATA_HELD_ITEM, heldItem); o time é
// gerado na compilação por tools/codegen TrainerPartyGenerator.kt), então vale a config.
// Achado de 07/10: 11 Eviolites (Roxanne 1, Archie Slateport, Maxie Mt Chimney...).
// Habilidade NÃO entra: quando a config pede uma habilidade fora da lista da espécie, o gerador
// não grava nenhuma e o jogo usa a posição 0 - que é o que o app já mostra.
export function preencherItensPerdidos(bosses, treinadores, nomeDoItem, filtro) {
  const feitos = [];
  for (const b of bosses.filter((x) => filtro.test(x.cat))) {
    const t = treinadores["TRAINER_" + constante(b.name)];
    if (!t) continue;
    for (const [chaveApp, chaveCfg] of [["party", "ace"], ["insane", "elite"]]) {
      const app = b[chaveApp] || [], cfg = t.times[chaveCfg] || [];
      for (let i = 0; i < Math.min(app.length, cfg.length); i++) {
        const nome = cfg[i].item && cfg[i].item !== "ITEM_NONE" && nomeDoItem[cfg[i].item];
        if (!app[i].item && nome) { app[i].item = nome; feitos.push(b.name + " " + chaveApp + " " + (i + 1) + ": " + nome); }
      }
    }
  }
  return feitos;
}

// Corrige no bosses.json o que a config diz diferente do app (ticket versao-nova/05, 15/10/2026: o app mira a versão mais nova, a config manda).
// Troca o mon inteiro (espécie, habilidade, item, natureza, EVs, golpes) quando `compararMon` acusa qualquer diferença; mon igual não é tocado.
// `ctx` traz as tabelas constante -> dado do app: { especie: {SPECIES_X: {x, n}}, golpe: {MOVE_X: "Nome"}, item: {ITEM_X: "Nome"},
// natureza: {NATURE_X: "Nome"}, habilidade: {ABILITY_X: {abiId, abi}} }. Habilidade fora da lista da espécie = posição 0 (mesma regra da comparação).
const ROTULO_EV = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
export function corrigirTimes(bosses, treinadores, ctx, filtro) {
  const feitos = [];
  for (const b of bosses.filter((x) => filtro.test(x.cat))) {
    const t = treinadores["TRAINER_" + constante(b.name)];
    if (!t) continue;
    for (const [chaveApp, chaveCfg] of [["party", "ace"], ["insane", "elite"]]) {
      const app = b[chaveApp] || [], cfg = t.times[chaveCfg] || [];
      for (let i = 0; i < Math.min(app.length, cfg.length); i++) {
        const dif = compararMon(app[i], cfg[i]);
        if (!dif.length) continue;
        const c = cfg[i], esp = ctx.especie[c.species];
        if (!esp) throw new Error("espécie da config sem par no dado do app: " + c.species);
        const mv = c.moves.map((m) => { if (!ctx.golpe[m]) throw new Error("golpe da config sem par no dado do app: " + m); return ctx.golpe[m]; });
        const lista = (ctx.habilidadesDaEspecie && ctx.habilidadesDaEspecie(esp.x)) || null;
        const hab = lista && lista[0] && lista.indexOf(c.ability) === -1 ? lista[0] : c.ability;
        const h = ctx.habilidade[hab];
        if (!h) throw new Error("habilidade da config sem par no dado do app: " + hab);
        const nome = c.item && c.item !== "ITEM_NONE" ? ctx.item[c.item] : "";
        if (c.item && c.item !== "ITEM_NONE" && !nome) throw new Error("item da config sem par no dado do app: " + c.item);
        const evs = c.evs.slice();
        Object.assign(app[i], { x: esp.x, n: esp.n, abi: h.abi, abiId: h.abiId, item: nome, nat: ctx.natureza[c.nature || "NATURE_HARDY"], evsRaw: evs,
          evs: evs.map((v, k) => (v ? v + " " + ROTULO_EV[k] : "")).filter(Boolean).join(" / "), mv });
        feitos.push(b.name + " " + chaveApp + " " + (i + 1) + ": " + dif.join(" | "));
      }
    }
  }
  return feitos;
}

if ((process.argv[1] || "").endsWith("conferir_chefoes_config.mjs")) {
  const arq = process.argv[2];
  if (!arq) { console.error("uso: node scripts/conferir_chefoes_config.mjs <TrainerList.textproto>"); process.exit(2); }
  const argCat = process.argv.find((a) => a.startsWith("--categorias="));
  const FILTRO = new RegExp(argCat ? argCat.slice(13) : "Alto Comando|^Campeao$|Equipe");
  const COMO_JSON = process.argv.includes("--json");
  const bosses = JSON.parse(readFileSync(new URL("../data/bosses.json", import.meta.url), "utf8"));
  const gd = JSON.parse(readFileSync(new URL("../data/gameData_2654.json", import.meta.url), "utf8"));
  const abArq = arq.replace(/TrainerList/, "AbilityList");
  const abIds = existsSync(abArq) ? [...readFileSync(abArq, "utf8").matchAll(/^ {2}id: (\w+)/gm)].map((m) => m[1]) : [];
  usarMapas(mapasDoDado(gd, abIds));
  const treinadores = lerTreinadores(readFileSync(arq, "utf8"));
  if (process.argv.includes("--aplicar-tudo")) {
    const abNomes = existsSync(abArq) ? [...readFileSync(abArq, "utf8").matchAll(/^ {2}id: (\w+)\n {2}name: "([^"]*)"/gm)] : [];
    const posDaHab = Object.fromEntries(abIds.map((id, i) => [id, i]));
    const ctx = {
      especie: Object.fromEntries(gd.species.map((e, x) => [e && e.NAME, e && { x, n: e.name }]).filter((p) => p[0])),
      golpe: Object.fromEntries(gd.moves.filter(Boolean).map((m) => [m.NAME, m.name])),
      item: Object.fromEntries(gd.items.filter(Boolean).map((m) => [m.NAME, m.name])),
      natureza: Object.fromEntries(gd.natureT.map((n) => ["NATURE_" + constante(n), n])),
      habilidade: Object.fromEntries(abNomes.map((m) => [m[1], { abiId: posDaHab[m[1]], abi: m[2] }])),
      habilidadesDaEspecie: (x) => ((gd.species[x] || {}).stats || {}).abis ? gd.species[x].stats.abis.map((i) => abIds[i]) : null };
    const mudados = corrigirTimes(bosses, treinadores, ctx, FILTRO);
    writeFileSync(new URL("../data/bosses.json", import.meta.url), JSON.stringify(bosses));
    for (const f of mudados) console.log("corrigido: " + f);
  }
  if (process.argv.includes("--aplicar")) {
    const nomeDoItem = Object.fromEntries(gd.items.filter(Boolean).map((x) => [x.NAME, x.name]));
    const feitos = preencherItensPerdidos(bosses, treinadores, nomeDoItem, FILTRO);
    writeFileSync(new URL("../data/bosses.json", import.meta.url), JSON.stringify(bosses));
    for (const f of feitos) console.log("item preenchido: " + f);
  }
  const rel = conferir(bosses, treinadores, FILTRO);
  if (COMO_JSON) console.log(JSON.stringify(rel, null, 1));
  else { for (const r of rel) console.log([r.chefao, r.variante, r.posicao, r.problema].filter(Boolean).join(" · ")); console.log("diferenças: " + rel.length); }
}
