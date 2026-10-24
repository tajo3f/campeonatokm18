# CAMPEONATO SOCIETY KM18 — Ficha de Equipe

Versão final estática, sem banco de dados, sem Supabase, sem backend e sem API do WhatsApp.

## Como funciona
1. O responsável preenche os dados da equipe.
2. Adiciona jogadores, número e tamanho de camisa opcional.
3. O sistema valida os dados e bloqueia números repetidos.
4. O PDF é gerado 100% no navegador.
5. O botão **Compartilhar PDF** usa o compartilhamento nativo do celular.
6. O botão **Abrir WhatsApp Oficial** abre a conversa com (27) 99779-6977 e uma mensagem pronta.
7. Se o navegador não suportar compartilhamento de arquivos, o PDF pode ser baixado e anexado manualmente.

## Publicação
Este projeto é 100% estático. Basta publicar todos os arquivos desta pasta na raiz do site.

Compatível com Vercel, Netlify, GitHub Pages, Cloudflare Pages e hospedagem comum.

### Vercel
- Crie um novo projeto.
- Faça upload/repositório com estes arquivos na raiz.
- Não há comando de build.
- Não há variáveis de ambiente.

## Privacidade
Os dados digitados não são enviados a nenhum servidor por este sistema. Um rascunho é salvo apenas no `localStorage` do próprio navegador para evitar perda acidental durante o preenchimento.

## WhatsApp oficial
(27) 99779-6977

## Testes
Com Node.js instalado:

```bash
npm test
```
