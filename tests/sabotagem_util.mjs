// Funções puras do runner de sabotagem (TK-29, 27/10/2026), separadas para ter teste.

// "Pega" só vale quando uma ASSERÇÃO falhou. Exit != 0 por outro motivo (erro de carga, TypeError do próprio
// defeito injetado, typo no catálogo) não prova que algum teste protege a regra.
export function falhouPorAssercao(saida) {
  return /code: 'ERR_ASSERTION'/.test(saida);
}

// Resultado de uma rodada do node --test com a sabotagem aplicada.
export function classificarFalha({ status, saida }) {
  if (saida.includes("trecho da sabotagem não encontrado")) return "quebrada";
  if (status === 0) return "sobreviveu";
  return falhouPorAssercao(saida) ? "pega" : "erro-sem-assercao";
}

// Antes de rodar: o alvo existe e o trecho `de` aparece exatamente 1 vez. Sem isso, alvo fora de src/regras
// que nenhum teste carrega virava "sobreviveu" em vez de "catálogo quebrado". "@comportamento" é checado em
// tempo de carga (função inexistente), não aqui.
export function conferirAlvos(mutacoes, caminhoDoAlvo, lerTexto) {
  const problemas = [];
  for (const m of mutacoes) {
    if (m.arquivo === "@comportamento") continue;
    const caminho = caminhoDoAlvo(m.arquivo);
    if (!caminho) { problemas.push({ id: m.id, motivo: "alvo " + m.arquivo + " não existe" }); continue; }
    const n = lerTexto(caminho).split(m.de).length - 1;
    if (n !== 1) problemas.push({ id: m.id, motivo: "trecho aparece " + n + "x em " + caminho + " (esperado 1)" });
  }
  return problemas;
}
