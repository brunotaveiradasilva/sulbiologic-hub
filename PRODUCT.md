# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Escritório (admin):** gestão da SulBiologic Distribuidora, no computador. Cadastra metas por fornecedor e representante, importa planilhas (Especialista Pet, positivações), confere campanhas, compara vendas entre períodos e gera PDFs para mandar aos vendedores.
- **Representantes:** vendedores na rua, no celular, consultando a própria meta, o realizado e a situação nas campanhas.

## Product Purpose

Hub interno da distribuidora que junta, num lugar só, o que antes vivia em planilha: metas do mês e quanto já foi realizado (em R$, kg ou clientes), campanhas de incentivo dos fornecedores (Especialista Pet, Wellpet, Organnact), comparativo de vendas vindo da ADS, almoxarifado (retirada/devolução de materiais com atraso calculado) e cadastros. Sucesso é o admin fechar o mês sem planilha paralela e o representante saber, em segundos, quanto falta para bater a meta.

## Positioning

Os números vêm direto da ADS (ERP da distribuidora) e das regras reais das campanhas dos fornecedores, não de digitação: realizado, positivação e atraso são calculados.

## Operating Context

- Navegação por menu lateral: Início, Materiais, Metas, Campanhas, Dados, Cadastros, Minha conta.
- Telas densas de tabela (clientes × metas × realizado × desconto), KPIs de meta e barras de progresso.
- Exportação de PDF por representante e envio por WhatsApp.
- Perfis: ADMIN vê tudo; representante vê só o que é seu.

## Capabilities and Constraints

- React 19 + TypeScript + Vite, CSS puro com variáveis; deploy no GitHub Pages.
- Tema claro e escuro seguindo o sistema (com override por `data-theme`).
- Precisa funcionar bem no celular (representantes) e em tela larga (tabelas do admin).
- Números (R$, kg, %, clientes) precisam ser fáceis de achar e comparar.

## Brand Commitments

- Nome e logo **SulBiologic Distribuidora** (`src/assets/logo-sulbiologic.png`) e o azul da marca do logo.
- Tema claro e escuro.
- Navegação em menu lateral com as mesmas seções.
- Não pode parecer infantil nem colorido demais: é ferramenta de trabalho de uma distribuidora.
- Não pode parecer template genérico de painel.

## Evidence on Hand

- Logo em PNG (azul em degradê, "DISTRIBUIDORA" em cinza escuro).
- Ilustração noturna do login (`src/assets/login-pet.svg`), não obrigatória.
