// Contagens do dado por versão do jogo: UM lugar só. Subiu a versão (atualizar-dados-do-jogo)?
// Atualize aqui, com a versão e a fonte; os testes que contam espécies, golpes, habilidades e
// pedras leem destas constantes em vez de repetir o número.
// A versão vem do alarme (scripts/alarme_upstream.mjs, fonte única); aqui ficam só as contagens dela (NextDex 2.65.5 + er-config b58ea4d, TK-35).
export { VERSAO_DEX as VERSAO_DADO } from "../../scripts/alarme_upstream.mjs";
export const N_ESPECIES = 1941; // 1933 - Granbull Mega - Infernape Redux B + 10 novas da NextDex 2.65.5 (diff_2655.md); posições do dado (a SPECIES do motor tem uma a menos: a vazia)
export const N_HABILIDADES = 1084; // 1075 + 9 novas da NextDex 2.65.5 (as 9 que eram da config d1a9a4c).
export const N_GOLPES = 1042; // 1041 da NextDex 2.65.5 (inclui os 9 antes da config) + Meteoropath Ball da config b58ea4d
export const N_PEDRAS_ADOPTION = 141; // 142 até a 486a964; a b58ea4d tirou a Arcanite H do Adoption Center (unique_mega_location Route 123)
