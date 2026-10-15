// Delta da er-config mais nova (upcoming d1a9a4c) sobre a NextDex 2.65.4 (ticket versao-nova/07, 15/10/2026).
// O app mira a versão mais nova: quando a config diz outra coisa que a NextDex, vale a config (regra do Felipe: código/config primeiro, NextDex depois).
// O que a config tem a mais que o dado bruto, em habilidades e espécies: o dado bruto não muda; este patch é aplicado por cima da extração
// (transform.mjs --config-nova=data/config_nova.json) e é pequeno e committado, para a extração rodar sem a er-config à mão.
//   gerar o patch:  node scripts/extracao/config_nova.mjs <pasta da er-config> <commit> [data/dex_compact.json] [data/config_nova.json]
// O patch tem: habilidades renomeadas (mesmo id: Keen Edge vira Sharpness), texto novo das que existem nos dois lados, habilidades novas (ids em
// seguida aos da NextDex) e, por espécie, o que a config tem de diferente: habilidades e innates (por nome) e atributos base.
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
const texto = (v) => (v === null ? null : v.replace(/^"|"$/g, "").replace(/\\"/g, '"').replace(/\\n/g, "\n"));

export function lerHabilidadesDaConfig(arq) {
  return blocos(arq, "ability").map((b) => ({ enum: campo(b, "id"), nome: texto(campo(b, "name")), desc: texto(campo(b, "description")) })).filter((a) => a.enum);
}

export function lerEspeciesDaConfig(arq) {
  // `species {` tem sub-blocos (dex, evo, learnset...): só as linhas do primeiro nível interessam
  const out = {};
  let atual = null, prof = 0;
  for (const bruta of arq.split(/\r?\n/)) {
    const l = bruta.trim();
    if (!atual) { if (l === "species {") { atual = { ab: [], inn: [] }; prof = 1; } continue; }
    if (l.endsWith("{")) { prof++; continue; }
    if (l === "}") { prof--; if (prof === 0) { if (atual.sname) out[atual.sname] = atual; atual = null; } continue; }
    if (prof !== 1) continue;
    const m = l.match(/^(\w+): (.*)$/);
    if (!m) continue;
    if (m[1] === "id") atual.sname = m[2];
    else if (m[1] === "ability") atual.ab.push(m[2]);
    else if (m[1] === "innate") atual.inn.push(m[2]);
    else if (["hp", "atk", "def", "spatk", "spdef", "spe"].includes(m[1])) (atual.b = atual.b || {})[m[1]] = +m[2];
  }
  return out;
}

// Compara a config com o dex e devolve o patch.
export function gerarPatch(dex, habilidadesDaConfig, especiesDaConfig, commit) {
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
  return { fonte: "Elite-Redux/er-config AbilityList.textproto e SpeciesList.textproto", commit, renomeadas, descricoes, novas, especies };
}

// Aplica o patch ao dex (muda o dex) e devolve um resumo. Idempotente.
export function aplicarPatch(dex, patch) {
  const resumo = { renomeadas: 0, descricoes: 0, novas: 0, especies: 0 };
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
  return resumo;
}

if ((process.argv[1] || "").endsWith("config_nova.mjs")) {
  const [pasta, commit, dexArq = "data/dex_compact.json", saida = "data/config_nova.json"] = process.argv.slice(2);
  if (!pasta || !commit) { console.error("uso: node scripts/extracao/config_nova.mjs <pasta da er-config> <commit> [dex_compact.json] [saida]"); process.exit(2); }
  const dex = JSON.parse(readFileSync(dexArq, "utf8"));
  const patch = gerarPatch(dex, lerHabilidadesDaConfig(readFileSync(pasta + "/AbilityList.textproto", "utf8")), lerEspeciesDaConfig(readFileSync(pasta + "/SpeciesList.textproto", "utf8")), commit);
  writeFileSync(saida, JSON.stringify(patch, null, 1) + "\n");
  console.log("config_nova.mjs: renomeadas " + patch.renomeadas.length + ", texto novo " + Object.keys(patch.descricoes).length + ", habilidades novas " + patch.novas.length + ", espécies " + Object.keys(patch.especies).length + " -> " + saida);
}
