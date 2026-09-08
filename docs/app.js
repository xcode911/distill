const incidents=[
 {id:1,type:'ddos',name:'نشاط DDoS منشور',from:'هولندا',to:'ألمانيا',a:[52.1,5.3],b:[51.1,10.4],time:'اليوم 11:42',tag:'DDoS'},
 {id:2,type:'scan',name:'حركة فحص منشورة',from:'الولايات المتحدة',to:'فرنسا',a:[38.9,-77],b:[46.2,2.2],time:'اليوم 10:18',tag:'فحص'},
 {id:3,type:'hack',name:'حادث اختراق مُعلن',from:'سنغافورة',to:'اليابان',a:[1.35,103.8],b:[35.6,139.7],time:'اليوم 08:51',tag:'متسللون'},
 {id:4,type:'scan',name:'تقارير فحص عامة',from:'بولندا',to:'التشيك',a:[52.2,21],b:[49.8,15.5],time:'اليوم 07:30',tag:'فحص'}
];
const news=[
 ['Cybersecurity briefing','ملخص جديد من المصادر العامة','اليوم'],
 ['Threat watch','حادث أمني منشور قيد المتابعة','اليوم'],
 ['CTF intelligence','فعاليات وتحديات CTF القادمة','هذا الأسبوع'],
 ['Weekly attacks','أبرز الحوادث المنشورة خلال الأسبوع','هذا الأسبوع']
];
const teams=[['1','TeamH4C','—'],['2','H-T8','—'],['3','W4llz','—'],['4','RubiyaLab Expeditions','—'],['5','tjcsc','—']];
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function renderIncidents(){
 document.querySelector('#incidents').innerHTML=incidents.map(x=>`<div class="incident"><div class="incident-title">${esc(x.name)}</div><div class="incident-meta"><span>${esc(x.from)} → ${esc(x.to)}</span><span class="tag ${x.type}">${esc(x.tag)}</span></div><div class="incident-meta"><span>${esc(x.time)}</span><span>PUBLIC</span></div></div>`).join('');
 document.querySelector('#incidentCount').textContent=incidents.length; document.querySelector('#countryCount').textContent=new Set(incidents.flatMap(x=>[x.from,x.to])).size;
}
function renderNews(){document.querySelector('#newsList').innerHTML=news.map(x=>`<div class="feed-row"><span><span class="feed-title">${esc(x[0])}</span><span class="feed-meta">${esc(x[1])}</span></span><span class="feed-meta">${esc(x[2])}</span></div>`).join('');document.querySelector('#newsCount').textContent=news.length;document.querySelector('#tickerText').textContent='لوحة اليوم: '+incidents.length+' تقارير عامة · '+news.length+' عناصر إخبارية · آخر مزامنة محلية';}
function renderTeams(){document.querySelector('#teams').innerHTML=teams.map(x=>`<div class="team-row"><span><span class="rank">#${x[0]}</span><b>${esc(x[1])}</b><span class="team-meta">CTF ranking</span></span><span class="score">${esc(x[2])}</span></div>`).join('');document.querySelector('#teamCount').textContent=teams.length;}

function initMap(){
 const map=L.map('worldMap',{zoomControl:false,attributionControl:true,worldCopyJump:true}).setView([25,10],2);
 L.control.zoom({position:'bottomright'}).addTo(map);
 L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:18,attribution:'© OpenStreetMap © CARTO'}).addTo(map);
 incidents.forEach(x=>{
   const color=x.type==='hack'?'#ff5964':x.type==='ddos'?'#b28cff':'#ffc857';
   const icon=L.divIcon({className:'',html:`<span style="display:block;width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 14px ${color};border:1px solid #fff6"></span>`,iconSize:[10,10]});
   L.marker(x.a,{icon}).addTo(map).bindPopup(`<b>${esc(x.name)}</b><br>${esc(x.from)} → ${esc(x.to)}<br><small>${esc(x.time)} · ${esc(x.tag)}</small>`);
   L.marker(x.b,{icon}).addTo(map);
   L.polyline([x.a,x.b],{color,weight:1.5,opacity:.72,dashArray:'7 8'}).addTo(map);
 });
}

function readExif(data){
 const bytes=new Uint8Array(data); if(bytes[0]!==255||bytes[1]!==216)return null;
 let i=2; while(i<bytes.length){if(bytes[i]!==255){i++;continue}const marker=bytes[i+1];i+=2;if(marker===217||marker===218)break;const len=(bytes[i]<<8)|bytes[i+1];if(marker===225&&String.fromCharCode(...bytes.slice(i+2,i+8))==='Exif\0\0'){return 'EXIF metadata detected';}i+=len;}
 return null;
}
function setupOsint(){
 const input=document.querySelector('#imageInput'), zone=document.querySelector('#dropzone'), result=document.querySelector('#osintResult'), preview=document.querySelector('#preview'), grid=document.querySelector('#exifGrid'), guess=document.querySelector('#locationGuess');
 const handle=file=>{if(!file||!file.type.startsWith('image/'))return;const url=URL.createObjectURL(file);preview.src=url;result.classList.remove('hidden');const exif=readExif(null);guess.textContent='الموقع غير معروف — ابحث عن أدلة مرئية';grid.innerHTML=[['FILE',file.name],['TYPE',file.type],['SIZE',(file.size/1024/1024).toFixed(2)+' MB'],['GPS','لم يتم استخراج GPS'],['EXIF',exif||'غير مقروء في النسخة الحالية'],['MODE','LOCAL']].map(x=>`<div><small>${esc(x[0])}</small>${esc(x[1])}</div>`).join('');};
 input.addEventListener('change',e=>handle(e.target.files[0]));['dragenter','dragover'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('drag')}));['dragleave','drop'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove('drag')}));zone.addEventListener('drop',e=>handle(e.dataTransfer.files[0]));
}
document.querySelector('#loginBtn').addEventListener('click',()=>alert('تسجيل الدخول الآمن سيحتاج OAuth حقيقي من Google/Firebase قبل تفعيله. لن نخزن كلمات مرور داخل الموقع.'));
renderIncidents();renderNews();renderTeams();setupOsint();if(window.L)initMap();
