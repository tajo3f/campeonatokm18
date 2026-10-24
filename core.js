(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.KM18Core=api;
})(typeof self!=='undefined'?self:this,function(){
  const digits=v=>String(v||'').replace(/\D/g,'');

  function normalizePhone(value){
    const d=digits(value).slice(0,11);
    if(d.length<=2) return d;
    if(d.length<=6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if(d.length<=10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  }

  function validateRegistration(data){
    if(!data || !String(data.team_name||'').trim()) return 'Informe o nome da equipe.';
    if(!String(data.coach_name||'').trim()) return 'Informe o técnico / responsável.';
    const phone=digits(data.phone);
    if(phone.length<10 || phone.length>11) return 'Informe um WhatsApp válido com DDD.';
    if(!Array.isArray(data.players) || data.players.length<1) return 'Adicione pelo menos 1 jogador.';
    for(let i=0;i<data.players.length;i++){
      const p=data.players[i]||{};
      if(!String(p.name||'').trim()) return `Informe o nome do jogador ${i+1}.`;
    }
    return null;
  }

  function makeRegistrationCode(now=new Date(), random=Math.random){
    const year=now.getFullYear();
    const stamp=String(now.getTime()).slice(-6);
    const rand=Math.floor(random()*900+100);
    return `KM18-${year}-${stamp}${rand}`;
  }

  function safeFilename(value){
    return String(value||'equipe').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,50)||'equipe';
  }

  function formatDateTime(date=new Date()){
    try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(date)}catch{return date.toLocaleString('pt-BR')}
  }

  function toAscii(value){
    return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2013\u2014]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[^\x20-\x7E]/g,'');
  }

  return {digits,normalizePhone,validateRegistration,makeRegistrationCode,safeFilename,formatDateTime,toAscii};
});
