# Arquivos da marca Mouro

Baixados do site oficial da empresa (`mourosolucoes.com.br`, wp-content/uploads/2022/05).

| Arquivo                       | O que é                                    |
| ----------------------------- | ------------------------------------------ |
| `logo-mouro-positivo.png`     | Logotipo completo, versão escura (500x163) |
| `logo-mouro-negativo.png`     | Logotipo completo, versão branca (400x131) |
| `simbolo-mouro-positivo.png`  | Só o "U", escuro (70x92) — recortado do logotipo |
| `simbolo-mouro-negativo.png`  | Só o "U", branco (86x114) — recortado do logotipo |

O portal usa os **símbolos**, ao lado do texto "MOURO / SOLUÇÕES".

## Por que o componente não lê estes arquivos direto

`src/components/brand/marcaAssets.ts` traz os dois símbolos embutidos em
base64, e é de lá que `MouroMark` lê.

O motivo é o middleware de sessão (`src/middleware.ts`): o `matcher` cobre tudo
que não seja `/api` ou `/_next`, então um PNG servido de `public/` volta como a
página de login para quem ainda não entrou. Isso quebraria a marca justamente na
tela de login. Pior: o otimizador do `next/image` busca o arquivo por HTTP sem
cookie de sessão, então nem `/_next/image` resolve — ele responde
`"The requested resource isn't a valid image"`.

Embutido em base64 não há requisição nenhuma, e o middleware fica intacto. São
~3 KB por versão.

## Se trocar a logo

1. Substitua os PNGs aqui.
2. Regere `marcaAssets.ts` a partir dos arquivos `simbolo-mouro-*.png`.

O ideal continua sendo um **SVG** do símbolo: uma versão só (a cor sairia de
`currentColor`, dispensando positivo/negativo), nítida em qualquer tamanho.
Os PNGs atuais têm 70–86 px de largura e aparecem de 26 px a 48 px, então em
telas de alta densidade ficam no limite.
