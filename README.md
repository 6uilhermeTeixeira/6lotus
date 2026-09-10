# Institucional 2Lotus

Site institucional independente do ecossistema 2Lotus, apresentando o laboratório de pesquisa e o
Live Core protegido sem participar da coleta, decisão ou execução operacional.

## Proposta

O site explica a separação entre pesquisa, promoção controlada e operação protegida, além de exibir
evidências estáticas versionadas de backtest.

Não há promessa de rentabilidade. A comunicação do produto enfatiza disciplina de execução, validação e controle humano.

## Desenvolvimento local

O projeto é estático e não requer build. Abra `index.html` com um servidor HTTP local:

```bash
npx serve .
```

## Estrutura

- `index.html`: conteúdo, SEO e estrutura da página
- `styles.css`: direção visual e responsividade
- `script.js`: interações progressivas
- `server.py`: servidor local com fallback de rotas para a landing page
- `assets/`: identidade visual versionada
- `data/backtest-proof.json`: evidência estática consumida pela página
- `vercel.json`: configuração do deploy
