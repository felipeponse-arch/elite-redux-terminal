// Delta da er-config mais nova (upcoming d1a9a4c) sobre a NextDex 2.65.4 (ticket versao-nova/07, 15/10/2026).
// O app mira a versão mais nova: quando a config diz outra coisa que a NextDex, vale a config (regra do Felipe: código/config primeiro, NextDex depois).
// O que a config tem a mais que o dado bruto, em habilidades e espécies: o dado bruto não muda; este patch é aplicado por cima da extração
// (transform.mjs --config-nova=data/config_nova.json) e é pequeno e committado, para a extração rodar sem a er-config à mão.
//   gerar o patch:  node scripts/extracao/config_nova.mjs <pasta da er-config> <commit> [data/dex_compact.json] [data/config_nova.json]
// O patch tem: habilidades renomeadas (mesmo id: Keen Edge vira Sharpness), texto novo das que existem nos dois lados, habilidades novas (ids em
// seguida aos da NextDex) e, por espécie, o que a config tem de diferente: habilidades e innates (por nome) e atributos base.
// Golpes (ticket versao-nova/09): golpes da config que a NextDex não tem (entram em seguida aos 1032 do dado, na ordem da config) e onde as espécies os aprendem
// (level-up e tutor). Ticket versao-nova/10: o aprendizado de TODAS as espécies segue a config (level-up e tutor; adições e retiradas), menos os tutores
// "universais" (Snore, Metronome, Rest...: a config os marca por golpe e a NextDex os expande por conta própria; ficam como a NextDex) e as espécies que a
// config não descreve (forma sem learnset nem uses_learnset). Espécies novas (as Mega Bruxish e Jellicent) entram a partir da config.
import { readFileSync, writeFileSync } from "node:fs";

const SEM = "-------";
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

function blocos(texto, abertura) {
  const out = [];
  let atual = null, prof = 0;
  for (const bruta of texto.split(/\r?\n/)) {
    const l = bruta.trim();
    if (!atual) { if (l === abertura + " {") { atual = []; prof = 1; } continue; }
    if (l.endsWith("{")) { prof++; continue; }
    if (l === "}") { prof--; if (prof === 0) { out.push(atual); atual = null; } continue; }
    if (prof === 1) atual.push(l);
  }
  return out;
}
const campo = (linhas, k) => { const l = linhas.find((x) => x.startsWith(k + ": ")); return l ? l.slice(k.length + 2) : null; };
const texto = (v) => (v === null ? null : v.replace(/^"|"$/g, "").replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, "\n"));

export function lerHabilidadesDaConfig(arq) {
  return blocos(arq, "ability").map((b) => ({ enum: campo(b, "id"), nome: texto(campo(b, "name")), desc: texto(campo(b, "description")) })).filter((a) => a.enum);
}

const EFEITO_ESPECIAL = { EFFECT_HIT: "Hit" };
function nomeDoEfeito(e) { return !e ? "Hit" : EFEITO_ESPECIAL[e] || e.replace(/^EFFECT_/, "").toLowerCase().split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "); }
const FLAG_DA_CONFIG_PARA_FLAG_DO_DEX = { contact: "Makes Contact", striker: "Kick Based", sound: "Sound Based", horn: "Horn Based", drill: "Drill Based", hammer: "Hammer Based", arrow: "Arrow Based", lunar: "Lunar Move", throwing: "Throw Based" };

// Golpes da config (nome, tipo, split, poder, precisão, pp, prioridade, efeito, chance, flags).
export function lerGolpesNovosDaConfig(arq) {
  return blocos(arq, "moves").map((b) => {
    const c = {}; b.forEach((l) => { const m = l.match(/^(\w+): ?(.*)$/); if (m) c[m[1]] = m[2]; });
    return c;
  }).filter((c) => c.id && c.name).map((c) => ({
    enum: c.id, nome: texto(c.name), tipo: (c.type || "TYPE_NORMAL").replace("TYPE_", ""), split: c.split || "PHYSICAL", poder: +(c.power || 0), precisao: +(c.accuracy || 0),
    pp: +(c.pp || 0), prio: +(c.priority || 0), efeito: nomeDoEfeito(c.effect), chance: +(c.effect_chance || 0), light: c.light === "true", tutor: c.tutor || null,
    flags: Object.keys(FLAG_DA_CONFIG_PARA_FLAG_DO_DEX).filter((k) => c[k] === "true").map((k) => FLAG_DA_CONFIG_PARA_FLAG_DO_DEX[k]),
  }));
}

// O que cada espécie aprende pela config: level-up [[nível, golpe]] e tutor [golpe] (sem os universais), com uses_learnset resolvido.
export function lerAprendizadoDaConfig(arq, nomePorEnum) {
  const cfg = {};
  let cur = null, prof = 0, nivel = null;
  for (const bruta of arq.split(/\r?\n/)) {
    const l = bruta.trim();
    if (!cur) { if (l === "species {") { cur = { lm: [], tu: [], tem: false }; prof = 1; } continue; }
    if (l.endsWith("{")) { prof++; if (l === "level {") nivel = { lv: null, mv: [] }; if (l === "learnset {") cur.tem = true; continue; }
    if (l === "}") {
      prof--;
      if (prof === 2 && nivel) { nivel.mv.forEach((m) => cur.lm.push([nivel.lv, nomePorEnum[m]])); nivel = null; }
      if (prof === 0) { if (cur.sname) cfg[cur.sname] = cur; cur = null; }
      continue;
    }
    let m;
    if (prof === 1 && (m = l.match(/^id: (SPECIES_\w+)/))) cur.sname = m[1];
    if (prof === 1 && (m = l.match(/^uses_learnset: (SPECIES_\w+)/))) cur.usa = m[1];
    if (prof === 3 && nivel) { if ((m = l.match(/^level: (\d+)/))) nivel.lv = +m[1]; if ((m = l.match(/^move: (MOVE_\w+)/))) nivel.mv.push(m[1]); }
    if (prof === 2 && (m = l.match(/^tutor: (MOVE_\w+)/))) cur.tu.push(nomePorEnum[m[1]]);
  }
  const out = {};
  for (const [sn, c] of Object.entries(cfg)) {
    const base = c.usa && cfg[c.usa] ? cfg[c.usa] : c;
    if (!c.tem && !c.usa) continue;
    out[sn] = { lm: base.lm.map(([lv, n]) => [lv, typeof n === "string" && n.startsWith("MOVE_") ? nomePorEnum[n] : n]), tu: base.tu.slice() };
  }
  return out;
}

export function lerEspeciesDaConfig(arq) {
  // `species {` tem sub-blocos (dex, evo, learnset...): só as linhas do primeiro nível interessam
  const out = {};
  let atual = null, prof = 0;
  for (const bruta of arq.split(/\r?\n/)) {
    const l = bruta.trim();
    if (!atual) { if (l === "species {") { atual = { ab: [], inn: [] }; prof = 1; } continue; }
    if (l.endsWith("{")) { prof++; if (prof === 2) { atual.emMega = l === "mega {"; atual.emDex = l === "dex {"; } continue; }
    if (l === "}") { prof--; if (prof === 1) { atual.emMega = false; atual.emDex = false; } if (prof === 0) { if (atual.sname) out[atual.sname] = atual; atual = null; } continue; }
    if (prof === 2 && atual.emMega) { const mm = l.match(/^(from|item): (.*)$/); if (mm) atual["mega" + mm[1]] = mm[2]; continue; }
    if (prof === 2 && l.startsWith("name: ") && atual.emDex) { atual.nome = texto(l.slice(6)); continue; }
    if (prof !== 1) continue;
    const m = l.match(/^(\w+): (.*)$/);
    if (!m) continue;
    if (m[1] === "type") atual.tipo1 = m[2].replace("TYPE_", "");
    else if (m[1] === "type2") atual.tipo2 = m[2].replace("TYPE_", "");
    else if (m[1] === "form_of") atual.formaDe = m[2];
    else if (m[1] === "uses_learnset") atual.usaLearnset = m[2];
    if (m[1] === "id") atual.sname = m[2];
    else if (m[1] === "ability") atual.ab.push(m[2]);
    else if (m[1] === "innate") atual.inn.push(m[2]);
    else if (["hp", "atk", "def", "spatk", "spdef", "spe"].includes(m[1])) (atual.b = atual.b || {})[m[1]] = +m[2];
  }
  return out;
}

// Compara a config com o dex e devolve o patch.
export function gerarPatch(dex, habilidadesDaConfig, especiesDaConfig, commit, golpesDaConfig = [], aprendizado = {}, universais = new Set()) {
  const nomesDex = new Set(dex.abilities.map((a) => a[0]));
  const nomesCfg = new Set(habilidadesDaConfig.map((a) => a.nome));
  const renomeadas = [];
  for (const c of habilidadesDaConfig) {
    if (nomesDex.has(c.nome)) continue;
    // o enum não muda no renome (ABILITY_KEEN_EDGE guarda o nome "Sharpness"): o nome velho é o que vira o mesmo enum
    const velho = dex.abilities.map((a) => a[0]).find((n) => !nomesCfg.has(n) && norm("ABILITY_" + n) === norm(c.enum));
    if (velho) renomeadas.push([velho, c.nome]);
  }
  const renomeou = new Map(renomeadas.map(([de, para]) => [para, de]));
  // nomes repetidos (As One, Embody Aspect): casa a n-ésima ocorrência de cada lado
  const ocorrencia = new Map(), ocorrenciasDex = new Map();
  dex.abilities.forEach((a, i) => { if (!ocorrenciasDex.has(a[0])) ocorrenciasDex.set(a[0], []); ocorrenciasDex.get(a[0]).push(i); });
  const descricoes = {}, novas = [];
  for (const c of habilidadesDaConfig) {
    const velho = renomeou.get(c.nome) || c.nome;
    const k = ocorrencia.get(velho) || 0; ocorrencia.set(velho, k + 1);
    const posicoes = ocorrenciasDex.get(velho);
    if (posicoes && posicoes[k] !== undefined) { if (dex.abilities[posicoes[k]][1] !== c.desc) descricoes[c.nome + (k ? "#" + k : "")] = c.desc; }
    else if (!posicoes) novas.push({ nome: c.nome, desc: c.desc });
  }
  const nomeDoEnum = new Map(habilidadesDaConfig.map((a) => [a.enum, a.nome]));
  const nomeDoDex = (id) => { const n = dex.abilities[id] && dex.abilities[id][0]; return renomeadas.find(([de]) => de === n) ? renomeadas.find(([de]) => de === n)[1] : n; };
  const especies = {};
  for (const s of dex.species) {
    if (!s) continue;
    const c = especiesDaConfig[s.sname];
    if (!c) continue;
    const limpa = (arr) => arr.filter((x) => x && x !== SEM);
    const abCfg = c.ab.map((e) => nomeDoEnum.get(e)), innCfg = c.inn.map((e) => nomeDoEnum.get(e));
    const abDex = s.ab.map(nomeDoDex), innDex = s.inn.map(nomeDoDex);
    const e = {};
    if (limpa(abCfg).join("|") !== limpa(abDex).join("|")) e.ab = abCfg;
    if (limpa(innCfg).join("|") !== limpa(innDex).join("|")) e.inn = innCfg;
    if (c.b && Object.keys(c.b).length === 6 && s.b.some((v, k) => v !== c.b[["hp", "atk", "def", "spatk", "spdef", "spe"][k]]) && s.b.some((v) => v > 0)) {
      e.b = ["hp", "atk", "def", "spatk", "spdef", "spe"].map((k) => c.b[k]);
    }
    if (Object.keys(e).length) especies[s.sname] = e;
  }
  const nomesDeGolpe = new Set(dex.moves.map((m) => m && m[0]));
  const golpesNovos = golpesDaConfig.filter((g) => !nomesDeGolpe.has(g.nome));
  // Aprendizado: adições e retiradas de level-up e de tutor por espécie (golpes por nome). Tutores universais ficam como a NextDex.
  const aprende = {};
  for (const s of dex.species) {
    const a = s && aprendizado[s.sname];
    if (!a) continue;
    const lmD = s.lm.map(([lv, id]) => lv + ":" + dex.moves[id][0]), lmC = a.lm.map(([lv, n]) => lv + ":" + n);
    const tuD = new Set(s.tu.map((id) => dex.moves[id][0]).filter((n) => !universais.has(n))), tuC = new Set(a.tu.filter((n) => !universais.has(n)));
    const par = (x) => { const i = x.indexOf(":"); return [+x.slice(0, i), x.slice(i + 1)]; };
    const lm = [...new Set(lmC.filter((x) => !lmD.includes(x)))].map(par), lmRem = [...new Set(lmD.filter((x) => !lmC.includes(x)))].map(par);
    const tu = [...tuC].filter((n) => !tuD.has(n)), tuRem = [...tuD].filter((n) => !tuC.has(n));
    if (lm.length || lmRem.length || tu.length || tuRem.length) aprende[s.sname] = { lm, lmRem, tu, tuRem };
  }
  // Espécies da config que o dex não tem (as Mega Bruxish e Jellicent): entram no fim, a partir da config.
  const snames = new Set(dex.species.filter(Boolean).map((x) => x.sname));
  const especiesNovas = [];
  for (const c of Object.values(especiesDaConfig)) {
    if (snames.has(c.sname) || !c.formaDe || !c.megafrom) continue;
    const base = dex.species.find((x) => x && x.sname === c.megafrom);
    if (!base) continue;
    const b = c.b || {};
    const nomeAb = (e) => nomeDoEnum.get(e);
    especiesNovas.push({ sname: c.sname, base: c.megafrom, pedraEnum: c.megaitem, tipos: [c.tipo1, c.tipo2].filter(Boolean),
      b: ["hp", "atk", "def", "spatk", "spdef", "spe"].map((k, i) => (b[k] !== undefined ? b[k] : base.b[i])), // a config omite `spe` nas duas Megas: vale a da espécie base
      speDaConfig: b.spe !== undefined,
      provisoria: ["hp", "atk", "def", "spatk", "spdef", "spe"].every((k) => b[k] !== undefined) ? undefined : "a config d1a9a4c não traz todos os atributos base (falta " + ["hp", "atk", "def", "spatk", "spdef", "spe"].filter((k) => b[k] === undefined).join(", ") + "); os que faltam valem os da base; fora da Dex, das builds, do pipeline e do rank até a config ter números reais (scripts/extracao/provisorias.mjs)",
      ab: c.ab.map(nomeAb), inn: c.inn.map(nomeAb), usaLearnset: c.usaLearnset || c.megafrom });
  }
  return { fonte: "Elite-Redux/er-config AbilityList, SpeciesList e MoveList.textproto", commit, renomeadas, descricoes, novas, especies, golpes: golpesNovos, aprende, especiesNovas };
}

// Aplica o patch ao dex (muda o dex) e devolve um resumo. Idempotente.
export function aplicarPatch(dex, patch) {
  const resumo = { renomeadas: 0, descricoes: 0, novas: 0, especies: 0, golpes: 0, aprende: 0 };
  for (const [de, para] of patch.renomeadas) {
    const i = dex.abilities.findIndex((a) => a[0] === de);
    if (i >= 0) { dex.abilities[i][0] = para; resumo.renomeadas++; }
  }
  for (const [chave, desc] of Object.entries(patch.descricoes)) {
    const [nome, k = "0"] = chave.split("#");
    const posicoes = []; dex.abilities.forEach((a, i) => { if (a[0] === nome) posicoes.push(i); });
    const i = posicoes[+k];
    if (i !== undefined && dex.abilities[i][1] !== desc) { dex.abilities[i][1] = desc; resumo.descricoes++; }
  }
  for (const n of patch.novas) {
    if (dex.abilities.some((a) => a[0] === n.nome)) continue;
    dex.abilities.push([n.nome, n.desc]);
    resumo.novas++;
  }
  const idPorNome = new Map();
  dex.abilities.forEach((a, i) => { if (!idPorNome.has(a[0])) idPorNome.set(a[0], i); });
  const ids = (nomes) => nomes.map((n) => { if (!idPorNome.has(n)) throw new Error("habilidade sem id no dex: " + n); return idPorNome.get(n); });
  for (const s of dex.species) {
    const e = s && patch.especies[s.sname];
    if (!e) continue;
    if (e.ab) s.ab = ids(e.ab);
    if (e.inn) s.inn = ids(e.inn);
    if (e.b) s.b = e.b.slice();
    resumo.especies++;
  }
  // golpes novos (ids em seguida aos da NextDex) e onde as espécies os aprendem
  for (const g of patch.golpes || []) {
    if (dex.moves.some((m) => m && m[0] === g.nome)) continue;
    const tipo = dex.types.indexOf(g.tipo[0] + g.tipo.slice(1).toLowerCase()), split = dex.splits.indexOf(g.split);
    if (tipo < 0 || split < 0) throw new Error("tipo/split desconhecido: " + g.nome);
    const flags = g.flags.map((f) => dex.flags.indexOf(f)).filter((i) => i >= 0);
    dex.moves.push([g.nome, tipo, split, g.poder, g.precisao, g.pp, "", g.prio, flags, -1, 0, g.efeito]);
    resumo.golpes++;
  }
  const idDoGolpe = new Map(); dex.moves.forEach((m, i) => { if (m && !idDoGolpe.has(m[0])) idDoGolpe.set(m[0], i); });
  for (const s of dex.species) {
    const a = s && (patch.aprende || {})[s.sname];
    if (!a) continue;
    for (const [lv, m] of a.lmRem || []) { const i = s.lm.findIndex((e) => e[0] === lv && e[1] === idDoGolpe.get(m)); if (i >= 0) s.lm.splice(i, 1); }
    for (const m of a.tuRem || []) { const i = s.tu.indexOf(idDoGolpe.get(m)); if (i >= 0) s.tu.splice(i, 1); }
    for (const [lv, m] of a.lm) {
      const id = idDoGolpe.get(m);
      if (s.lm.some((e) => e[0] === lv && e[1] === id)) continue;
      let i = s.lm.length; while (i > 0 && s.lm[i - 1][0] > lv) i--; // depois dos que já aprende nesse nível
      s.lm.splice(i, 0, [lv, id]);
    }
    for (const m of a.tu) { const id = idDoGolpe.get(m); if (!s.tu.includes(id)) s.tu.push(id); }
    resumo.aprende++;
  }
  // espécies novas (Mega): copiam descrição, aprendizado (uses_learnset) e `cab` da base; a base passa a apontar para a Mega
  resumo.especiesNovas = 0;
  for (const n of patch.especiesNovas || []) {
    if (dex.species.some((x) => x && x.sname === n.sname)) continue;
    const base = dex.species.find((x) => x && x.sname === n.base), usa = dex.species.find((x) => x && x.sname === n.usaLearnset) || base;
    const x = dex.species.length;
    const tipos = n.tipos.map((t) => dex.types.indexOf(t[0] + t.slice(1).toLowerCase()));
    if (tipos.some((t) => t < 0)) throw new Error("tipo desconhecido em " + n.sname);
    dex.species.push({ x, i: base.i, n: base.n + " Mega", sname: n.sname, t: tipos, b: n.b.slice(), ab: ids(n.ab), inn: ids(n.inn), ev: [], lm: usa.lm.map((e) => e.slice()), tu: usa.tu.slice(),
      d: base.d, senc: [], wenc: null, frm: [], cab: base.cab });
    if (n.provisoria) dex.species[x].provisoria = n.provisoria; // fora de SPECIES (src/regras/dados_base.js): não aparece na Dex, nas builds, no pipeline nem no rank
    const evo = base.ev.find((e) => e[1] === n.pedraEnum);
    if (evo) evo[2] = x;
    resumo.especiesNovas++;
  }
  return resumo;
}

if ((process.argv[1] || "").endsWith("config_nova.mjs")) {
  const [pasta, commit, dexArq = "data/dex_compact.json", saida = "data/config_nova.json"] = process.argv.slice(2);
  if (!pasta || !commit) { console.error("uso: node scripts/extracao/config_nova.mjs <pasta da er-config> <commit> [dex_compact.json] [saida]"); process.exit(2); }
  const dex = JSON.parse(readFileSync(dexArq, "utf8"));
  const golpesTxt = readFileSync(pasta + "/MoveList.textproto", "utf8"), especiesTxt = readFileSync(pasta + "/SpeciesList.textproto", "utf8");
  const golpesDaConfig = lerGolpesNovosDaConfig(golpesTxt), nomePorEnum = Object.fromEntries(golpesDaConfig.map((g) => [g.enum, g.nome]));
  const universais = new Set(golpesDaConfig.filter((g) => /^TUTOR_UNIVERSAL/.test(g.tutor || "")).map((g) => g.nome));
  const patch = gerarPatch(dex, lerHabilidadesDaConfig(readFileSync(pasta + "/AbilityList.textproto", "utf8")), lerEspeciesDaConfig(especiesTxt), commit, golpesDaConfig, lerAprendizadoDaConfig(especiesTxt, nomePorEnum), universais);
  writeFileSync(saida, JSON.stringify(patch, null, 1) + "\n");
  console.log("config_nova.mjs: renomeadas " + patch.renomeadas.length + ", texto novo " + Object.keys(patch.descricoes).length + ", habilidades novas " + patch.novas.length + ", espécies " + Object.keys(patch.especies).length + ", golpes novos " + patch.golpes.length + ", espécies com aprendizado diferente " + Object.keys(patch.aprende).length + ", espécies novas " + patch.especiesNovas.length + " -> " + saida);
}
