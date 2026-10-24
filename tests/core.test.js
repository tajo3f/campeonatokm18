const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../core');
const PDF=require('../pdf');

const good={team_name:'Conexao AFC.MG',coach_name:'Carlos Silva',phone:'(27) 99999-9999',community:'Afonso Claudio',players:[{name:'Joao',number:10,shirt_size:'M'},{name:'Pedro',number:7,shirt_size:null}]};

test('aceita uma ficha valida',()=>assert.equal(Core.validateRegistration(good),null));
test('rejeita numero repetido',()=>assert.match(Core.validateRegistration({...good,players:[{name:'A',number:10},{name:'B',number:10}]}),/repetido/i));
test('rejeita whatsapp invalido',()=>assert.match(Core.validateRegistration({...good,phone:'123'}),/WhatsApp/i));
test('rejeita jogador sem nome',()=>assert.match(Core.validateRegistration({...good,players:[{name:'',number:8}]}),/nome do jogador/i));
test('formata celular',()=>assert.equal(Core.normalizePhone('27997796977'),'(27) 99779-6977'));
test('codigo de ficha tem prefixo e ano',()=>assert.match(Core.makeRegistrationCode(new Date('2026-10-24T12:00:00-03:00'),()=>0.1),/^KM18-2026-/));
test('gera PDF valido e nao vazio',()=>{const bytes=PDF.makePdfBytes(good,'KM18-2026-TESTE','24/10/2026 12:00');const header=Buffer.from(bytes.slice(0,8)).toString();assert.match(header,/^%PDF-1\.4/);assert.ok(bytes.length>1500);const tail=Buffer.from(bytes.slice(-20)).toString();assert.match(tail,/%%EOF/);});
test('gera PDF multipagina com muitos jogadores',()=>{const many={...good,players:Array.from({length:45},(_,i)=>({name:`Jogador ${i+1}`,number:i,shirt_size:null}))};const bytes=PDF.makePdfBytes(many,'KM18-2026-MULTI','24/10/2026 12:00');const text=Buffer.from(bytes).toString('latin1');assert.match(text,/\/Count 3/);});
