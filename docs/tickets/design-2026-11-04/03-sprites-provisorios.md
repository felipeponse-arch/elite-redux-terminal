# 03 - Sprites provisórios (Bruxish Mega e Jellicent Mega)

Status: resolvido (aguarda portão pesado/junção)

## Decisão do usuário (05/11/2026)
Bruxish Mega e Jellicent Mega não têm sprite oficial. Usar placeholder: o sprite da forma base (Bruxish / Jellicent) com aviso
curto "sem sprite oficial" na ficha e na lista. Trocar quando a arte oficial aparecer (tirar de `data/sprites_provisorios.json`
e rodar `scripts/acrescentar_sprites_atlas.ps1`).

## Critérios de aceite
- [x] Lista de provisórias vem de dado: `data/sprites_provisorios.json`; `scripts/remapear_sprite_index.mjs:10` aponta a casa da base e grava `provisorio` no `sprite_index.json`
- [x] Aviso: `semSpriteOficial` / `avisoSemSpriteHtml` em `src/regras/dados_base.js:193`; usado em `src/ui/dex_ficha.js:517` e `src/ui/dex_lista.js:225`; estilo `.sem-sprite` em `src/css/dex.css:101` (só tokens existentes)
- [x] Teste por regra: `tests/unit/sprites_provisorios.test.mjs` (provisória -> sprite da base + aviso; com sprite oficial -> sem aviso)
- [x] Contraste: `--text-dim` sobre `--bg`/`--surface`/`--surface-2`/`--surface-3` nos 3 temas já coberto por `tests/unit/contraste_dos_tokens.test.mjs` (piso 4,5:1, passa)
- [x] Visual sem update: 20/20 passaram, nenhuma imagem-base regravada
