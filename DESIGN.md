# Design — Frota SulBiologic

O hub tem a cara da lataria do caminhão da distribuidora: menu lateral inteiro no azul do logo, área de trabalho branca e fria, tinta grafite, números pintados largos. Todos os tokens ficam em `src/index.css` (`:root`, com tema escuro em `prefers-color-scheme` e `data-theme`).

## Cor

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `--marca` | `#104D90` | — | azul do logo: menu, faixa de progresso, botão primário |
| `--marca-clara` | `#338DCC` | — | preenchimento da faixa no escuro, seleção de texto |
| `--rail` | `#104D90` | `#0B3466` | fundo do menu lateral |
| `--ground` / `--surface` / `--surface-2` | `#F4F6F9` / `#FFF` / `#EBEFF4` | `#08121F` / `#0E1B2C` / `#152538` | fundo, cartões/tabelas, faixas de cabeçalho |
| `--ink` / `--ink-2` / `--ink-3` | `#17212B` / `#4A5664` / `#5F6B79` | `#E9EFF6` / `#A3B3C6` / `#8597AC` | texto |
| `--st-*` | retirado, devolvido, atrasado, agendado | | só para estado |

Cor chapada: sem degradê, sem vidro/blur. Cor forte só no menu e nos estados.

## Tipo

Archivo variável (`@fontsource-variable/archivo/wdth.css`). Texto em largura normal; títulos e números com `font-stretch: var(--larga)` (118%) e peso 750–800; a marca no menu em `--muito-larga` (125%). Números sempre `tabular-nums`. Cabeçalho de tabela em caixa alta pequena, espaçada.

## Forma

Cantos quase retos (`--radius` 4px, `--radius-lg` 6px; `--pill` também 4px). Divisões por linha de 1px; KPIs e a lista do Início ficam sob uma régua grossa de 3px na cor de tinta. Sombra só em superfícies que flutuam (`--shadow-flutuante`).

## Assinatura: a faixa

`FaixaProgresso` (`src/components/FaixaProgresso.tsx`): a faixa grossa do logo vira a barra de meta, 20px de altura, com o percentual escrito dentro. O texto aparece duas vezes (tinta por baixo, branco recortado pelo preenchimento) usando `100cqw`, então lê bem cheio ou vazio. Verde quando a meta é batida. Use sempre esse componente para progresso de meta.

## Marca no menu

"SulBiologic" largo, faixa branca de 5px, "HUB" espaçado — o desenho do logo refeito em tipo, em branco sobre o azul.

## Celular (≤760px): cara de app

A mesma lataria, com a forma mais macia que se espera de um app. O computador não muda.

- **Barra de baixo** azul (`--rail`), com no máximo 4 seções + "Mais"/conta (`MAX_NA_BARRA` em `MenuLateral.tsx`). Na seção atual, o ícone fica dentro de uma pílula branca. O que não cabe (Dados, Cadastros) vai para a folha do "Mais", junto com Minha conta, Usuários e Sair.
- **Folhas** (o "Mais" e os diálogos) sobem de baixo, com cantos de 20px, alça e véu escuro por trás.
- **Barra do topo** (`BarraTopo.tsx`): fica transparente enquanto o título grande está à vista. Quando ele sai rolando, ela vira chapa `--ground`, com o título pequeno e uma linha embaixo. Trocar de seção volta a tela ao topo.
- **Abas da seção** viram chips que rolam de lado e ficam presos sob a barra do topo. A aba atual é preenchida em `--ink`, nunca em azul.
- **Cantos**: `--radius` 10px e `--radius-lg` 16px só no celular. A faixa de progresso continua reta.
- **Filtros** ficam dois por linha. Nos cartões de meta, os números de meta, realizado e falta ficam numa linha só.
- **Toque**: sem o flash do navegador, o que se aperta afunda um pouco e cada seção entra subindo de leve. Tudo isso respeita `prefers-reduced-motion`.
- **Instalável (PWA)**: `public/manifest.webmanifest` e os ícones `public/icone-*.png` / `apple-touch-icon.png`, gerados do logo sobre fundo branco. Instalado, o hub abre em tela cheia. Não tem service worker (sem cache offline).
