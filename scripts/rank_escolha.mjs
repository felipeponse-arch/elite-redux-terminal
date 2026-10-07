// Escolha do set no rank v2 (ticket 08, 07/10/2026). A soma rápida (nota do duelo contra todos os
// chefões no nível de referência) decide quais sets valem a pena, mas um empate técnico nela escondia
// sets de nota final muito diferente (Crobat: 117,23 x 117,09 na soma, 40 x 80 na nota final; 36 das
// 48 quedas grandes do recálculo de 07/10). Os CANDIDATOS_DO_RANK melhores pela soma são avaliados por
// inteiro e fica o de maior média geométrica dos dois eixos (o mesmo formato da nota final, sem o peso
// por ameaça, que só existe depois de todas as espécies).
export const CANDIDATOS_DO_RANK = 3;

export function melhoresPelaSoma(lista, n = CANDIDATOS_DO_RANK) {
  return lista.slice().sort((a, b) => b.s - a.s).slice(0, n);
}

function mediaDoEixo(eixo) {
  const v = eixo.flatMap((l) => l.brs);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

export function notaDosEixos(eixos) {
  return Math.sqrt(Math.max(0, mediaDoEixo(eixos.potencial)) * Math.max(0, mediaDoEixo(eixos.viabilidade)));
}

export function escolherPelaNotaFinal(avaliados) {
  return avaliados.reduce((m, a) => (!m || a.nota > m.nota ? a : m), null);
}
