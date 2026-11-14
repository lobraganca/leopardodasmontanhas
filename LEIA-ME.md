# Site Leopardos das Montanhas

## Arquivos
- `index.html` — o site inteiro (sobe no GitHub e publica na Vercel, igual aos outros).
- `planilha-apps-script.gs` — código que liga a Área do guia a uma planilha Google.
- `vercel.json` — faz o endereço /adm abrir a Área do guia (precisa ir junto no GitHub).
- `og.jpg` — imagem que aparece quando o link é compartilhado no WhatsApp/Instagram (também vai junto).

## Área do guia
Endereço: **www.leopardodasmontanhas.com.br/adm** (não aparece em nenhum link do site e não vai para o Google). Na prévia do Claude, use `#area-do-guia` no fim do link.

Lá o guia:
- cria, edita, liga/desliga e reordena **expedições** (nome, descrição, nível, duração, distância, horário, valor, ponto de encontro, ilustração);
- abre **datas** com número de vagas (0 = esgotado). Elas aparecem nos cards e na reserva. Expedição **sem data futura aparece automaticamente como "Em breve"**;
- o campo **Distância (km)** posiciona a expedição no **mapa da serra** (quanto mais km, mais longe do acampamento) e aparece no carimbo do cartão-postal;
- cadastra **vídeos de manejo** (cobras, escorpiões, sapos, aranhas, outros). Os vídeos são do próprio Bruno: suba os arquivos .mp4 (em pé, formato reels) na pasta **videos/** do repositório e, na aba Vídeos, escreva o nome (ex.: `videos/jararaca.mp4`). Também aceita link do Google Drive compartilhado. No site, o vídeo roda sem som no cartão e abre em tela cheia com som. Dica: vídeos de até ~30 MB carregam bem; uma capa (imagem) é opcional;
- troca as **fotos das cachoeiras** (aba Fotos): suba as imagens na pasta **fotos/** e escreva o nome (ex.: `fotos/poco-azul.jpg`). As que vêm no site são ilustrações de exemplo, para trocar pelas fotos reais;
- carrega o **trajeto GPX** de cada trilha (exportado do Wikiloc, Strava, AllTrails ou relógio). Quando pelo menos uma trilha tem GPX, aparece o botão **Mapa real** na seção Trilhas, com imagem de satélite e relevo;
- troca o **WhatsApp** que recebe as reservas (já vem com (31) 99648-5236);
- vê a **Fila de espera**: quem tocou em "Quero ser avisado" numa trilha sem data deixa nome, WhatsApp e quantas pessoas. Na aba, as pessoas aparecem separadas por trilha, na ordem em que entraram. O botão **Avisar** abre o WhatsApp da pessoa com a mensagem pronta (editável) e marca como avisado; **Avisar próximo** vai chamando um por um.

## Para valer para todo mundo (5 minutos)
Sem a planilha, o que se salva fica só no navegador de quem editou (modo de teste, senha `leopardo`).
1. Siga os passos no topo de `planilha-apps-script.gs` e troque a SENHA lá.
2. Cole a URL `/exec` em `CONFIG.api` no começo do `<script>` do `index.html`.
3. Suba de novo no GitHub. Pronto: o guia entra com a senha nova e o que ele salvar já aparece no site.

A fila de espera também fica nessa planilha, na aba **espera** (é criada sozinha). Sem a planilha, a fila só funciona no mesmo navegador (bom só para teste).
Se você já tinha implantado o Apps Script antes, cole o arquivo novo e faça Implantar > Gerenciar implantações > editar > **Nova versão**.

## Observação
Dentro da prévia do Claude os vídeos não tocam no próprio site (o player abre o link). Publicado na Vercel, Reels/YouTube/TikTok tocam ali mesmo.

## Reservas
Na seção **Trilhas disponíveis**, o visitante escolhe a trilha e toca em **Quero essa**: abre uma janelinha com as datas abertas, quantas pessoas e o nome, e a reserva segue pelo WhatsApp. Trilhas sem data mostram **Quero ser avisado** (fila de espera). A seção **Guia particular** é para passeio só do grupo, empresa, escola ou evento: um formulário curto que manda o pedido de orçamento pelo WhatsApp. As duas opções montam a mensagem e abrem o WhatsApp do guia.

## Imagens
Logo, pôster do Bruno e os leopardos da logo já estão dentro do `index.html`. As animações premium usam GSAP e Lenis (carregados de CDN); sem internet para elas, o site continua funcionando normalmente.

## Domínio www.leopardodasmontanhas.com.br (GoDaddy + Vercel)
1. Suba `index.html`, `vercel.json` e `og.jpg` num repositório novo no GitHub e importe na Vercel (igual ao site da Laisa).
2. Na Vercel: Project > Settings > Domains > adicione `leopardodasmontanhas.com.br` e `www.leopardodasmontanhas.com.br`.
3. Na GoDaddy (Meu domínio > DNS), crie/edite os registros que a Vercel mostrar. Normalmente:
   - Tipo **A**, nome **@**, valor **76.76.21.21**
   - Tipo **CNAME**, nome **www**, valor **cname.vercel-dns.com**
   Apague outro registro A ou CNAME "www" antigo que a GoDaddy tenha criado (o de "estacionamento").
4. Espere a Vercel mostrar "Valid Configuration" (de minutos a algumas horas).
