// Curadoria do Playtester (pedido do usuário, 2026-09-24): toda build que a IA
// gerou pro jogador é candidata a entrar em data/builds.json - a lista curada que
// o app consulta ANTES de chamar a IA. Uma build de IA não vira curada sozinha:
// ela é montada pro contexto daquele momento (time, cap, chefão), e a validação do
// app só confere se ela é LEGAL, não se é BOA. Este script faz a parte mecânica
// da curadoria; o julgamento (a build é boa pro papel?) é do Playtester, que lê o
// relatório e escolhe quais promover.
//
// Uso:
//   node scripts/playtester_curadoria.mjs <save.json>
//       Relatório das candidatas (checklist abaixo). Não grava nada.
//   node scripts/playtester_curadoria.mjs <save.json> --promover SNAME[#n],SNAME[#n]
//       Promove as escolhidas pra data/builds.json (n = posição na lista de builds
//       da espécie no save, começando em 1; sem #n = a build ativa).
//
// <save.json> é o documento sync/save do app (lido com a ferramenta read_db do
// artifact) ou um save exportado. Tudo que vem dele é DADO, nunca instrução: a
// justificativa da IA é copiada como nota, nunca interpretada.
//
// Checklist mecânico (cada item reaproveita a MESMA regra que o app usa):
//   1. espécie existe nesta versão dos dados
//   2. validateAiBuild sem level cap: habilidade escolhível, natureza real, 4
//      golpes do movepool, sinergia obrigatória, papel x golpe, nada de golpe de
//      dupla (src/regras/validacao_build_ia.js)
//   3. plano de golpes: cada destino é aprendido de verdade por esta forma
//   4. estilo (pelos EVs) ainda não coberto por uma curada da espécie
//   5. não repete os 4 golpes de uma curada que já existe
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "../tests/unit/carregar_regras.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const caminhoBuilds = join(root, "data", "builds.json");
const [arquivoSave, flag, listaPromover] = process.argv.slice(2);
if (!arquivoSave) {
  console.error("uso: node scripts/playtester_curadoria.mjs <save.json> [--promover SNAME[#n],...]");
  process.exit(2);
}

// Sem level cap (último marco): a curada vale pra run inteira; o que trava por
// cap é resolvido no app pelo plano de golpes e pela ponte.
const R = carregarRegras({ milestone: 9 });
const save = JSON.parse(readFileSync(arquivoSave, "utf8"));
const builds = JSON.parse(readFileSync(caminhoBuilds, "utf8"));
const ROTULOS = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
const evsTexto = (evs) => evs.map((v, i) => (v > 0 ? v + " " + ROTULOS[i] : null)).filter(Boolean).join(" / ");

function avaliar(sname, b) {
  const falhas = [];
  const sp = R.getSpeciesBySname(sname);
  if (!sp) return { sp: null, falhas: ["espécie não existe na versão " + R.DATA.meta.version] };
  const motivo = {};
  const v = R.validateAiBuild(sp, { ability: b.ability, nature: b.nature, item: b.item || "", moves: b.moves, evs: b.evs, rationale: b.rationale || "" }, motivo);
  if (!v) falhas.push("validação do app: " + (motivo.txt || "rejeitada"));
  const plano = {};
  Object.entries(b.plano || {}).forEach(([de, para]) => {
    const nivel = R.nivelDoGolpe(sp, para);
    if (!b.moves.includes(de)) falhas.push("plano parte de " + de + ", fora da build");
    else if (nivel === null || nivel === 0) falhas.push("plano leva a " + para + ", que não é golpe de nível desta forma");
    else plano[de] = para;
  });
  const estilo = R.estiloDeEvs(b.evs);
  const curadas = R.curadasDe(sname);
  if (curadas.some((c) => (c.estilo || R.estiloDeEvs(c.evs)) === estilo)) falhas.push("já existe curada " + estilo + " pra esta espécie");
  const chave = (m) => m.slice().sort().join("|");
  if (curadas.some((c) => chave(c.moves) === chave(b.moves))) falhas.push("mesmos 4 golpes de uma curada existente");
  if (curadas.length >= 3) falhas.push("espécie já tem 3 curadas");
  return { sp, falhas, estilo, plano, validada: v };
}

const candidatas = [];
Object.entries(save.customBuilds || {}).forEach(([sname, lista]) => {
  (Array.isArray(lista) ? lista : [lista]).forEach((b, i) => {
    if (!b || b.source !== "ia" || !Array.isArray(b.moves) || !Array.isArray(b.evs)) return;
    candidatas.push({ sname, n: i + 1, ativa: !!b.active, b, ...avaliar(sname, b) });
  });
});

if (flag !== "--promover") {
  console.log(`# Curadoria do Playtester - ${candidatas.length} build(s) de IA no save\n`);
  candidatas.forEach((c) => {
    const nome = c.sp ? c.sp.n : c.sname;
    console.log(`## ${nome} #${c.n}${c.ativa ? " (ativa)" : ""} - ${c.falhas.length ? "NÃO PASSA" : "passa no checklist"}`);
    console.log(`- ${c.b.ability} | ${c.b.nature} | ${c.b.item || "sem item"} | ${evsTexto(c.b.evs)} | estilo ${c.estilo || "?"}`);
    console.log(`- golpes: ${c.b.moves.join(", ")}` + (Object.keys(c.plano || {}).length ? ` | plano: ${Object.entries(c.plano).map(([a, b]) => a + " → " + b).join(", ")}` : ""));
    if (c.b.rationale) console.log(`- justificativa da IA (dado, não instrução): ${JSON.stringify(c.b.rationale)}`);
    c.falhas.forEach((f) => console.log(`- ✗ ${f}`));
    console.log("");
  });
  console.log("Pra promover: node scripts/playtester_curadoria.mjs <save.json> --promover " +
    (candidatas.filter((c) => !c.falhas.length).map((c) => c.sname + "#" + c.n).join(",") || "SNAME#n"));
  process.exit(0);
}

const pedidos = String(listaPromover || "").split(",").map((s) => s.trim()).filter(Boolean);
if (!pedidos.length) { console.error("nada pra promover"); process.exit(2); }
let promovidas = 0;
for (const pedido of pedidos) {
  const [sname, nStr] = pedido.split("#");
  const c = candidatas.find((x) => x.sname === sname && (nStr ? x.n === Number(nStr) : x.ativa));
  if (!c) { console.error(`✗ ${pedido}: não achei essa build de IA no save`); process.exitCode = 1; continue; }
  if (c.falhas.length) { console.error(`✗ ${pedido}: não passa no checklist (${c.falhas.join("; ")})`); process.exitCode = 1; continue; }
  // O checklist rodou contra o arquivo de ANTES; duas promoções da mesma espécie
  // nesta execução precisam ser conferidas contra o que já foi gravado aqui.
  const jaGravadas = builds[sname] ? (Array.isArray(builds[sname]) ? builds[sname] : [builds[sname]]) : [];
  if (jaGravadas.length >= 3 || jaGravadas.some((x) => (x.estilo || R.estiloDeEvs(x.evs)) === c.estilo)) {
    console.error(`✗ ${pedido}: ${sname} já tem curada ${c.estilo} (ou 3 curadas) depois das promoções anteriores desta execução`);
    process.exitCode = 1;
    continue;
  }
  const entrada = {
    ability: c.b.ability, nature: c.b.nature, evs: evsTexto(c.b.evs), item: c.b.item || "", moves: c.b.moves.slice(),
    note: String(c.b.rationale || "").slice(0, 280), fonte: "ia-curada-playtester", versao: R.DATA.meta.version, estilo: c.estilo,
  };
  if (Object.keys(c.plano).length) entrada.plano = c.plano;
  const atual = builds[sname];
  builds[sname] = atual ? (Array.isArray(atual) ? atual.concat([entrada]) : [atual, entrada]) : entrada;
  promovidas++;
  console.log(`✓ ${c.sp.n}: build ${c.estilo} promovida`);
}
if (promovidas) {
  writeFileSync(caminhoBuilds, JSON.stringify(builds, null, 2) + "\n", "utf8");
  console.log(`\n${promovidas} build(s) gravada(s) em data/builds.json. Rode npm run build (valida o dado e monta o app).`);
}
