// Stylelint (fase 7 da refatoração, 2026-09-24). Como no ESLint: só regras de
// CORREÇÃO (config "recommended": sintaxe, propriedade/valor/unidade que não
// existe, seletor duplicado, cor hex inválida...), nada de estilo.
//
// O caso que motivou: duas vezes (2026-09-13 e 2026-09-15) um comentário com o
// "*/" no meio deixou o resto como lixo e o navegador DESCARTOU a regra
// seguinte inteira, sem erro nenhum no console. Isso agora falha no
// `npm run check`.
export default {
  extends: ["stylelint-config-recommended"],
  rules: {
    // A cascata aqui é deliberada e comentada regra a regra (sobrescritas por
    // tema, por largura de tela); reordenar só pra agradar essa regra mudaria
    // o que ganha. Continua valendo a checagem de seletor DUPLICADO.
    "no-descending-specificity": null,
    // Escala de texto (2026-09-24): todo tamanho de fonte vem de um token
    // --fs-* de tokens.css - valor solto em px reprova. (Antes eram 19
    // tamanhos, vários a meio pixel um do outro.)
    "declaration-property-value-allowed-list": { "font-size": ["/^var\\(--fs-[a-z]+\\)$/", "inherit"] },
  },
};
