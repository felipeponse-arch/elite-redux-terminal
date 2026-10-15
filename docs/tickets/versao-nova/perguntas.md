# Perguntas da fila v01–v05 (para a Construção / Felipe)

## P1 (v04). "Dado estruturado da er-config" não existe para habilidade
O pedido do v04 era ler as habilidades pelo dado estruturado da `er-config`. A `er-config` só tem `description` e `expanded_description` (texto livre); o efeito está em `abilities.cc` (C++). Medido: o parser só reproduz o efeito em 94 de 848 habilidades quando lê o `expanded_description`, e derruba 237 quando lê o `description` da `er-config` (que não é o texto curto da NextDex). O v04 entregou no lugar uma camada de compatibilidade medida (74 textos novos -> texto que o parser conhece, script de portão `scripts/medir_texto_novo.mjs`). **Pergunta:** serve? A alternativa estrutural é gerar as regras a partir de `abilities.cc` (projeto grande, outro ticket). Recomendação: seguir com a camada e rodar o script a cada dado novo.

## P2 (v04). Best Offense: código x texto
No código novo (`abilities.cc` de `486026e`), Best Offense perdeu o multiplicador de Keen Edge e passou a somar +20 ao ataque secundário de DEFESA (`secondaryAtkStatToUse[STAT_DEF] += 20`) nos golpes Keen Edge/Sharpness; o texto novo diz "Keen Edge moves are special and use +20% Sp. Def". Pela regra (código manda) vale a defesa física, mas o texto e o código discordam entre si. O motor hoje não lê nada do texto novo (perde o efeito). **Pergunta:** implemento pelo código (DEF +20) ou pelo texto (Sp. Def +20)? Quem usa: Best Offense e Magus Blades.

## P3 (v05). Ver `estado.md`: a troca de dado depende de scripts PowerShell e do branch `dados-2654`, que não existem neste ambiente.
