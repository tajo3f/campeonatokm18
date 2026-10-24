(function(root,factory){
  const core=(typeof module==='object'&&module.exports)?require('./core'):root.KM18Core;
  const api=factory(core);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.KM18PDF=api;
})(typeof self!=='undefined'?self:this,function(Core){
  const enc=new TextEncoder();
  const esc=s=>Core.toAscii(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
  const t=(x,y,size,text,font='F1',r=0.96,g=1,b=0.94)=>`BT /${font} ${size} Tf ${r} ${g} ${b} rg ${x} ${y} Td (${esc(text)}) Tj ET\n`;
  const box=(x,y,w,h,r,g,b)=>`${r} ${g} ${b} rg ${x} ${y} ${w} ${h} re f\n`;
  const line=(x1,y1,x2,y2,r=.22,g=.35,b=.20,width=.7)=>`${r} ${g} ${b} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S\n`;

  function pageContent(data,code,rows,pageIndex,totalPages,generatedAt){
    let s='';
    s+=box(0,0,595,842,.025,.045,.025);
    s+=box(0,770,595,72,.24,.92,.04);
    s+=t(36,812,14,'CAMPEONATO','F2',.02,.05,.02);
    s+=t(36,786,27,'SOCIETY KM18','F2',.02,.05,.02);
    s+=t(420,812,9,`FICHA ${pageIndex+1}/${totalPages}`,'F2',.02,.05,.02);
    s+=t(36,747,16,'FICHA OFICIAL DA EQUIPE','F2',.70,1,.34);
    s+=t(36,723,9,`Codigo: ${code}`,'F1',.68,.78,.66);
    s+=t(350,723,9,`Gerado: ${generatedAt}`,'F1',.68,.78,.66);
    s+=line(36,708,559,708,.35,.95,.12,1);

    if(pageIndex===0){
      s+=t(36,680,10,'EQUIPE','F2',.55,1,.22);
      s+=t(36,660,15,data.team_name,'F2');
      s+=t(36,632,9,'TECNICO / RESPONSAVEL','F2',.55,1,.22);
      s+=t(36,614,11,data.coach_name,'F1');
      s+=t(330,632,9,'WHATSAPP','F2',.55,1,.22);
      s+=t(330,614,11,data.phone,'F1');
      if(data.community){
        s+=t(36,588,9,'CIDADE / COMUNIDADE','F2',.55,1,.22);
        s+=t(36,570,11,data.community,'F1');
      }
      s+=line(36,548,559,548);
    } else {
      s+=t(36,676,11,`Equipe: ${data.team_name}`,'F2');
      s+=line(36,658,559,658);
    }

    const startY=pageIndex===0?520:630;
    s+=box(36,startY,523,26,.10,.18,.09);
    s+=t(48,startY+9,9,'#','F2',.55,1,.22);
    s+=t(78,startY+9,9,'JOGADOR','F2',.55,1,.22);
    s+=t(450,startY+9,9,'NUMERO','F2',.55,1,.22);
    s+=t(510,startY+9,9,'CAMISA','F2',.55,1,.22);
    let y=startY-24;
    rows.forEach((p,i)=>{
      const globalIndex=p.__index;
      if(i%2===0) s+=box(36,y-5,523,24,.045,.075,.04);
      s+=t(48,y+2,9,String(globalIndex+1),'F1',.86,.93,.84);
      s+=t(78,y+2,9,p.name,'F1',.96,1,.94);
      s+=t(468,y+2,9,String(p.number),'F2',.96,1,.94);
      s+=t(523,y+2,9,p.shirt_size||'-','F1',.86,.93,.84);
      s+=line(36,y-8,559,y-8,.12,.20,.11,.4);
      y-=25;
    });

    s+=line(36,70,559,70,.35,.95,.12,.8);
    s+=t(36,49,8,'Campeonato Society KM18 - Afonso Claudio - ES','F2',.52,.66,.50);
    s+=t(350,49,8,'WhatsApp: (27) 99779-6977','F1',.52,.66,.50);
    return s;
  }

  function makePdfBytes(data,code,generatedAt){
    const firstCapacity=17, otherCapacity=21;
    const indexed=data.players.map((p,i)=>({...p,__index:i}));
    const pages=[];
    pages.push(indexed.slice(0,firstCapacity));
    let offset=firstCapacity;
    while(offset<indexed.length){pages.push(indexed.slice(offset,offset+otherCapacity));offset+=otherCapacity;}

    const objects=[];
    const add=obj=>{objects.push(obj);return objects.length;};
    const font1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const font2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const pageObjectIds=[];
    const contentObjectIds=[];

    pages.forEach((rows,i)=>{
      const content=pageContent(data,code,rows,i,pages.length,generatedAt);
      const contentId=add(`<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream`);
      contentObjectIds.push(contentId);
      const pageId=add('PAGE_PLACEHOLDER');
      pageObjectIds.push(pageId);
    });

    const pagesId=add('PAGES_PLACEHOLDER');
    const catalogId=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    pageObjectIds.forEach((id,i)=>{
      objects[id-1]=`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> /Contents ${contentObjectIds[i]} 0 R >>`;
    });
    objects[pagesId-1]=`<< /Type /Pages /Kids [${pageObjectIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`;

    const chunks=[]; const offsets=[0]; let total=0;
    const push=str=>{const u=enc.encode(str);chunks.push(u);total+=u.length;};
    push('%PDF-1.4\n%KM18\n');
    objects.forEach((obj,i)=>{offsets[i+1]=total;push(`${i+1} 0 obj\n${obj}\nendobj\n`);});
    const xref=total;
    push(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`);
    for(let i=1;i<=objects.length;i++) push(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
    push(`trailer\n<< /Size ${objects.length+1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`);
    const out=new Uint8Array(total);let pos=0;chunks.forEach(c=>{out.set(c,pos);pos+=c.length;});
    return out;
  }

  function createPdfBlob(data,code,generatedAt){
    return new Blob([makePdfBytes(data,code,generatedAt)],{type:'application/pdf'});
  }
  return {makePdfBytes,createPdfBlob};
});
