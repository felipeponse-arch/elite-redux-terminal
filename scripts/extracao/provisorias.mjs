// Espécies PROVISÓRIAS do dado (ticket versao-nova/10): estão no dex_compact.json com `provisoria: "<motivo>"` e ficam fora de SPECIES (Dex, builds, pipeline,
// duelo, rank) porque a config não as descreve por inteiro (a Mega Bruxish e a Mega Jellicent vieram sem Speed, e a Jellicent Mega com os atributos da base).
// Este conferidor avisa quando a config passar a ter números reais: para cada provisória, olha o bloco da SpeciesList e diz se agora traz os 6 atributos
// base e se eles diferem do que está no dado. Saída com código 1 = "hora de regerar o patch (config_nova.mjs) e tirar a marca".
//   node scripts/extracao/provisorias.mjs <pasta da er-config | SpeciesList.textproto> [data/dex_compact.json]
// Também é chamado pelo alarme semanal (scripts/alarme_upstream.mjs) com o SpeciesList.textproto da config no GitHub.
import { readFileSync, statSync } from "node:fs";
import { lerEspeciesDaConfig } from "./config_nova.mjs";

const CAMPOS = ["hp", "atk", "def", "spatk", "spdef", "spe"];

// dex: objeto do dex_compact.json; textoSpeciesList: conteúdo da SpeciesList.textproto. Devolve [{ sname, motivo, estado, config, dado }].
export function conferirProvisorias(dex, textoSpeciesList) {
  const config = lerEspeciesDaConfig(textoSpeciesList);
  return dex.species.filter((s) => s && s.provisoria).map((s) => {
    const c = config[s.sname];
    const b = (c && c.b) || {};
    const completa = CAMPOS.every((k) => b[k] !== undefined);
    const dado = s.b.slice(), daConfig = CAMPOS.map((k) => b[k]);
    const mudou = completa && CAMPOS.some((k, i) => b[k] !== dado[i]);
    const estado = !c ? "sumiu-da-config" : completa ? (mudou ? "numeros-novos" : "completa-igual-ao-dado") : "incompleta";
    return { sname: s.sname, motivo: s.provisoria, estado, config: daConfig, dado };
  });
}
export const PRECISA_REVISAR = new Set(["numeros-novos", "completa-igual-ao-dado", "sumiu-da-config"]);

if ((process.argv[1] || "").endsWith("provisorias.mjs")) {
  const [alvo, dexArq = "data/dex_compact.json"] = process.argv.slice(2);
  if (!alvo) { console.error("uso: node scripts/extracao/provisorias.mjs <pasta da er-config | SpeciesList.textproto> [dex_compact.json]"); process.exit(2); }
  const arq = statSync(alvo).isDirectory() ? alvo + "/SpeciesList.textproto" : alvo;
  const r = conferirProvisorias(JSON.parse(readFileSync(dexArq, "utf8")), readFileSync(arq, "utf8"));
  for (const e of r) console.log(e.sname + ": " + e.estado + " (config " + e.config.join("/") + " | dado " + e.dado.join("/") + ")");
  const revisar = r.filter((e) => PRECISA_REVISAR.has(e.estado));
  console.log(revisar.length ? "ATENÇÃO: " + revisar.length + " provisória(s) com a config mudada: regerar o patch e tirar a marca." : "provisórias: " + r.length + ", config ainda incompleta.");
  process.exitCode = revisar.length ? 1 : 0;
}
