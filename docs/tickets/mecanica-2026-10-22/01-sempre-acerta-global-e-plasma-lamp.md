# 01 — "Sempre acerta" global errado (Pinnacle Blade e +5) e precisão do Plasma Lamp

Status: resolvido-no-branch
Tamanho: P. Antes do rank final (dados-2654/10).
Evidência: relatorios/evidencia_simples_2026-10-22.md (pesquisador-de-mecanica, 22/10/2026). Regra: código do jogo (er-repo upcoming 217dd0f) vence.

- BUG: duelo.js:1670 `/Moves always hit/i` casa "Slashing moves always hit..." e liga ef.semErrar para TODOS os golpes
  (duelo.js:2057, 2145). Pinnacle Blade não tem "sempre acerta" no código (abilities.cc:8661-8692). Conferir no código
  as outras que casam o mesmo texto: Skill Link, Sighting System, Artillery, Sweeping Edge, Gifted Mind; cada uma segue
  o próprio código (sempre acerta só no grupo de golpes certo, ou nada).
- Plasma Lamp: abilities.cc:6056 onAccuracy x1,2 só Fire/Electric (multiplicativo, antes de estágios e Wide Lens).
  O motor não aplica (regex duelo.js:1668-1669 não casa; precisaoMult global em 2145). Conferir também o poder x1,2:
  decisoes_mecanicas.md:116 diz que entrou, mas o texto não casa em duelo.js:774-776/1594-1598.
- Critério: teste com espécie real por habilidade; decisoes_mecanicas.md atualizado.
