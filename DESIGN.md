# Design — SulBiologic no jeito do Retira

O hub segue a identidade do Retira (o outro projeto): base neutra de shadcn/ui, menu lateral claro separado por uma linha, cartões de borda fina, fonte Geist e cantos de 10px. A diferença é a cor: no lugar do verde-petróleo do Retira entra o azul do logo da SulBiologic, e o logo abre o menu e a tela de login. Todos os tokens ficam em `src/index.css` (`:root`, com tema escuro em `prefers-color-scheme` e `data-theme`).

## Cor

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `--marca` / `--accent` | `#104D90` | `#5EA8E8` | azul do logo: botão principal, item ativo, links, foco, faixa de progresso |
| `--accent-soft` | `#E7EDF4` | `#12263D` | fundo do item ativo do menu (o `bg-primary/10` do Retira), ícones do Início |
| `--rail` | `#FAFAFA` | `#121212` | fundo do menu lateral, com `border-right` em `--rail-linha` |
| `--ground` / `--surface` / `--surface-2` | `#FFF` / `#FFF` / `#F5F5F5` | `#0A0A0A` / `#171717` / `#262626` | fundo, cartões/tabelas, trilhos e hovers |
| `--ink` / `--ink-2` / `--ink-3` | `#0A0A0A` / `#525252` / `#737373` | `#FAFAFA` / `#A1A1A1` / `#8A8A8A` | texto (cinzas sem tom, como o neutral do shadcn) |
| `--st-*` | retirado, devolvido, atrasado, agendado | | só para estado |

Cinzas neutros e o azul só onde importa. Sem degradê, sem vidro.

## Tipo

Geist variável (`@fontsource-variable/geist`), a mesma do Retira. Títulos de tela em 24px peso 600 com `letter-spacing` negativo e descrição cinza embaixo (o `PageHeader` do Retira). Números sempre `tabular-nums`. Cabeçalho de tabela em caixa normal, 13px, cinza. `--larga`/`--muito-larga` ficaram em 100% (a Geist não tem larguras).

## Forma

`--radius` 10px, `--radius-lg` 14px, chips e etiquetas em pílula. Cartões (indicadores, Início, metas, tabelas, calendário) com borda de 1px em `--line` e sem sombra; sombra só no que flutua (`--shadow-flutuante`). Filtros segmentados no jeito das Tabs do shadcn: trilho cinza, opção escolhida em branco.

## Logo

`Logo` (`src/shared/components/Logo.tsx`): só o nome, em minúsculas como o "retira" do Retira — "sulbiologic" em peso 600 e " hub" em `--ink-3`. Aparece no topo do menu e no login. O ícone com o "S" da Inter Bold (em contorno, num quadrado `#104D90` de cantos 24/96) fica só na aba do navegador (`public/icone.svg`). O logo oficial da distribuidora (`src/assets/logo-sulbiologic.png`) fica só no PDF das metas.

## Tema

Claro, escuro ou do sistema, escolhido no menu da conta (`SeletorTema`). A escolha fica no `localStorage` (`sulbiologic-hub:tema`) e liga `data-theme` no `<html>` (`src/shared/tema.ts`); um script curto no `index.html` aplica antes de desenhar pra não piscar.

## A faixa de progresso

`FaixaProgresso` (`src/shared/components/FaixaProgresso.tsx`): barra de 20px, cantos de 6px, com o percentual escrito dentro. O texto aparece duas vezes (tinta por baixo, branco recortado pelo preenchimento) usando `100cqw`, então lê bem cheio ou vazio. Verde quando a meta é batida. Use sempre esse componente para progresso de meta.

## Celular (≤760px): cara de app

A mesma identidade, com a forma de app. O computador não muda.

- **Barra de baixo** clara (`--rail`, linha em cima), com no máximo 4 seções + "Mais"/conta (`MAX_NA_BARRA` em `MenuLateral.tsx`). Na seção atual, o ícone fica dentro de uma pílula em `--accent-soft`, no azul. O que não cabe (Dados, Cadastros) vai para a folha do "Mais", junto com Minha conta, Usuários e Sair.
- **Folhas** (o "Mais" e os diálogos) sobem de baixo, com cantos de 20px, alça e véu escuro por trás.
- **Barra do topo** (`BarraTopo.tsx`): fica transparente enquanto o título grande está à vista. Quando ele sai rolando, ela vira chapa `--ground`, com o título pequeno e uma linha embaixo. Trocar de seção volta a tela ao topo.
- **Abas da seção** viram chips que rolam de lado e ficam presos sob a barra do topo. A aba atual fica em `--accent-soft` com o texto azul.
- **Cantos**: `--radius-lg` sobe para 16px no celular.
- **Filtros** ficam dois por linha. Nos cartões de meta, os números de meta, realizado e falta ficam numa linha só.
- **Toque**: sem o flash do navegador, o que se aperta afunda um pouco e cada seção entra subindo de leve. Tudo isso respeita `prefers-reduced-motion`.
- **Instalável (PWA)**: `public/manifest.webmanifest` e os ícones `public/icone-*.png` / `apple-touch-icon.png`, gerados do logo sobre fundo branco. Instalado, o hub abre em tela cheia. Não tem service worker (sem cache offline).
