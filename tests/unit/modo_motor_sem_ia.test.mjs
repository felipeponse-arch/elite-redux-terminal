// Modo Motor nunca chama a IA (ticket time-pelo-motor/01, Fase F3, 21/10/2026). Duas provas independentes:
//  1) FONTE: nenhum arquivo do Modo Motor (regra e tela) cita claude.use, pedirIA nem qualquer outra porta da IA;
//  2) EXECUÇÃO: rodando a montagem inteira com um `claude` espião no escopo, o espião não é tocado.
// A prova de navegador (clique no botão padrão do Motor e troca para a IA) é a seção 31 do smoke.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const ARQUIVOS_DO_MOTOR = ["src/regras/time_pelo_motor.js", "src/regras/time_pelo_motor_papeis.js", "src/ui/modo_motor.js"];
// As portas da IA do app: o cliente do jogo (claude.use), o cliente único (pedirIA) e os geradores que passam por ele.
const PORTAS_DA_IA = /claude\.use|\bpedirIA\b|\bgenerateBuildWithAI\b|\bgerarBuildsDoTimeComIA\b|\bgenerateTeamForArchetype\b|\bgenerateTeamUsageGuide\b|\bgenerateCompleteTeam\b|window\.claude|\bsample\b/;

test("o fonte do Modo Motor (regra e tela) não toca em nenhuma porta da IA", () => {
  for (const arq of ARQUIVOS_DO_MOTOR) {
    const src = readFileSync(new URL("../../" + arq, import.meta.url), "utf8");
    // Só o código conta: comentário pode citar a IA para explicar a regra.
    const codigo = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    assert.doesNotMatch(codigo, PORTAS_DA_IA, arq);
  }
});

test("montar o time pelo Motor não chama claude.use nem pedirIA (execução com espião)", () => {
  const R = carregarRegras({ milestone: 2 });
  const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
  const nomes = ["Centiskorch", "Scizor", "Garchomp", "Metagross", "Grimmsnarl", "Togekiss", "Klefki", "Gardevoir"];
  R.state.team = nomes.slice(0, 6).map((n) => sp(n).x);
  R.state.box = nomes.slice(6).map((n) => sp(n).x);
  let chamadas = 0;
  const espiao = () => { chamadas++; throw new Error("o Modo Motor chamou a IA"); };
  R.claude = { use: espiao };
  R.pedirIA = espiao;
  const ctx = R.contextoDoMotor();
  ctx.cache = R.criarCacheDoMotor();
  const res = R.montarTimePeloMotor(ctx, { favoritos: ["SPECIES_TOGEKISS"] });
  assert.equal(chamadas, 0);
  assert.equal(res.variantes.length, 3);
  assert.ok(res.variantes.every((v) => v.membros.length === 6));
  // A versão em passos (a da tela) é o mesmo caminho e também não chama.
  const passos = R.montarTimePeloMotorEmPassos(R.contextoDoMotor({ cache: ctx.cache }), {});
  while (!passos.next().done);
  assert.equal(chamadas, 0);
});
