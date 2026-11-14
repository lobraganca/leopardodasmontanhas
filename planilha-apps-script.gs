/**
 * Leopardos das Montanhas — "banco de dados" do site numa planilha Google.
 * Guarda as imersões, datas, vídeos e o WhatsApp que o guia edita na Área do guia,
 * e a FILA DE ESPERA (quem tocou em "Quero ser avisado"), na aba "espera".
 *
 * COMO INSTALAR (uma vez só):
 * 1. Crie uma planilha Google nova (ex.: "Site Leopardos - dados").
 * 2. Menu Extensões > Apps Script. Apague o que tiver e cole este arquivo inteiro.
 * 3. Troque a SENHA abaixo pela senha que o guia vai usar.
 * 4. Clique em Implantar > Nova implantação > tipo "App da Web".
 *      Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 * 5. Autorize e copie a URL que termina em /exec.
 * 6. No index.html, cole a URL em CONFIG.api: "https://script.google.com/macros/s/.../exec"
 *
 * Se mudar a senha depois: salve e faça Implantar > Gerenciar implantações > editar > Nova versão.
 */
var SENHA = "123456789";

function aba_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName("dados") || ss.insertSheet("dados");
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  var txt = aba_().getRange("A1").getValue();
  try { return json_(txt ? JSON.parse(txt) : {}); } catch (e) { return json_({}); }
}

function abaEspera_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName("espera");
  if (!sh) { sh = ss.insertSheet("espera"); sh.appendRow(["id", "quando", "trilhaId", "trilha", "nome", "whatsapp", "pessoas", "status"]); }
  return sh;
}
function limpa_(v, n) { return String(v == null ? "" : v).replace(/[\r\n\t]/g, " ").slice(0, n); }

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "formato" }); }

  // Visitante entrando na fila de espera (não precisa de senha)
  if (body.acao === "espera") {
    var it = body.item || {};
    var wa = String(it.whatsapp || "").replace(/\D/g, "");
    if (!it.nome || wa.length < 10 || !it.trilhaId) return json_({ ok: false, error: "dados" });
    var lockW = LockService.getScriptLock(); lockW.waitLock(10000);
    try {
      var shw = abaEspera_();
      shw.appendRow([limpa_(it.id, 30), new Date(), limpa_(it.trilhaId, 60), limpa_(it.trilha, 80), limpa_(it.nome, 60), wa.slice(0, 13), Math.max(1, Math.min(30, +it.pessoas || 1)), "espera"]);
      var vals = shw.getDataRange().getValues(), pos = 0;
      for (var i = 1; i < vals.length; i++) if (vals[i][2] === limpa_(it.trilhaId, 60) && vals[i][7] !== "avisado") pos++;
    } finally { lockW.releaseLock(); }
    return json_({ ok: true, pos: pos });
  }

  if (String(body.pin) !== SENHA) return json_({ ok: false, error: "pin" });

  // Guia lendo a fila
  if (body.acao === "listaEspera") {
    var v = abaEspera_().getDataRange().getValues(), lista = [];
    for (var r = 1; r < v.length; r++) lista.push({ id: v[r][0], quando: new Date(v[r][1]).toISOString(), trilhaId: v[r][2], trilha: v[r][3], nome: v[r][4], whatsapp: String(v[r][5]), pessoas: v[r][6], status: v[r][7] });
    return json_({ ok: true, lista: lista });
  }
  // Guia marcando como avisado / tirando da fila
  if (body.acao === "atualizaEspera") {
    var sh2 = abaEspera_(), v2 = sh2.getDataRange().getValues();
    for (var k = v2.length - 1; k >= 1; k--) if (v2[k][0] === body.id) {
      if (body.status === "remover") sh2.deleteRow(k + 1); else sh2.getRange(k + 1, 8).setValue(body.status === "avisado" ? "avisado" : "espera");
    }
    return json_({ ok: true });
  }
  if (body.check) return json_({ ok: true });
  if (!body.data || !Array.isArray(body.data.tours)) return json_({ ok: false, error: "dados" });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = aba_();
    sh.getRange("A1").setValue(JSON.stringify(body.data));
    sh.getRange("B1").setValue(new Date());           // quando foi salvo
    // Cópia legível das datas, só para consulta na planilha
    var linhas = [["Imersão", "Data", "Vagas", "Obs."]];
    body.data.tours.forEach(function (t) {
      (t.datas || []).forEach(function (d) { linhas.push([t.nome, d.d, d.vagas, d.obs || ""]); });
    });
    sh.getRange("D1:G").clearContent();
    sh.getRange(1, 4, linhas.length, 4).setValues(linhas);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}
