// Catálogo de sabotagens das regras (item Q5 da pauta técnica, 2026-09-16).
// Cada entrada troca um trecho EXATO de src/regras por uma versão quebrada que
// um bug real poderia produzir. tests/run_sabotage.mjs aplica uma de cada vez
// e exige que os testes unitários falhem - se passarem, a regra não está
// protegida de verdade.
// Se o trecho original sumir (refactor), a sabotagem acusa erro em vez de
// passar em silêncio: atualize o catálogo junto.
export const MUTACOES = [
  {
    id: "status-invertido",
    descricao: "comparação de split invertida (a classe do bug \"Status\" x \"STATUS\")",
    arquivo: "golpes.js",
    de: "if (DATA.splits[MOVES[id][2]] !== SPLIT_STATUS) return \"dano\";",
    para: "if (DATA.splits[MOVES[id][2]] === SPLIT_STATUS) return \"dano\";",
  },
  {
    id: "delimitador-livre",
    descricao: "dadoExterno deixa passar < e >",
    arquivo: "golpes.js",
    de: ".replace(/[<>]/g, \" \")",
    para: "",
  },
  {
    id: "familia-so-base",
    descricao: "família de formas ignora as megas",
    arquivo: "formas_mega.js",
    de: "return [base].concat(megaFormsOf(base));",
    para: "return [base];",
  },
  {
    id: "mega-sem-trava-de-insignia",
    descricao: "battleUnitsOf conta mega como disponível antes da 4ª insígnia",
    arquivo: "formas_mega.js",
    de: "if (!megaEvolutionUnlocked()) fam = [fam[0]];",
    para: "",
  },
  {
    id: "cap-pela-dificuldade",
    descricao: "level cap volta a sair da dificuldade",
    arquivo: "level_cap.js",
    de: "[state.settings.milestone][levelCapMode()]",
    para: "[state.settings.milestone][levelCapModeFromDifficulty(state.settings.difficulty)]",
  },
  {
    id: "cap-ignorado",
    descricao: "golpes liberados ignoram o level cap",
    arquivo: "level_cap.js",
    de: "return semCap || pair[0] <= cap;",
    para: "return true;",
  },
  {
    id: "pedra-em-qualquer-modo",
    descricao: "pedra obrigatória também no modo permanente",
    arquivo: "validacao_build_ia.js",
    de: "if (megaMode() !== \"temporaria\" || !isMegaForm(sp)) return null;",
    para: "if (!isMegaForm(sp)) return null;",
  },
  {
    id: "cura-em-set-ofensivo",
    descricao: "build 100% ofensiva aceita golpe de cura",
    arquivo: "validacao_build_ia.js",
    de: "if (curaMove || danoCount < 2) {",
    para: "if (danoCount < 2) {",
  },
  {
    id: "golpe-de-dupla-aceito",
    descricao: "build por IA aceita golpe que só funciona em dupla",
    arquivo: "validacao_build_ia.js",
    de: "if (golpeDupla) {",
    para: "if (false) {",
  },
  {
    id: "sinergia-ignorada",
    descricao: "build por IA sem golpe potencializado passa",
    arquivo: "validacao_build_ia.js",
    de: "if (!temSinergia) {",
    para: "if (false) {",
  },
  {
    id: "evs-sem-teto",
    descricao: "EVs acima de 510 não são reduzidos",
    arquivo: "validacao_build_ia.js",
    de: "if (evSum > 510) {",
    para: "if (false) {",
  },
  {
    id: "hp-sem-nivel",
    descricao: "fórmula de HP ignora o nível (calcFinalStat)",
    arquivo: "calc_stat.js",
    de: "return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10);",
    para: "return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 10);",
  },
  {
    id: "breakpoint-pula-zero",
    descricao: "minEvSameStat nunca considera EV 0 como o mínimo",
    arquivo: "calc_stat.js",
    de: "for (var e = 0; e < evAtual; e += 4) {",
    para: "for (var e = 4; e < evAtual; e += 4) {",
  },
  {
    id: "proximo-breakpoint-perde-252",
    descricao: "nextEvBreakpoint nunca considera EV 252 como próximo salto",
    arquivo: "calc_stat.js",
    de: "for (var e = evAtual + 4; e <= 252; e += 4) {",
    para: "for (var e = evAtual + 4; e < 252; e += 4) {",
  },
  {
    id: "realocacao-prioridade-invertida",
    descricao: "trimAndReallocateEvs reinveste a sobra no stat MENOS investido, não no mais",
    arquivo: "calc_stat.js",
    de: "return evs[b] - evs[a] || a - b;",
    para: "return evs[a] - evs[b] || a - b;",
  },
  {
    id: "confronto-ignora-habilidade-do-chefao",
    descricao: "o ataque do jogador ignora a habilidade do Pokémon do chefão (Levitate/innates) e usa só a tabela crua",
    arquivo: "confronto.js",
    de: "mult: abilityTypeModFor(c.type, defTypes, ids).mult };",
    para: "mult: typeMultiplier(c.type, defTypes) };",
  },
  {
    id: "confronto-conta-golpe-de-status",
    descricao: "golpe de status conta como golpe de dano no confronto",
    arquivo: "confronto.js",
    de: "return MOVE_BY_NAME[n] && moveRoleOf(n) === \"dano\";",
    para: "return MOVE_BY_NAME[n];",
  },
  {
    id: "confronto-dobro-exato-nao-e-perigo",
    descricao: "dano exatamente 2x deixa de contar como ameaça",
    arquivo: "confronto.js",
    de: "var classe = pior.mult >= 2 ? CONFRONTO_AMEACA.PERIGO",
    para: "var classe = pior.mult > 2 ? CONFRONTO_AMEACA.PERIGO",
  },
  {
    id: "confronto-velocidade-ignorada",
    descricao: "duelo ameaçado e mais lento continua sendo vantagem",
    arquivo: "confronto.js",
    de: "(a.classe === CONFRONTO_AMEACA.PERIGO && veloz !== \"maior\")",
    para: "false",
  },
];
