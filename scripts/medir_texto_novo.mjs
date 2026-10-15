// Mede o que um dado novo da NextDex faz com o parser de habilidades do motor (ticket versao-nova/04, 15/10/2026).
//   node scripts/medir_texto_novo.mjs <gameData novo.json>     (ex.: o gameDataV2.65.4.json do ER-nextdex)
// Troca o texto curto de TODA habilidade pelo do dado novo (por nome) e compara o efeito lido, habilidade em uso por habilidade em uso
// (as compostas, "A + B", leem o texto das partes, então valem as duas trocas juntas):
//   - "efeito igual": o parser continua lendo o mesmo efeito;
//   - "efeito SOME":  o parser deixou de ler qualquer efeito (a classe que o ticket versao-nova/04 conserta com TEXTO_LIDO_DA_VERSAO_NOVA_DUELO);
//   - "efeito muda":  o parser lê outra coisa (pode ser mudança de verdade do jogo: conferir no código do jogo).
// Sai com código 1 se sobrar habilidade que perde o efeito: é o portão da troca de dado (versao-nova/05).
import { readFileSync } from "node:fs";
import { carregarRegras } from "../tests/unit/carregar_regras.mjs";

const caminho = process.argv[2];
if (!caminho) { console.error("uso: node scripts/medir_texto_novo.mjs <gameData novo.json>"); process.exit(2); }
const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const novoDado = JSON.parse(readFileSync(caminho, "utf8"));
const porNome = {}; novoDado.abilities.forEach((a) => { if (a && a.name && porNome[a.name] === undefined) porNome[a.name] = a; });
const semClimas = (k, v) => (k === "climasProprios" ? undefined : v);
const limpar = () => { for (const c of [R.descricaoPorIdCache, R.descricaoDeHabilidadeCache]) for (const k of Object.keys(c)) delete c[k]; };
const emUso = new Set();
R.SPECIES.forEach((s) => s && R.uniqueIds((s.ab || []).concat(s.inn || [])).forEach((id) => emUso.add(id)));
const base = JSON.stringify(R.efeitoDasHabilidadesNoDuelo([], "MEDIR_BASE", null), semClimas);
let seq = 0;
const lerTodas = () => { const m = {}; for (const id of emUso) m[id] = JSON.stringify(R.efeitoDasHabilidadesNoDuelo([id], "MEDIR_" + (seq++), null), semClimas); return m; };

limpar();
const antes = lerTodas();
const textosVelhos = R.ABILITIES.map((a) => (a ? a[1] : null));
let trocados = 0;
R.ABILITIES.forEach((a) => { if (a && porNome[a[0]] && porNome[a[0]].desc !== a[1]) { a[1] = porNome[a[0]].desc; trocados++; } });
limpar();
const depois = lerTodas();
R.ABILITIES.forEach((a, i) => { if (a) a[1] = textosVelhos[i]; });
limpar();

const r = { igual: 0, some: [], muda: [] };
const vistos = new Set();
for (const id of emUso) {
  const nome = R.ABILITIES[id][0] + (/\+/.test(R.ABILITIES[id][1] || "") ? " (composta)" : "");
  if (antes[id] === depois[id]) { r.igual++; continue; }
  if (vistos.has(nome)) continue; vistos.add(nome);
  (depois[id] === base && antes[id] !== base ? r.some : r.muda).push(nome);
}
console.log("textos trocados:", trocados, "| habilidades em uso:", emUso.size, "| efeito igual:", r.igual, "| efeito SOME:", r.some.length, "| efeito muda:", r.muda.length);
if (r.some.length) console.log("SOME:", r.some.join(", "));
if (r.muda.length) console.log("MUDA (conferir no código do jogo):", r.muda.join(", "));
process.exitCode = r.some.length ? 1 : 0;
