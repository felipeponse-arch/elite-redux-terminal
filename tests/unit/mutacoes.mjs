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
];
