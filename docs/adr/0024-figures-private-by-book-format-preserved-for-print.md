---
number: 24
title: Figuras privadas por Livro, com formato preservado para impressão
date: 2026-10-30
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

Os editores de Markdown passam a aceitar o envio de imagens que ficam embutidas no próprio texto: a **Figura**. O caso principal é a **Ata**, que só existe no Painel Administrativo, é segmentada por **Livro de Atas**, nunca é excluída e vira PDF para impressão e assinatura. O PDF é gerado pelo Chromium headless, que embute as imagens referenciadas no Markdown. Artigos e Avisos também usam o mesmo editor.

Os outros dois artefatos binários do site (**Imagem Destacada** e **Flyer Digital**) são públicos, convertidos para WEBP/PNG para a tela e, pela [ADR-0018](0018-featured-image-bytes-on-disk-bind-mount.md), tratados como reenviáveis, sem backup do volume.

## Decisão

- **Bytes em disco**, no mesmo bind-mount da ADR-0018, num diretório próprio das Figuras, com nome opaco (token aleatório).
- **A Figura herda a visibilidade do texto, fixada no envio.** A Figura enviada numa Ata é registrada com o Livro dessa Ata e só é servida a quem tem permissão de leitura daquele Livro. Como o Livro de uma Ata é imutável, a visibilidade nunca precisa ser recalculada. As Figuras de Artigos e Avisos são públicas.
- **O PDF da Ata lê as próprias Figuras direto do disco**, sem passar pela URL, já que a URL exige uma sessão que o gerador não tem.
- **O formato é preservado em vez de convertido para WEBP.** JPEG continua JPEG (qualidade ~85), PNG continua PNG sem perda, e WEBP recebido vira JPEG, ou PNG quando tem transparência. O lado maior é limitado a 2400 px, sem ampliar, o que dá ~300 dpi na largura útil de uma A4. A rotação do EXIF é aplicada e os metadados são removidos. Só são aceitas imagens (png, jpeg, webp) de até 15 MB.
- **Nenhuma limpeza de Figuras órfãs.** Uma Figura que sai do texto continua guardada.
- **O backup do volume é responsabilidade da infra da VPS**, não do projeto. Isso revisa a postura da ADR-0018: com Figuras de Atas no volume, o conteúdo deixa de ser trivialmente reenviável.

## Rationale

- **WEBP é o pior formato para um PDF.** O formato PDF não o suporta nativamente, então o Chromium o decodifica e recodifica, seja inflando o arquivo sem perda, seja aplicando uma segunda compressão com perda. JPEG e PNG entram no PDF quase como estão. O pipeline da Imagem Destacada (WEBP, 1600 px) foi pensado para a tela e piora a impressão.
- **A privacidade segue a Ata**, que "vive apenas no painel". Uma URL pública com token impossível de adivinhar vazaria o conteúdo de uma Ata para quem recebesse o link.
- **Fixar a visibilidade no envio** evita ter de descobrir, a cada requisição, em que texto a Figura está referenciada. Isso só é seguro porque o Livro da Ata nunca muda.
- **Não limpar** é a escolha segura enquanto o volume é pequeno: apagar por engano uma Figura de uma Ata Aprovada é irreversível e quebra um documento assinado.

## Alternativas Consideradas

- **Reaproveitar o pipeline da Imagem Destacada (WEBP, 1600 px).** Rejeitado pela perda na impressão descrita acima.
- **Guardar o original intacto.** Rejeitado: fotos de celular chegam com 4000+ px, com GPS no EXIF e com a rotação dependente de metadado.
- **Figuras de Ata públicas, com token aleatório.** Rejeitado por vazar o conteúdo da Ata.
- **Aceitar documentos (PDF, DOCX) como anexos.** Rejeitado por ora: não podem ser embutidos no PDF da Ata e virariam links que só funcionam com sessão.
