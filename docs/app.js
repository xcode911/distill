const FALLBACK={incidents:[],updatedAt:null,source:'Cloudflare Radar'};
const state={...FALLBACK,filter:'all',map:null,layers:[]};
const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));

async function loadFeed(){
 try{
  const r=await fetch('data/incidents.json?ts='+Date.now(),{cache:'no-store'});
  if(!r.ok) throw new Error('feed unavailable');
  const data=await r.json();
  state.incidents=Array.isArray(data.incidents)?data.incidents:[];
  state.updatedAt=data.updatedAt||null;
  state.source=data.source||'Cloudflare Radar';
  document.querySelector('#feedStatus').textContent=state.incidents.length?'REAL TELEMETRY':'FEED WAITING';
 }catch(e){
  state.incidents=[];state.updatedAt=null;
  document.querySelector('#feedStatus').textContent='FEED OFFLINE';
 }
 renderAll(); drawMap();
}

async function loadKEV(){
 const box=document.querySelector('#newsList');
 try{
  const r=await fetch('data/kev.json?ts='+Date.now(),{cache:'no-store'});
  if(!r.ok) throw new Error('kev unavailable');
  const data=await r.json();
  const rows=Array.isArray(data.vulnerabilities)?data.vulnerabilities:[];
  box.innerHTML=rows.slice(0,10).map(v=>`<div class="feed-row"><span><span class="feed-title">${esc(v.cveID||'CVE')}</span><span class="feed-meta">${esc(v.vulnerabilityName||'Known Exploited Vulnerability')}</span></span><span class="feed-meta">${esc(v.dateAdded||'')}</span></div>`).join('')||'<div class="incident empty">لا توجد سجلات KEV محمّلة.</div>';
  document.querySelector('#newsCount').textContent=rows.length;
 }catch(e){
  box.innerHTML='<div class="incident empty"><div class="incident-title">CISA KEV بانتظار المزامنة</div><div class="incident-meta"><span>REAL GOVERNMENT FEED</span><span>NO DEMO DATA</span></div></div>';
  document.querySelector('#newsCount').textContent='—';
 }
}

function filteredIncidents(){
 if(state.filter==='all') return state.incidents;
 return state.incidents.filter(x=>{
  const t=String(x.type||'').toLowerCase();
  const tag=String(x.tag||'').toLowerCase();
  if(state.filter==='l7') return t==='l7'||tag.includes('l7');
  if(state.filter==='ddos') return t==='ddos'||tag.includes('ddos');
  if(state.filter==='network') return t==='network'||t==='l3'||tag.includes('network');
  return true;
 });
}
function renderIncidents(){
 const rows=filteredIncidents(),box=document.querySelector('#incidents');
 if(!rows.length){box.innerHTML='<div class="incident empty"><div class="incident-title">لا توجد بيانات موثقة لهذا الفلتر</div><div class="incident-meta"><span>REAL DATA ONLY</span><span>—</span></div></div>'}
 else box.innerHTML=rows.map(x=>`<div class="incident"><div class="incident-title">${esc(x.name||'Public threat telemetry')}</div><div class="incident-meta"><span>${esc(x.from)} → ${esc(x.to)}</span><span class="tag ${esc(x.type||'scan')}">${esc(x.tag||'PUBLIC')}</span></div><div class="incident-meta"><span>${esc(x.time||'آخر 24 ساعة')}</span><span>RADAR</span></div><div class="incident-meta"><span>${x.share!=null?esc(x.share)+'%':''}</span><span>MITIGATED SHARE</span></div></div>`).join('');
 document.querySelector('#incidentCount').textContent=state.incidents.length;
 document.querySelector('#countryCount').textContent=new Set(state.incidents.flatMap(x=>[x.fromCode,x.toCode].filter(Boolean))).size;
}
function renderTicker(){document.querySelector('#tickerText').textContent=state.updatedAt?`آخر مزامنة: ${new Date(state.updatedAt).toLocaleString('ar')} · ${state.incidents.length} أزواج هجوم من ${state.source}`:'بانتظار مزامنة مصدر التهديد الحقيقي…'}
function renderAll(){renderIncidents();renderTicker();}

const CENTERS={US:[39.8,-98.6],CN:[35.9,104.2],NL:[52.1,5.3],DE:[51.2,10.4],BE:[50.8,4.5],FR:[46.2,2.2],GB:[55.4,-3.4],JP:[36.2,138.3],ID:[-2.2,117.4],IN:[22.8,79.0],SG:[1.35,103.8],AU:[-25.3,133.8],CA:[56.1,-106.3],BR:[-10.8,-51.9],RU:[61.5,105.3],PL:[52.1,19.1],IT:[42.8,12.8],ES:[40.3,-3.7],TR:[39.0,35.2],KR:[36.5,127.9],TW:[23.7,121.0],HK:[22.3,114.2],VN:[14.1,108.3],TH:[15.9,101.0],MY:[4.2,101.9],SE:[62.0,15.0],NO:[64.5,11.0],FI:[64.0,26.0],CH:[46.8,8.2],AT:[47.6,14.1],UA:[49.0,31.4],ZA:[-30.6,22.9],EG:[26.8,30.8],AE:[24.3,54.4],SA:[23.9,45.1],IL:[31.0,34.9],AR:[-38.4,-63.6],MX:[23.6,-102.6]};
function drawMap(){
 const el=document.querySelector('#worldMap'); if(!el||!window.L)return;
 if(!state.map){state.map=L.map(el,{zoomControl:false,attributionControl:true,worldCopyJump:true}).setView([25,10],2);L.control.zoom({position:'bottomright'}).addTo(state.map);L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:18,attribution:'© OpenStreetMap © CARTO'}).addTo(state.map)}
 state.layers.forEach(l=>state.map.removeLayer(l));state.layers=[];
 filteredIncidents().forEach(x=>{
  const a=CENTERS[x.fromCode],b=CENTERS[x.toCode];if(!a||!b)return;
  const color=String(x.type).toLowerCase()==='l7'||String(x.tag).toLowerCase().includes('ddos')?'#ff5964':'#b28cff';
  const icon=L.divIcon({className:'',html:`<span style="display:block;width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 14px ${color};border:1px solid #fff6"></span>`,iconSize:[10,10]});
  const from=L.marker(a,{icon}).addTo(state.map).bindPopup(`<b>${esc(x.name||'Threat telemetry')}</b><br>${esc(x.from)} → ${esc(x.to)}<br><small>${esc(x.time||'Last 24h')} · ${esc(x.tag||'Public data')}</small>`);
  const to=L.marker(b,{icon}).addTo(state.map);
  const line=L.polyline([a,b],{color,weight:2,opacity:.82,dashArray:'8 10'}).addTo(state.map);
  state.layers.push(from,to,line);
  let offset=0;const timer=setInterval(()=>{if(!line._map){clearInterval(timer);return}offset=(offset+1)%18;line.setStyle({dashOffset:String(offset)})},80);
 });
 setTimeout(()=>state.map.invalidateSize(),100);
}

function setupFilters(){document.querySelectorAll('.filter[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter[data-filter]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');state.filter=btn.dataset.filter;renderIncidents();drawMap()}));document.querySelector('#refreshFeed')?.addEventListener('click',loadFeed)}

function readExif(data){
 const b=new Uint8Array(data);if(b[0]!==255||b[1]!==216)return null;let i=2;
 while(i+4<b.length){if(b[i]!==255){i++;continue}const marker=b[i+1];i+=2;if(marker===217||marker===218)break;const len=(b[i]<<8)|b[i+1];if(marker===225&&String.fromCharCode(...b.slice(i+2,i+8))==='Exif\0\0'){const start=i+8;const view=new DataView(data);const little=view.getUint16(start)===0x4949;const u16=o=>view.getUint16(o,little),u32=o=>view.getUint32(o,little);const ifd=start+u32(start+4),count=u16(ifd);let gpsPtr=0;for(let n=0;n<count;n++){const p=ifd+2+n*12;if(u16(p)===0x8825)gpsPtr=u32(p+8)}if(!gpsPtr)return {exif:true};const gps=start+gpsPtr,gcount=u16(gps),tags={};for(let n=0;n<gcount;n++){const p=gps+2+n*12;tags[u16(p)]={type:u16(p+2),count:u32(p+4),value:p+8}}const readRatios=t=>{const p=t.count<=2?t.value:start+u32(t.value);return Array.from({length:3},(_,k)=>{const q=p+k*8;return u32(q)/u32(q+4)})};const lat=tags[2],latRef=tags[1],lon=tags[4],lonRef=tags[3];if(lat&&lon){const la=readRatios(lat),lo=readRatios(lon);let latitude=la[0]+la[1]/60+la[2]/3600,longitude=lo[0]+lo[1]/60+lo[2]/3600;const ref=String.fromCharCode(view.getUint8(latRef.value));const ref2=String.fromCharCode(view.getUint8(lonRef.value));if(ref==='S')latitude=-latitude;if(ref2==='W')longitude=-longitude;return {exif:true,latitude,longitude,gps:true}}return {exif:true};}i+=len;}return null;
}
async function setupOsint(){
 const input=document.querySelector('#imageInput'),zone=document.querySelector('#dropzone'),result=document.querySelector('#osintResult'),preview=document.querySelector('#preview'),grid=document.querySelector('#exifGrid'),guess=document.querySelector('#locationGuess');
 const handle=async file=>{if(!file||!file.type.startsWith('image/'))return;const url=URL.createObjectURL(file);preview.src=url;result.classList.remove('hidden');const buf=await file.arrayBuffer();const exif=readExif(buf);let gps='غير موجود / غير مستخرج';if(exif?.gps){gps=`${exif.latitude.toFixed(6)}, ${exif.longitude.toFixed(6)}`;guess.textContent='GPS مستخرج من EXIF — إحداثيات تحتاج تحقق';}else guess.textContent='لا يوجد GPS في EXIF — لا نخمن الموقع';grid.innerHTML=[['FILE',file.name],['TYPE',file.type],['SIZE',(file.size/1024/1024).toFixed(2)+' MB'],['GPS',gps],['EXIF',exif?'موجود':'غير قابل للقراءة'],['MODE','LOCAL / NO UPLOAD']].map(x=>`<div><small>${esc(x[0])}</small>${esc(x[1])}</div>`).join('');};
 input.addEventListener('change',e=>handle(e.target.files[0]));['dragenter','dragover'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('drag')}));['dragleave','drop'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove('drag')}));zone.addEventListener('drop',e=>handle(e.dataTransfer.files[0]));
}

document.querySelector('#loginBtn').addEventListener('click',()=>alert('Google Login يحتاج ربط مزود OAuth حقيقي مثل Firebase أو Supabase. لا نخزن كلمات المرور داخل GitHub Pages.'));
setupFilters();setupOsint();loadFeed();loadKEV();
