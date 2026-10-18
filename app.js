const $=id=>document.getElementById(id);
const STORE='mamalayEmaPrototype_v1';
const defaults={prices:{wash:160,dry:0,both:160,fold:0,pickup:10},orders:[]};
let state;
try{state=JSON.parse(localStorage.getItem(STORE))||structuredClone(defaults)}catch{state=structuredClone(defaults)}
const money=n=>'₱'+Number(n||0).toLocaleString('en-PH',{maximumFractionDigits:2});
const save=()=>localStorage.setItem(STORE,JSON.stringify(state));
const priceFor=s=>s==='Folding'?0:state.prices.both;
function renderPrices(){
 $('priceBoth').value=state.prices.both;$('pickupFee').value=state.prices.pickup??10;
 updateEstimate();
}
function updateEstimate(){
 const f=$('bookingForm');if(!f)return;
 const service=f.elements.service.value,loads=Math.max(1,Number(f.elements.loads.value)||1);
 const handling=f.elements.handling.value; const pickupFee=handling==='Pickup & delivery'?(state.prices.pickup??10):0; const base=priceFor(service)*loads; $('estimate').textContent=service==='Folding'?'Price to be confirmed':money(base+pickupFee)+' (estimate)';
}
function renderOrders(){
 const box=$('ownerOrders');
 if(!state.orders.length){box.innerHTML='<p class="sub">No booking requests on this browser yet.</p>';return}
 box.innerHTML='';
 state.orders.slice().reverse().forEach(o=>{
  const card=document.createElement('article');card.className='ordercard';
  const head=document.createElement('div');head.className='orderline';
  const title=document.createElement('strong');title.textContent=o.name+' · '+o.ref;
  const amount=document.createElement('strong');amount.textContent=o.total===null?'Price to confirm':money(o.total);
  head.append(title,amount);card.append(head);
  const info=document.createElement('p');info.textContent=`${o.service} · ${o.loads} load(s) · ${o.handling} · ${o.payment} · ${o.phone}${o.loyaltyEligible?' · Possible free pickup/delivery reward':''}`;
  const address=document.createElement('p');address.textContent=o.address?`Address: ${o.address}`:'Drop-off at shop';
  const date=document.createElement('p');date.textContent=`Preferred: ${o.date}, ${o.time} · ${o.created}`;
  const notes=document.createElement('p');notes.textContent=o.notes?`Notes: ${o.notes}`:'';
  const status=document.createElement('span');status.className='status';status.textContent=o.status;
  const sel=document.createElement('select');sel.setAttribute('aria-label','Update status for '+o.ref);
  ['Requested','Confirmed','Received','Washing','Drying','Ready for pickup','Out for delivery','Completed','Cancelled'].forEach(s=>{const opt=document.createElement('option');opt.value=s;opt.textContent=s;if(o.status===s)opt.selected=true;sel.append(opt)});
  sel.addEventListener('change',()=>{o.status=sel.value;save();renderOrders()});
  card.append(info,address,date,notes,status,sel);box.append(card);
 });
}
$('bookingForm').elements.handling.addEventListener('change',e=>$('addressWrap').classList.toggle('hidden',e.target.value!=='Pickup & delivery'));
$('bookingForm').addEventListener('input',updateEstimate);$('bookingForm').elements.service.addEventListener('change',updateEstimate);
$('bookingForm').addEventListener('submit',e=>{
 e.preventDefault();const f=e.currentTarget,fd=new FormData(f);
 const handling=fd.get('handling'),address=String(fd.get('address')||'').trim();
 if(handling==='Pickup & delivery'&&!address){alert('Please enter your pickup/delivery address.');return}
 const loads=Math.max(1,Number(fd.get('loads'))||1);
 const ref='ME-'+Math.floor(100000+Math.random()*900000);
 const service=fd.get('service');const pickupCharge=handling==='Pickup & delivery'?(state.prices.pickup??10):0;const total=service==='Folding'?null:priceFor(service)*loads+pickupCharge;
 const previousOrders=state.orders.filter(o=>o.phone===String(fd.get('phone')).trim()&&o.status==='Completed').length;
 const loyaltyEligible=handling==='Pickup & delivery'&&previousOrders>=3;
 const order={ref,name:String(fd.get('name')).trim(),phone:String(fd.get('phone')).trim(),service,loads,handling,address,date:fd.get('date'),time:fd.get('time'),payment:fd.get('payment'),notes:String(fd.get('notes')||'').trim(),pickupCharge:loyaltyEligible?0:pickupCharge,loyaltyEligible,total:total===null?null:total-(loyaltyEligible?pickupCharge:0),status:'Requested',created:new Date().toLocaleString()};
 state.orders.push(order);save();renderOrders();
 $('bookingResult').classList.remove('hidden');
 $('bookingResult').textContent=`Booking request saved on this device. Your reference is ${ref}. ${order.total===null?'Folding price will be confirmed by the shop.':'Estimated total: '+money(order.total)+'.'} ${loyaltyEligible?'Your phone number has 3 completed orders in this browser, so this booking has a free pickup/delivery fee estimate. The laundry service itself is still charged. The shop must confirm your loyalty reward.':''} Status: Requested. Please contact the shop to confirm. Save your reference to check status on this same browser.`;
 f.reset();$('addressWrap').classList.add('hidden');updateEstimate();
});
$('trackForm').addEventListener('submit',e=>{
 e.preventDefault();const ref=String(new FormData(e.currentTarget).get('ref')).trim().toUpperCase();
 const o=state.orders.find(x=>x.ref.toUpperCase()===ref);const box=$('trackResult');box.classList.remove('hidden');
 box.textContent=o?`Booking ${o.ref}: ${o.status}. Service: ${o.service}; ${o.loads} load(s). Estimated total: ${money(o.total)}. Please contact the shop if you need confirmation.`:'We could not find that reference in this browser. In this demo, bookings are not shared across devices.';
});
$('ownerToggle').addEventListener('click',()=>{$('ownerPanel').classList.remove('hidden');renderOrders();$('ownerPanel').scrollIntoView({behavior:'smooth'})});
$('ownerClose').addEventListener('click',()=>$('ownerPanel').classList.add('hidden'));
$('savePrices').addEventListener('click',()=>{
 state.prices={wash:Math.max(0,Number($('priceBoth').value)||0),dry:0,both:Math.max(0,Number($('priceBoth').value)||0),fold:0,pickup:Math.max(0,Number($('pickupFee').value)||0)};
 save();renderPrices();alert('Prices saved on this browser.');
});
$('exportCsv').addEventListener('click',()=>{
 const rows=[['Reference','Name','Phone','Service','Loads','Handling','Address','Date','Time','Payment','Total','Pickup charge','Loyalty reward possible','Status','Notes'],...state.orders.map(o=>[o.ref,o.name,o.phone,o.service,o.loads,o.handling,o.address,o.date,o.time,o.payment,o.total,o.pickupCharge,o.loyaltyEligible,o.status,o.notes])];
 const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='mamalay-ema-bookings.csv';a.click();URL.revokeObjectURL(url);
});
$('year').textContent=new Date().getFullYear();
const dateInput=$('bookingForm').elements.date;const today=new Date();dateInput.min=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
renderPrices();renderOrders();
if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
