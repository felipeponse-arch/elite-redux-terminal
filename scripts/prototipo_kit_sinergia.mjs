// PROTÓTIPO DESCARTÁVEL (10/10/2026) — fases 1 e 2 do pipeline de build
// (docs/pipeline_de_build.md). Não entra no app; serve para o usuário conferir
// os números antes de a lógica virar código de produção.
//
// Pergunta que ele responde: para o Centiskorch, o motor já sabe dizer que
// Fire Fang vale mais que Fire Lash por causa da sinergia do kit?
//
// Uso: node scripts/prototipo_kit_sinergia.mjs [NomeDaEspecie]
import { carregarRegras } from "../tests/unit/carregar_regras.mjs";

const R = carregarRegras();
const alvo = process.argv[2] || "Centiskorch";
const sp = R.SPECIES.find((s) => s && (s.n === alvo || s.sname === alvo));
if (!sp) { console.error("espécie não encontrada: " + alvo); process.exit(1); }

const nomeHab = (id) => R.nomeHabDuelo(id);

console.log("=== FASE 1: kit de " + sp.n + " (sname " + sp.sname + ") ===");
console.log("tipos: " + (sp.t || []).join("/"));
console.log("habilidades escolhíveis: " + (sp.ab || []).map(nomeHab).join(", "));
console.log("inatas (sempre ativas): " + (sp.inn || []).map(nomeHab).join(", "));

const golpes = R.golpesDeDueloAte(sp, null);
const deDano = golpes.filter((g) => R.MOVES[g] && R.MOVES[g][3] > 0);
console.log("golpes de dano no kit: " + deDano.length);

console.log("\n=== FASE 2: sinergias que o motor JÁ deriva sozinho ===");
const sin = R.sinergiasDaEspecie(sp);
if (!sin.length) console.log("(nenhuma)");
for (const h of sin) {
  const tipo = h.kind === "inn" ? "inata" : "escolhível";
  console.log("- " + h.name + " [" + tipo + "] via " + h.categoria + " por " + (h.motivos || []).join(" e ") + " -> " + (h.golpes || []).join(", "));
}

console.log("\n=== O caso de prova: Fire Fang x Fire Lash ===");
for (const nome of ["Fire Fang", "Fire Lash"]) {
  const id = R.MOVE_ID_BY_NAME[nome];
  if (id == null) { console.log(nome + ": não existe no dado"); continue; }
  const temNoKit = deDano.includes(id);
  const cats = [...R.categoriasDoGolpeDuelo(id)];
  const nivelAprendido = (sp.lm || []).filter((p) => p[1] === id).map((p) => p[0]);
  const habsQueRendem = sin.filter((h) => (h.golpes || []).includes(nome)).map((h) => h.name);
  console.log(
    nome + ": poder " + R.MOVES[id][3] +
    " | no kit: " + (temNoKit ? "sim" : "NÃO") +
    " | nível: " + (nivelAprendido.length ? nivelAprendido.join("/") : "tutor/outro") +
    " | categorias: " + (cats.length ? cats.join(",") : "nenhuma") +
    " | habilidades que rendem nele: " + (habsQueRendem.length ? habsQueRendem.join(", ") : "NENHUMA")
  );
}
