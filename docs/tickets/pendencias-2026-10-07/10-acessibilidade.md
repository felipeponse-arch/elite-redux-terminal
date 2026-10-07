# 10 — Acessibilidade: animações e lista navegável

Status: resolvido
Bloqueado por: 11
Agentes: ux-acessibilidade, engenheira-frontend

## O que entrega
Respeitar `prefers-reduced-motion` em todo o app e revisar a lista da Dex como listbox (ARIA, foco visível, teclado).
Fica depois do L1 da paleta (tokens) para conferir contraste e foco já com as cores novas.

## Como verificar
Smoke test com animação reduzida; navegação só por teclado na lista; revisão WCAG 2.2.

## Comentários

07/10: a regra global de prefers-reduced-motion já existia (responsivo.css); faltava o JS - a rolagem até Estratégias usava "smooth" sempre, agora "auto" quando o sistema pede menos movimento. Listas (Dex e Chefões) já eram listbox com roving tabindex; ganharam Home/End (o End da Dex carrega os lotes). 3 contornos de foco em ouro (--accent-2, no limite de 3:1 nos fundos creme) passaram a --focus. 4 testes de navegador novos.
