# Site Leopardos das Montanhas

## Arquivos
- `index.html` — o site inteiro (sobe no GitHub e publica na Vercel, igual aos outros).
- `api/` — as funções da Vercel que guardam os dados no banco (trilhas, fotos, fila de espera, acessos e pedidos).
- `package.json` — necessário para a pasta `api/` funcionar na Vercel.
- `vercel.json` — faz o endereço /adm abrir a Área do guia (precisa ir junto no GitHub).
- `og.jpg` — imagem que aparece quando o link é compartilhado no WhatsApp/Instagram (também vai junto).

## Área do guia
Endereço: **www.leopardosdasmontanhas.com.br/adm** (não aparece em nenhum link do site e não vai para o Google). Na prévia do Claude, use `#area-do-guia` no fim do link.

Lá o guia:
- vê os **Acessos** (primeira aba): quantas pessoas visitaram o site (hoje, 7, 30 ou 90 dias), quantas visitas, quantos clicaram no WhatsApp, de onde vieram (Instagram, Google, direto…), celular ou computador, cidades e estados aproximados, trilhas mais pedidas e a fila por trilha. Em **Pedidos pelo site** aparece cada pessoa que preencheu a reserva de trilha ou o guia particular, com nome, WhatsApp, trilha, data, pessoas, hora e cidade aproximada. Ela é marcada como **📩 Enviou** (mandou a mensagem) ou **🕓 Não enviou** (começou a preencher e desistiu); dá para filtrar, tocar em **Chamar no WhatsApp** (abre a conversa com uma mensagem pronta), marcar como já falei ou apagar. O contador não guarda IP nem conta robôs, e não conta as visitas da própria Área do guia;
- cria, edita, liga/desliga e reordena **expedições** (nome, descrição, nível, duração, distância, horário, valor, ponto de encontro, ilustração);
- abre **datas** com número de vagas (0 = esgotado). Elas aparecem nos cards e na reserva. Expedição **sem data futura aparece automaticamente como "Em breve"**;
- o campo **Distância (km)** posiciona a expedição no **mapa da serra** (quanto mais km, mais longe do acampamento) e aparece no carimbo do cartão-postal;
- cadastra **vídeos de manejo** (cobras, escorpiões, sapos, aranhas, outros). Os vídeos são do próprio Bruno: suba os arquivos .mp4 (em pé, formato reels) na pasta **videos/** do repositório e, na aba Vídeos, escreva o nome (ex.: `videos/jararaca.mp4`). Também aceita link do Google Drive compartilhado. No site, o vídeo roda sem som no cartão e abre em tela cheia com som. Dica: vídeos de até ~30 MB carregam bem; uma capa (imagem) é opcional;
- troca as **fotos das cachoeiras** (aba Fotos): toque em **+ Enviar fotos**, escolha da galeria do celular (pode várias de uma vez), escreva a legenda se quiser e toque em **Salvar e publicar**. A foto é diminuída sozinha antes de enviar, então carrega rápido. As que vêm no site foram tiradas do Instagram do Bruno (resolução baixa): troque pelas originais quando tiver;
- carrega o **trajeto GPX** de cada trilha (exportado do Wikiloc, Strava, AllTrails ou relógio). Quando pelo menos uma trilha tem GPX, aparece o botão **Mapa real** na seção Trilhas, com imagem de satélite e relevo;
- troca o **WhatsApp** que recebe as reservas (já vem com (31) 99648-5236);
- vê a **Fila de espera**: quem tocou em "Quero ser avisado" numa trilha sem data deixa nome, WhatsApp e quantas pessoas. Na aba, as pessoas aparecem separadas por trilha, na ordem em que entraram. O botão **Avisar** abre o WhatsApp da pessoa com a mensagem pronta (editável) e marca como avisado; **Avisar próximo** vai chamando um por um.

## App no celular
A Área do guia pode ser instalada como app. Abra **www.leopardosdasmontanhas.com.br/adm** no celular:
- **Android (Chrome):** aparece o cartão **Use como app** → toque em **Instalar**. Se não aparecer, toque nos ⋮ → **Instalar app**.
- **iPhone (Safari):** toque em **📲 Instalar app** e siga: botão **Compartilhar** → **Adicionar à Tela de Início** → **Adicionar**.
O ícone **Leopardos** fica junto dos outros apps e abre direto na Área do guia, em tela cheia. Arquivos: `adm.webmanifest`, `adm-sw.js` e os ícones `adm-*.png`.

## Vídeos enviados pelo celular (espaço de vídeos)
Na aba **Vídeos** da Área do guia, o botão **📤 Enviar vídeo do celular** manda o vídeo direto para o espaço de vídeos da Vercel (Blob), até 400 MB. Para funcionar, o espaço precisa estar ligado ao projeto (uma vez só):
1. Abra https://vercel.com/lobragancas-projects/leopardodasmontanhas/stores → **Create Database** → **Blob** → **Continue**.
2. Nome `leopardos-videos`, acesso **Public** → **Create** → ligue ao projeto (deixe o prefixo como vier) → **Connect**.
3. https://vercel.com/lobragancas-projects/leopardodasmontanhas/deployments → ⋯ do primeiro → **Redeploy**.

## Ligar o banco na Vercel (uma vez só, uns 3 minutos)
Sem o banco, o site funciona em **modo de teste**: o que se salva fica só no aparelho de quem editou e a aba Acessos fica desligada.
1. Abra https://vercel.com/marketplace/upstash e toque em **Install** (ou **Add Integration**).
2. Escolha o plano **Free**, dê um nome (ex.: `leopardos`) e a região **São Paulo (gru1)**, se aparecer.
3. Na tela seguinte, **conecte ao projeto `leopardodasmontanhas`** (marque Production, Preview e Development).
4. Abra https://vercel.com/dashboard → projeto **leopardodasmontanhas** → **Deployments** → no último, toque nos **⋯** → **Redeploy**.
Pronto: o login continua `bruno` / `123456789`, o que o guia salvar aparece para todo mundo e o contador começa a contar.

Para trocar o login ou a senha: no projeto da Vercel, **Settings → Environment Variables**, crie `ADMIN_USER` e `ADMIN_PASS` e faça Redeploy.
Na primeira vez com o banco ligado, o site mostra as trilhas que vêm no código; entre no /adm, confira e toque em **Salvar e publicar** para gravar tudo no banco.

## Observação
Dentro da prévia do Claude os vídeos não tocam no próprio site (o player abre o link). Publicado na Vercel, Reels/YouTube/TikTok tocam ali mesmo.

## Reservas
Na seção **Trilhas disponíveis**, o visitante escolhe a trilha e toca em **Quero essa**: abre uma janelinha com as datas abertas, quantas pessoas e o nome, e a reserva segue pelo WhatsApp. Trilhas sem data mostram **Quero ser avisado** (fila de espera). A seção **Guia particular** é para passeio só do grupo, empresa, escola ou evento: um formulário curto que manda o pedido de orçamento pelo WhatsApp. As duas opções montam a mensagem e abrem o WhatsApp do guia.

## Imagens
Logo, pôster do Bruno e os leopardos da logo já estão dentro do `index.html`. As animações premium usam GSAP e Lenis (carregados de CDN); sem internet para elas, o site continua funcionando normalmente.

## Domínio www.leopardosdasmontanhas.com.br (GoDaddy + Vercel)
1. Suba `index.html`, `vercel.json` e `og.jpg` num repositório novo no GitHub e importe na Vercel (igual ao site da Laisa).
2. Na Vercel: Project > Settings > Domains > adicione `leopardosdasmontanhas.com.br` e `www.leopardosdasmontanhas.com.br`.
3. Na GoDaddy (Meu domínio > DNS), crie/edite os registros que a Vercel mostrar. Normalmente:
   - Tipo **A**, nome **@**, valor **76.76.21.21**
   - Tipo **CNAME**, nome **www**, valor **cname.vercel-dns.com**
   Apague outro registro A ou CNAME "www" antigo que a GoDaddy tenha criado (o de "estacionamento").
4. Espere a Vercel mostrar "Valid Configuration" (de minutos a algumas horas).


## Tela de carregamento
Coloque uma foto de leopardo (ou onça) com o nome `fotos/leopardo.jpg`: ela aparece na tela de abertura. Sem a foto, aparece a logo.
