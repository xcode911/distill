const FALLBACK={incidents:[],updatedAt:null,source:'Cloudflare Radar'};
const state={...FALLBACK};
const news=[
 ['Cloudflare Radar','بيانات الهجمات المجمعة من شبكة Cloudflare العامة','مصدر مباشر'],
 ['CISA KEV','الثغرات المستغلة فعليًا في البرية — عند توفر مزامنة KEV','مصدر حكومي'],
 ['CTF intelligence','فعاليات وتحديات CTF القادمة','قريبًا']
];
const teams=[['1','TeamH4C','—'],['2','H-T8','—'],['3','W4llz','—'],['4','RubiyaLab Expeditions','—'],['5','tjcsc','—']];
const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));

async function loadFeed(){
 try{
  const r=await fetch('data/incidents.json?ts='+Date.now(),{cache:'no-store'});
  if(!r.ok) throw new Error('feed unavailable');
  const data=await r.json();
  state.incidents=Array.isArray(data.incidents)?data.incidents:[];
  state.updatedAt=data.updatedAt||null;
  state.source=data.source||'Cloudflare Radar';
 }catch(e){state.incidents=[];}
 renderAll();
 if(window.L) initMap();
}
function renderIncidents(){
 const box=document.querySelector('#incidents');
 if(!state.incidents.length){box.innerHTML='<div class="incident empty"><div class="incident-title">لا توجد بيانات موثقة محمّلة الآن</div><div class="incident-meta"><span>FEED OFFLINE / AWAITING SYNC</span><span class="tag scan">—</span></div><div class="incident-meta"><span>لن نعرض أسهمًا وهمية</span><span>REAL DATA ONLY</span></div></div>'}
 else box.innerHTML=state.incidents.map(x=>`<div class="incident"><div class="incident-title">${esc(x.name||'Cloudflare Radar attack pair')}</div><div class="incident-meta"><span>${esc(x.from)} → ${esc(x.to)}</span><span class="tag ${esc(x.type||'ddos')}">${esc(x.tag||'DDoS')}</span></div><div class="incident-meta"><span>${esc(x.time||'آخر 24 ساعة')}</span><span>RADAR</span></div><div class="incident-meta"><span>${esc(x.share||'')}%</span><span>MITIGATED TRAFFIC SHARE</span></div></div>`).join('');
 document.querySelector('#incidentCount').textContent=state.incidents.length;
 document.querySelector('#countryCount').textContent=new Set(state.incidents.flatMap(x=>[x.from,x.to])).size;
}
function renderNews(){
 document.querySelector('#newsList').innerHTML=news.map(x=>`<div class="feed-row"><span><span class="feed-title">${esc(x[0])}</span><span class="feed-meta">${esc(x[1])}</span></span><span class="feed-meta">${esc(x[2])}</span></div>`).join('');
 document.querySelector('#newsCount').textContent=news.length;
 document.querySelector('#tickerText').textContent=state.updatedAt?`آخر مزامنة: ${new Date(state.updatedAt).toLocaleString('ar')} · ${state.incidents.length} أزواج هجوم موثقة من ${state.source}`:'بانتظار مزامنة مصدر التهديد الحقيقي…';
}
function renderTeams(){document.querySelector('#teams').innerHTML=teams.map(x=>`<div class="team-row"><span><span class="rank">#${x[0]}</span><b>${esc(x[1])}</b><span class="team-meta">CTF ranking</span></span><span class="score">${esc(x[2])}</span></div>`).join('');document.querySelector('#teamCount').textContent=teams.length;}
function renderAll(){renderIncidents();renderNews();renderTeams();}

const CENTERS={US:[39.8,-98.6],CN:[35.9,104.2],NL:[52.1,5.3],DE:[51.2,10.4],BE:[50.8,4.5],FR:[46.2,2.2],GB:[55.4,-3.4],JP:[36.2,138.3],ID:[-2.2,117.4],IN:[22.8,79.0],SG:[1.35,103.8],AU:[-25.3,133.8],CA:[56.1,-106.3],BR:[-10.8,-51.9],RU:[61.5,105.3],PL:[52.1,19.1],IT:[42.8,12.8],ES:[40.3,-3.7],TR:[39.0,35.2],KR:[36.5,127.9],TW:[23.7,121.0],HK:[22.3,114.2],VN:[14.1,108.3],TH:[15.9,101.0],MY:[4.2,101.9],SE:[62.0,15.0],NO:[64.5,11.0],FI:[64.0,26.0],CH:[46.8,8.2],AT:[47.6,14.1],UA:[49.0,31.4],ZA:[-30.6,22.9],EG:[26.8,30.8],AE:[24.3,54.4],SA:[23.9,45.1],IL:[31.0,34.9],AR:[-38.4,-63.6],MX:[23.6,-102.6]};
function initMap(){
 const el=document.querySelector('#worldMap'); if(!el||el.dataset.ready==='1')return; el.dataset.ready='1';
 const map=L.map(el,{zoomControl:false,attributionControl:true,worldCopyJump:true}).setView([25,10],2);
 L.control.zoom({position:'bottomright'}).addTo(map);
 L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:18,attribution:'© OpenStreetMap © CARTO'}).addTo(map);
 state.incidents.forEach(x=>{
  const a=CENTERS[x.fromCode],b=CENTERS[x.toCode]; if(!a||!b)return;
  const color=x.type==='l7'?'#ff5964':'#b28cff';
  const icon=L.divIcon({className:'',html:`<span style="display:block;width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 14px ${color};border:1px solid #fff6"></span>`,iconSize:[10,10]});
  L.marker(a,{icon}).addTo(map).bindPopup(`<b>${esc(x.name)}</b><br>${esc(x.from)} → ${esc(x.to)}<br><small>${esc(x.time||'Last 24h')} · ${esc(x.tag||'L7 attack')}</small>`);
  L.marker(b,{icon}).addTo(map);
  L.polyline([a,b],{color,weight:1.8,opacity:.78,dashArray:'7 8'}).addTo(map);
 });
}

function readExif(data){
 try{const bytes=new Uint8Array(data);if(bytes[0]!==255||bytes[1]!==216)return null;let i=2;while(i+4<bytes.length){if(bytes[i]!==255){i++;continue}const marker=bytes[i+1];i+=2;if(marker===217||marker===218)break;const len=(bytes[i]<<8)|bytes[i+1];if(marker===225&&String.fromCharCode(...bytes.slice(i+2,i+8))==='Exif\\0\\0')return 'EXIF metadata detected';i+=len;}return null}catch{return null}}
async function setupOsint(){
 const input=document.querySelector('#imageInput'),zone=document.querySelector('#dropzone'),result=document.querySelector('#osintResult'),preview=document.querySelector('#preview'),grid=document.querySelector('#exifGrid'),guess=document.querySelector('#locationGuess');
 const handle=async file=>{if(!file||!file.type.startsWith('image/'))return;const url=URL.createObjectURL(file);preview.src=url;result.classList.remove('hidden');const buf=await file.arrayBuffer();const exif=readExif(buf);guess.textContent='لا يوجد GPS مستخرج — نحتاج أدلة أخرى';grid.innerHTML=[['FILE',file.name],['TYPE',file.type],['SIZE',(file.size/1024/1024).toFixed(2)+' MB'],['GPS','غير موجود / غير مستخرج'],['EXIF',exif||'لا توجد بيانات EXIF قابلة للقراءة'],['MODE','LOCAL']].map(x=>`<div><small>${esc(x[0])}</small>${esc(x[1])}</div>`).join('');};
 input.addEventListener('change',e=>handle(e.target.files[0]));['dragenter','dragover'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('drag')}));['dragleave','drop'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove('drag')}));zone.addEventListener('drop',e=>handle(e.dataTransfer.files[0]));
}

document.querySelector('#loginBtn').addEventListener('click',()=>alert('تسجيل Google سيُفعّل عبر OAuth/Firebase أو Supabase بعد إعداد مزود المصادقة. لا نخزن كلمات المرور في GitHub Pages.'));
renderAll();setupOsint();loadFeed();
