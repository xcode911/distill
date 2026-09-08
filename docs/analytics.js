(()=>{
'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
function calculateFlag(){const n=Math.max(1,Math.min(100,Number($('#challengeCount')?.value)||1));const level=$('#challengeLevel')?.value||'medium';const mins={easy:25,medium:55,hard:110,mixed:70}[level];const total=n*mins,h=Math.floor(total/60),m=total%60;if($('#flagTime'))$('#flagTime').textContent=`${h} ساعة ${m} دقيقة`;if($('#flagNote'))$('#flagNote').textContent=`تقدير تدريبي: ${n} تحديات × ${mins} دقيقة تقريبًا. ليس توقعًا مضمونًا.`;if($('#aChallenges'))$('#aChallenges').textContent=n;}
async function requestJson(url,timeout=9000){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);try{const r=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store',signal:ctl.signal});if(!r.ok)throw new Error(`HTTP ${r.status}`);const text=await r.text();if(!text.trim())throw new Error('empty');try{return JSON.parse(text)}catch{throw new Error('not-json')}}finally{clearTimeout(timer)}}
async function fetchJson(url){
 const encoded=encodeURIComponent(url);
 const candidates=[
  url,
  `https://api.allorigins.win/raw?url=${encoded}`,
  `https://api.codetabs.com/v1/proxy?quest=${encoded}`,
  `https://corsproxy.io/?url=${encoded}`,
  `https://r.jina.ai/${url}`
 ];
 let lastErr;
 for(const endpoint of candidates){try{const data=await requestJson(endpoint);if(data&&typeof data==='object')return data;lastErr=new Error('invalid response')}catch(e){lastErr=e}}
 throw lastErr||new Error('all endpoints failed');
}
async function loadTeam(){
 const input=String($('#teamId')?.value||'').trim(),box=$('#teamStats');if(!box)return;
 if(!/^\d+$/.test(input)){box.innerHTML='<div class="incident empty">أدخل Team ID رقميًا من رابط فريق CTFtime، مثل: 1005</div>';return}
 box.innerHTML='<div class="incident empty">جارٍ جلب بيانات CTFtime…</div>';
 const profile=`https://ctftime.org/team/${encodeURIComponent(input)}/`,url=`https://ctftime.org/api/v1/teams/${encodeURIComponent(input)}/`;
 try{
  const t=await fetchJson(url);if(!t||!t.id)throw new Error('team not found');
  box.innerHTML=`<div class="team-stat-grid"><div><small>الفريق</small><b>${esc(t.name||'—')}</b></div><div><small>التقييم</small><b>${esc(t.rating??'—')}</b></div><div><small>الدولة</small><b>${esc(t.country||'—')}</b></div><div><small>المعرف</small><b>${esc(t.id||input)}</b></div></div><div class="feed-meta">المصدر: CTFtime API · <a href="${profile}" target="_blank" rel="noopener">فتح الملف الشخصي ↗</a></div>`;
  if($('#teamCount'))$('#teamCount').textContent='1';
 }catch(e){
  box.innerHTML=`<div class="incident empty"><div class="incident-title">تعذر قراءة CTFtime حاليًا</div><div class="incident-meta"><span>CTFtime / NETWORK</span><span>${esc(e?.message||'request failed')}</span></div><div class="feed-meta" style="margin-top:10px">يمكن فتح صفحة الفريق مباشرة: <a href="${profile}" target="_blank" rel="noopener">CTFtime Team ${esc(input)} ↗</a></div></div>`;
 }
}
async function analyzeAI(){const file=window.__ctfPulseFile;if(!file)return;const status=$('#aiStatus'),box=$('#aiResult');const endpoint=window.CTFPULSE_AI_ENDPOINT||'/api/deepseek-vision';status.textContent='AI ANALYZING…';box.classList.remove('hidden');box.textContent='جارٍ تحليل الصورة…';try{const bytes=new Uint8Array(await file.arrayBuffer());let bin='';for(let i=0;i<bytes.length;i+=32768)bin+=String.fromCharCode(...bytes.subarray(i,i+32768));const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mime:file.type,name:file.name,imageBase64:btoa(bin),prompt:'حلل الصورة كخبير OSINT للـCTF. صف الشارع والمباني واللافتات واللغة والطريق وإشارات المرور والمعالم والطقس. اقترح المناطق المحتملة مع نسبة ثقة واذكر الأدلة والشكوك. لا تحدد هوية أشخاص ولا تدّعي الدقة بدون دليل.'})});if(!r.ok)throw 0;const d=await r.json();box.innerHTML=`<h3>🧠 DeepSeek Vision</h3><p>${esc(d.description||d.analysis||'لا يوجد وصف.')}</p><p><b>المكان المحتمل:</b> ${esc(d.locationGuess||'غير محدد')}</p><p><b>الثقة:</b> ${esc(d.confidence||'غير محددة')}</p><p class="ai-evidence">${esc(d.evidence||'الموقع البصري تقديري ويحتاج تحققًا مستقلًا.')}</p>`;status.textContent='AI READY';}catch(e){box.textContent='خادم DeepSeek غير مفعّل بعد. يلزم نشر Backend يحوي المفتاح كـSecret.';status.textContent='AI BACKEND PENDING';}}
function bind(){const img=$('#imageInput'),ai=$('#aiAnalyze');if(img)img.addEventListener('change',e=>{window.__ctfPulseFile=e.target.files?.[0]||null;if(ai)ai.disabled=!window.__ctfPulseFile});const zone=$('#dropzone');zone?.addEventListener('drop',e=>{window.__ctfPulseFile=e.dataTransfer.files?.[0]||null;if(ai)ai.disabled=!window.__ctfPulseFile});ai?.addEventListener('click',analyzeAI);$('#calcFlag')?.addEventListener('click',calculateFlag);$('#challengeCount')?.addEventListener('input',calculateFlag);$('#challengeLevel')?.addEventListener('change',calculateFlag);$('#loadTeam')?.addEventListener('click',loadTeam);calculateFlag();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();