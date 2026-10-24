(()=>{
  'use strict';
  const Core=window.KM18Core, PDF=window.KM18PDF;
  const $=s=>document.querySelector(s);
  const players=$('#players');
  const form=$('#form');
  const success=$('#success');
  const STORAGE='km18_ficha_draft_v2';
  const OFFICIAL_PHONE='5527997796977';
  let currentFile=null,currentBlob=null,currentData=null,currentCode='';

  function toast(message,type='info'){
    const el=$('#toast');
    el.textContent=message; el.dataset.type=type; el.classList.add('show');
    clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),4200);
  }

  function escapeHtml(value=''){
    return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function renumberCards(){
    [...players.querySelectorAll('.player')].forEach((card,i)=>{
      card.querySelector('.playerNumber').textContent=`JOGADOR ${String(i+1).padStart(2,'0')}`;
      card.dataset.index=i;
    });
  }

  function addPlayer(data={}){
        const card=document.createElement('div'); card.className='player';
    card.innerHTML=`
      <div class="playerHead">
        <strong class="playerNumber"></strong>
        <button type="button" class="remove">Remover</button>
      </div>
      <div class="playerGrid">
        <label>Nome do jogador *<input class="pname" maxlength="100" required placeholder="Nome completo" value="${escapeHtml(data.name||'')}"></label>
      </div>`;
    card.querySelector('.remove').addEventListener('click',()=>{
      if(players.children.length===1){toast('A equipe precisa ter pelo menos 1 jogador.','warn');return;}
      card.remove();renumberCards();saveDraft();
    });
    card.addEventListener('input',saveDraft); card.addEventListener('change',saveDraft);
    players.appendChild(card);renumberCards();saveDraft();
    if(players.children.length===16) toast('Atenção: o recomendado é cadastrar até 15 jogadores. Você pode continuar, mas confira com a organização do campeonato.','warn');
  }

  function collect(){
    return {
      team_name:$('#team').value.trim(),
      coach_name:$('#coach').value.trim(),
      phone:$('#phone').value.trim(),
      community:$('#community').value.trim(),
      players:[...players.querySelectorAll('.player')].map(card=>({
        name:card.querySelector('.pname').value.trim()
      }))
    };
  }

  function draftObject(){
    const data=collect();
    data.confirmed=$('#confirm').checked;
    return data;
  }

  function saveDraft(){
    try{localStorage.setItem(STORAGE,JSON.stringify(draftObject()));}catch{}
  }

  function loadDraft(){
    let d=null;try{d=JSON.parse(localStorage.getItem(STORAGE)||'null')}catch{}
    if(!d){addPlayer();return;}
    $('#team').value=d.team_name||'';$('#coach').value=d.coach_name||'';$('#phone').value=d.phone||'';$('#community').value=d.community||'';
    $('#confirm').checked=!!d.confirmed;
    const list=Array.isArray(d.players)&&d.players.length?d.players:[{}];
    list.forEach(addPlayer);
  }

  function downloadBlob(blob,filename){
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  function whatsappUrl(){
    const team=currentData?.team_name||$('#team').value.trim()||'minha equipe';
    const code=currentCode?`%0A%0ACódigo da ficha: ${encodeURIComponent(currentCode)}`:'';
    const text=`Olá! Segue a ficha em PDF da equipe *${encodeURIComponent(team)}* para o Campeonato Society KM18.${code}`;
    return `https://wa.me/${OFFICIAL_PHONE}?text=${text}`;
  }

  async function sharePdf(){
    if(!currentFile||!currentBlob){toast('Gere o PDF primeiro.','warn');return;}
    const shareData={files:[currentFile],title:'Ficha Campeonato Society KM18',text:`Ficha da equipe ${currentData.team_name} — ${currentCode}`};
    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[currentFile]}))){
      try{await navigator.share(shareData);toast('Compartilhamento aberto. Escolha o WhatsApp e envie para a organização.','ok');return;}catch(err){if(err && err.name==='AbortError')return;}
    }
    downloadBlob(currentBlob,currentFile.name);
    toast('Seu navegador não compartilha PDF diretamente. O arquivo foi baixado; agora envie pelo WhatsApp.','warn');
  }

  function resetAll(){
    try{localStorage.removeItem(STORAGE)}catch{}
    currentFile=currentBlob=currentData=null;currentCode='';
    form.reset();players.innerHTML='';addPlayer();success.hidden=true;form.hidden=false;window.scrollTo({top:0,behavior:'smooth'});
  }

  $('#phone').addEventListener('input',e=>{e.target.value=Core.normalizePhone(e.target.value);saveDraft();});
  ['team','coach','community','confirm'].forEach(id=>{const el=$('#'+id);el.addEventListener('input',saveDraft);el.addEventListener('change',saveDraft);});
  $('#add').addEventListener('click',()=>addPlayer());
  $('#addBottom').addEventListener('click',()=>addPlayer());

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!form.reportValidity()){toast('Confira os campos obrigatórios.','warn');return;}
    const data=collect();const error=Core.validateRegistration(data);if(error){toast(error,'warn');return;}
    if(data.players.length>15){toast(`Atenção: foram cadastrados ${data.players.length} jogadores. O recomendado é até 15; a ficha será gerada normalmente.`,'warn');}
    const button=$('#submit');button.disabled=true;button.textContent='GERANDO PDF...';
    try{
      const code=Core.makeRegistrationCode();const generatedAt=Core.formatDateTime(new Date());
      const blob=PDF.createPdfBlob(data,code,generatedAt);
      if(!blob || blob.size<500) throw new Error('Falha ao gerar o arquivo PDF.');
      const filename=`KM18-${Core.safeFilename(data.team_name)}-${code}.pdf`;
      currentBlob=blob;currentFile=new File([blob],filename,{type:'application/pdf'});currentData=data;currentCode=code;
      $('#registrationCode').textContent=code;
      $('#successText').textContent=`A ficha da equipe “${data.team_name}” foi gerada com ${data.players.length} jogador${data.players.length===1?'':'es'}. Envie o PDF para o WhatsApp oficial (27) 99779-6977.`;
      form.hidden=true;success.hidden=false;success.scrollIntoView({behavior:'smooth',block:'start'});
      toast('PDF gerado com sucesso.','ok');
    }catch(err){console.error(err);toast('Não foi possível gerar o PDF neste aparelho.','error');}
    finally{button.disabled=false;button.textContent='GERAR FICHA EM PDF';}
  });

  $('#sharePdf').addEventListener('click',sharePdf);
  $('#downloadPdf').addEventListener('click',()=>{if(currentBlob&&currentFile)downloadBlob(currentBlob,currentFile.name)});
  $('#openWhatsapp').addEventListener('click',()=>window.open(whatsappUrl(),'_blank','noopener'));
  $('#newRegistration').addEventListener('click',resetAll);

  loadDraft();
})();
