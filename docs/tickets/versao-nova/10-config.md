# v10 — O resto da config d1a9a4c: aprendizado, tipo de quem ataca, Megas novas

Status: pronto-para-revisao (branch `versao-10-config`, empilhada em `versao-09-golpes`, sem merge, sem PR). Pedido da Construção depois da revisão do v06–v09. Regra do Felipe: código/config da versão nova primeiro.
Tamanho: M

## 1. Golpes aprendidos de TODAS as espécies (patch reprodutível)
`scripts/extracao/config_nova.mjs` agora compara o level-up e o tutor de cada espécie da `SpeciesList.textproto` com o dex (com `uses_learnset` resolvido) e grava adições e retiradas em `data/config_nova.json` (`aprende[sname] = { lm, lmRem, tu, tuRem }`); `transform.mjs --config-nova` aplica. O teste `extracao_transform` segue travando dex == bruto + patch, byte a byte.
- **128 espécies mudam**: level-up **+105 / -6**, tutor **+94 / -15**. Entre os 9 golpes novos (v09) e o resto: 56 espécies ganham algum golpe novo (a conta do v09 dizia 48: faltava resolver `uses_learnset`).
- Retiradas (21): Arbok perde Baneful Bunker no 61; tutor tirado de Tentacool (Acid Armor), Snorunt (Shadow Claw, Trick), Bagon (Take Flight), Shinx/Luxio (Knock Off), Nasty Plot x3, Spikes, Stealth Rock, Weather Ball, Razor Leaf, Tearful Look x2 etc.
- **Tutores universais ficam como a NextDex** (Snore, Metronome, Rest, Protect, Return... e o Attract dos gendered): a config os marca por golpe (`TUTOR_UNIVERSAL_*`) e a NextDex os expande por conta própria; expandir pela config acrescentaria Snore a ~1500 espécies e Metronome a ~1000 sem prova de que o jogo faz isso (não há implementação no repositório do jogo). Decisão registrada; se o Felipe quiser a expansão, é uma linha no gerador.
- **364 espécies** (formas sem `learnset` nem `uses_learnset` na config) ficam como estão.
- **Builds**: `validarBuilds()` não acha nenhuma build de `data/builds.json` com golpe que a espécie deixou de aprender. Nada a acrescentar em `builds_pendentes_de_revisao.json` (segue com os 259 do v05/v07). Teste fixa isso.

## 2. Lumberjack e mais três, pelo tipo de quem ataca
`abilities.cc:5752` (Lumberjack), `Fae Hunter`, `Monster Hunter`, `Firefighter` usam `IS_BATTLER_OF_TYPE(attacker/target, ...)`, como Dragonslayer e Insect Eater (v07): x1,5 contra alvo do tipo e x0,5 contra atacante do tipo, pelo tipo do POKÉMON, não do golpe. O motor tratava a metade defensiva pelo tipo do golpe (tabela `tipos.js`, 4 entradas) e não lia a ofensiva. Agora o texto manda (`resistDeAtacante`, `vsTipo`) e as 4 entradas saíram da tabela de tipos (a tela de tipos não mostra mais "resiste a Grass" para o Lumberjack: o jogo não faz isso). Teste percorre as 6 habilidades da família.

## 3. Mega Bruxish e Mega Jellicent
Entram no dex a partir da config (ids 1923 e 1924): tipos, atributos, 3+3 habilidades, aprendizado e descrição da base (`uses_learnset`), a base passa a apontar para a Mega na evolução por pedra (antes `-1`), `data/mega_forms.json` ganha Bruxishite e Jellicentite, `rank_disponibilidade.json` regerado (etapa 4, pela pedra) e as duas ficam em `rank_pendente_ate_10.json` (sem rank até o fechamento).
**Atenção para revisão**: a config traz as duas Megas **sem a Speed** (`spe` ausente); usei a da base (Bruxish 92, Jellicent 60). A Mega Jellicent tem atributos idênticos aos da base (120/60/70/85/105) e a Mega Bruxish tem SpAtk 70 (a base tem 105): parecem placeholders da config. Builds delas: dados-2654/09.

## Testes e sabotagens
`tests/unit/config_v10.test.mjs` (5 testes). 4 sabotagens `versao-lumberjack-*` e `versao-mega-bruxish-sem-pedra` (esta pegando trocando o arquivo em disco). Suíte 991 testes, 0 falhas; `npm run check` limpo; app abre sem erro de JavaScript. Rank NÃO recalculado.
