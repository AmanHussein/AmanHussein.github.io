(function(){
'use strict';
const D=window.PROJECT_DATA;
const $=id=>document.getElementById(id),nf=new Intl.NumberFormat('sv-SE'),money=new Intl.NumberFormat('sv-SE',{minimumFractionDigits:2,maximumFractionDigits:2}),pct=new Intl.NumberFormat('sv-SE',{style:'percent',maximumFractionDigits:1});
const kr=(n,dec=false)=>(dec?money:nf).format(n)+' kr';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sum(rows,k){return rows.reduce((a,r)=>a+r[k],0)}
function group(rows,key){const m=new Map();rows.forEach(r=>m.set(r[key],(m.get(r[key])||0)+r.amount));return[...m].sort((a,b)=>b[1]-a[1])}
let qty=D.quantity,capacity=D.capacity,rate=D.rate;
function calculate(s,q=qty,r=rate,price=s.price){
 if(q<s.moq||q<=0)return null;
 const orders=Math.ceil(D.demand/q),lastDemand=D.demand-(orders-1)*q,last=Math.max(s.moq,lastDemand),purchased=(orders-1)*q+last,remaining=purchased-D.demand;
 const average=((orders-1)*q*q+last*last-remaining*remaining)/(2*D.demand);
 const goods=purchased*price,freight=orders*s.freight,holding=average*price*r;
 return{orders,last,purchased,remaining,average,goods,freight,holding,total:goods+freight+holding,feasible:Math.max(q,last)<=capacity};
}
// Exposed calculation only for reproducible verification; no network or storage.
window.procurementModel={calculate,data:D};
function renderSpend(){
 const cat=$('category').value,sup=$('supplier').value,rows=D.history.filter(r=>(cat==='all'||r.category===cat)&&(sup==='all'||r.supplier===sup)),total=sum(rows,'amount');
 $('spend-total').textContent=kr(total);$('spend-rows').textContent=rows.length+' fakturarader';
 const articles=group(rows,'article'),max=Math.max(0,...articles.map(x=>x[1]));
 $('article-chart').innerHTML=articles.length?articles.map(([name,value])=>`<div class="bar-row"><span class="bar-label">${esc(name)}</span><div class="bar-track"><div class="bar-fill" style="width:${value/max*100}%"></div></div><span class="bar-value">${nf.format(value)}</span></div>`).join(''):'<p class="empty">Inga inköp i detta urval.</p>';
 $('article-chart').setAttribute('aria-label',articles.map(([n,v])=>n+': '+kr(v)).join('. ')||'Inga inköp i detta urval.');
 $('supplier-body').innerHTML=group(rows,'supplier').map(([name,value])=>`<tr><td class="supplier-name">${esc(name)}</td><td>${kr(value)}</td><td>${pct.format(value/total)}</td></tr>`).join('')||'<tr><td colspan="3">Inga inköp i detta urval.</td></tr>';
 $('history-body').innerHTML=rows.map(r=>`<tr><td>${r.date}</td><td>${r.invoice}</td><td>${esc(r.supplier)}</td><td>${esc(r.article)}</td><td>${nf.format(r.qty)}</td><td>${r.unit}</td><td>${kr(r.price,true)}</td><td>${kr(r.amount)}</td></tr>`).join('')||'<tr><td colspan="8">Inga fakturarader.</td></tr>';
}
function renderModel(){
 const results=D.suppliers.map(s=>({s,c:calculate(s)})),eligible=results.filter(x=>x.c&&x.c.feasible),best=eligible.length?eligible.reduce((a,b)=>a.c.total<b.c.total?a:b):null;
 $('rate-output').textContent=pct.format(rate);const orders=Math.ceil(D.demand/qty),last=D.demand-(orders-1)*qty;
 const valid=Number.isFinite(capacity)&&capacity>0;
 const fits=valid&&results.every(x=>x.c&&x.c.feasible);
 $('capacity-message').className='capacity-note'+(fits?'':' warning');
 $('capacity-message').textContent=!valid?'Ange en lagerkapacitet större än noll.':fits?`${orders} order. ${orders-1} × ${nf.format(qty)} och en sista på ${nf.format(last)} lådor, justerad vid behov till minsta orderkvantitet.`:`Orderstorleken överskrider lagerkapaciteten på ${nf.format(capacity)} lådor. Beloppen visas för jämförelse, men upplägget är inte genomförbart inom kapacitetskravet.`;
 $('offer-cards').innerHTML=results.map(({s,c})=>{
  const cheaper=best&&best.s.name===s.name,ok=c&&c.feasible&&valid;
  return`<article class="offer-card ${cheaper?'cheaper':''}"><div class="offer-top"><h3>${esc(s.name)}</h3><span class="mini-status ${ok?'':'invalid'}">${ok?(cheaper?'LÄGST I SCENARIOT':'INOM KAPACITET'):'UTANFÖR KAPACITET'}</span></div><div class="cost-label">INKÖP, FRAKT & LAGERHÅLLNING / ÅR</div><div class="offer-cost">${money.format(c.total)} <small>kr</small></div><div class="cost-stack" aria-hidden="true"><span style="width:${c.goods/c.total*100}%"></span><span style="width:${c.freight/c.total*100}%"></span><span style="width:${c.holding/c.total*100}%"></span></div><div class="offer-details"><div><span>Styckpris</span><strong>${money.format(s.price)} kr</strong></div><div><span>Frakt per order</span><strong>${nf.format(s.freight)} kr</strong></div><div><span>Leveranstid</span><strong>${s.lead} arbetsdagar</strong></div></div><div class="offer-facts"><span>Minsta order ${s.moq} st</span><span>${s.terms} dagars betalningstid</span><span>${nf.format(c.remaining)} st kvar vid årets slut</span></div></article>`;
 }).join('');
 const delta=results[0].c.total-results[1].c.total;
 $('decision').className='decision-strip'+(fits?'':' invalid');
 $('decision').innerHTML=fits?`<div><h3>${esc(best.s.name)} har lägst kalkylbelopp i det valda scenariot.</h3><p>${nf.format(qty)} per order · ${orders} order · jämn förbrukning · ${pct.format(rate)} lagerhållningsränta</p></div><strong class="decision-delta">${kr(Math.abs(delta),true)} lägre</strong>`:'<div><h3>Kapacitetskravet är inte uppfyllt.</h3><p>Välj en mindre orderstorlek eller ändra kapaciteten om det finns ett underbyggt skäl.</p></div>';
 $('calculation-body').innerHTML=results.map(({s,c})=>`<tr><td>${esc(s.name)}</td><td>${nf.format(c.purchased)}</td><td>${kr(c.goods,true)}</td><td>${kr(c.freight,true)}</td><td>${money.format(c.average)} st</td><td>${kr(c.holding,true)}</td><td>${kr(c.total,true)}</td></tr>`).join('');
 renderNegotiation();
}
function renderNegotiation(){
 const target=Number($('target').value),s=D.suppliers[1],base=calculate(s),goal=calculate(s,qty,rate,target);
 $('target-output').textContent=money.format(target)+' kr/st';$('neg-scenario').textContent=nf.format(qty)+' ST / ORDER';
 $('goods-saving').textContent=kr(base.goods-goal.goods,true);$('total-saving').textContent=kr(base.total-goal.total,true);
}
function renderDelivery(){
 const type=$('delivery-filter').value,rows=D.deliveries.map(r=>({...r,days:Math.max(0,(Date.parse(r.receivedDate)-Date.parse(r.promised))/86400000),left:Math.max(0,r.ordered-r.received),otif:r.receivedDate<=r.promised&&r.received>=r.ordered})).filter(r=>type==='all'||type==='late'&&r.days>0||type==='short'&&r.left>0||type==='otif'&&r.otif);
 $('delivery-body').innerHTML=rows.map(r=>`<tr><td class="supplier-name">${r.id}</td><td>${r.promised}</td><td>${r.receivedDate}</td><td>${nf.format(r.ordered)}</td><td>${nf.format(r.received)}</td><td class="${r.days?'late-number':''}">${r.days} dagar</td><td class="${r.left?'late-number':''}">${r.left} st</td><td><span class="status ${r.otif?'good':'bad'}">${r.otif?'Ja':'Nej'}</span></td></tr>`).join('')||'<tr><td colspan="8">Inga order i urvalet.</td></tr>';
 $('delivery-count').textContent=`Visar ${rows.length} av 5 order. Nyckeltalen ovan gäller alltid samtliga fem order.`;
}
[...new Set(D.history.map(r=>r.category))].forEach(x=>$('category').add(new Option(x,x)));
[...new Set(D.history.map(r=>r.supplier))].forEach(x=>$('supplier').add(new Option(x,x)));
$('category').addEventListener('change',renderSpend);$('supplier').addEventListener('change',renderSpend);
$('reset-spend').addEventListener('click',()=>{$('category').value='all';$('supplier').value='all';renderSpend()});
document.querySelectorAll('[data-qty]').forEach(b=>b.addEventListener('click',()=>{qty=Number(b.dataset.qty);document.querySelectorAll('[data-qty]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))});renderModel()}));
$('capacity').addEventListener('input',()=>{capacity=Number($('capacity').value);renderModel()});
$('rate').addEventListener('input',()=>{rate=Number($('rate').value)/100;renderModel()});
$('target').addEventListener('input',renderNegotiation);
$('reset-model').addEventListener('click',()=>{qty=D.quantity;capacity=D.capacity;rate=D.rate;$('capacity').value=capacity;$('rate').value=rate*100;$('target').value=D.target;document.querySelectorAll('[data-qty]').forEach(x=>{x.classList.toggle('selected',Number(x.dataset.qty)===qty);x.setAttribute('aria-pressed',String(Number(x.dataset.qty)===qty))});renderModel()});
$('delivery-filter').addEventListener('change',renderDelivery);
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)document.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))})},{rootMargin:'-10% 0px -60% 0px'});document.querySelectorAll('section[id]').forEach(s=>observer.observe(s))}
renderSpend();renderModel();renderDelivery();
})();
