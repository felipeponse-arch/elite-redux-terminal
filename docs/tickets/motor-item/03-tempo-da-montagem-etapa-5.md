# 03 — "Montar meu melhor time" passa de 10 s na etapa 5

Status: descartado (06/11/2026, decisão do usuário: o teste lento e a montagem foram enxugados no pacote 01 (pesado em ~2,5 min))
Tamanho: M. Dono: engenheira-do-motor.
Origem: revisão do motor-item/01 (supervisor r1, 22/10/2026), não bloqueante.

Medido no Node (elenco de 10, 3 variantes): etapa 5 ≈ 12,4 s, dos quais ~2,1 s do fechamento de item; sem item ≈ 10,3 s
(o teto de 10 s do time-pelo-motor/01 Fase F já estava estourado nessa etapa). Etapa 8 ≈ 8 s. Medir no navegador com
pool 12 e achar onde cortar (cache entre variantes, triagem barata antes do juiz completo).
