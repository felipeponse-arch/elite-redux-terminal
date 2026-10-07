// O que src/regras/*.js recebe do <script> do template (fase 1 da refatoração,
// 2026-09-24). É exatamente a lista que tests/unit/carregar_regras.mjs monta no
// Node - as dependências externas das regras, num lugar só. Nome novo usado
// pelas regras e declarado no template aparece como "Cannot find name" no
// `npm run check:tipos`: declare aqui.
//
// Tipos largos de propósito nesta primeira etapa (a checagem já pega nome
// inexistente, chamada com número errado de argumentos, erro de digitação em
// propriedade de objeto literal etc.); a fase 3 da refatoração estreita.

/** Dados do jogo (data/dex_compact.json). */
declare var DATA: any;
/** Builds curadas (data/builds.json): sname -> build ou lista de builds. */
declare var BUILDS: Record<string, any>;
declare var ABILITY_SYNERGY: Record<string, any[]>;
/** Combo habilidade condicional x golpe da própria espécie, por sname (reindexado no template; ausente nos testes do Node). */
declare var CONDITION_MOVE_SYNERGY: Record<string, any[]>;
declare var LEVELCAPS: any;
declare var MEGA_FORMS: any;
declare var MOVE_PT: Record<string, string>;
declare var MOVE_ROLES: any;
declare var SPECIES_RANK: Record<string, any>;
/** Estado do app (time, caixa, builds, configurações...). */
declare var state: any;
/** Chefões e times deles (data/bosses.json). */
declare var BOSSES: any[];
/** Buffs de ginásio por líder (data/gym_skills.json). */
declare var GYM_SKILLS: any;
/** Descrição de habilidade em português (data/ability_translations_pt.json), por id. */
declare var ABILITY_PT: Record<string, string>;
/** Descrição de item do próprio jogo (data/item_descriptions.json), por nome. */
declare var ITEM_DESC: Record<string, string>;
declare var PODER_VARIAVEL: { golpes: Record<string, string>; pesos: Record<string, number> };
declare var ONDE_ACHAR_ITENS: Record<string, { etapa: number | null; local: string; como: string }[]>;
/** Mono run: por tipo, desde qual etapa dá pra pegar cada espécie (data/mono_disponibilidade.json). */
declare var MONO_DISP: any;
/** Categoria de golpe (soco, mordida, corte...) e chance de efeito extra, por id (data/move_categorias.json). */
declare var MOVE_CATEGORIAS: Record<string, { c?: string[]; ch?: number; ef?: string; rc?: number; dr?: number; al?: string; se?: string }>;
/** Papel natural por espécie (data/species_role.json). */
declare var SPECIES_ROLE: Record<string, any>;
