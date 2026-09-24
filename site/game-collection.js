/* GitHub Pages -> HTTPS collector. Only a matching server receipt marks a note sent. */
window.SafetyHomeGameCollection=(()=>{
 const allowed='https://safety-home-connection-check.proud-bow-6894.chatgpt.site';
 let unity,config,session,key,timer,active=false,terminal=false,memoryOnly=false;
 const params=()=>new URLSearchParams(location.hash.slice(1));
 const isLesson=()=>params().has('room')||params().has('collector');
 const status=s=>unity?.SendMessage('SafetyHome','OnCollectionStatus',s);
 function persist(){try{sessionStorage.setItem(key,JSON.stringify(session));}catch{memoryOnly=true;}}
 const pending=()=>status(memoryOnly?'pending-memory':'pending');
 const schedule=(ms=1500)=>{clearTimeout(timer);if(!terminal)timer=setTimeout(flush,ms);};
 async function api(action,body){const r=await fetch(config.collector+'/api/game/rooms/'+config.room+'/'+action,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.token},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});const d=await r.json();if(!r.ok){const e=Error(d.error||'回答を送信できません。');e.permanent=[400,401,403,404,409,410].includes(r.status);throw e;}return d;}
 async function attach(instance){
  unity=instance;const p=params();config={room:p.get('room'),collector:p.get('collector')};
  const local=location.origin==='http://127.0.0.1:4173'&&config.collector==='http://127.0.0.1:4181';
  if(!/^[a-f0-9]{48}$/.test(config.room||'')||(!local&&config.collector!==allowed))throw Error('授業の参加リンクを確認してください。');
  key='safety-home-game:'+config.collector+':'+config.room;
  try{session=JSON.parse(sessionStorage.getItem(key));}catch{memoryOnly=true;}
  if(!session||!/^[a-f0-9]{48}$/.test(session.token)||!Array.isArray(session.queue))session={token:Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join(''),queue:[]};
  persist();const joined=await api('join',{});
  unity.SendMessage('SafetyHome','OnClassroomSession',JSON.stringify({lesson:joined.lesson,code:joined.code}));
  if(session.queue.length){pending();schedule(100);}else status('ready');
 }
 function queue(json){if(!session)return;const note=JSON.parse(json);const index=session.queue.findIndex(n=>n.id===note.id);if(index<0)session.queue.push(note);else session.queue[index]=note;persist();pending();schedule();}
 async function flush(){if(active||terminal||!session?.queue.length)return;if(!navigator.onLine){pending();schedule(15000);return;}active=true;const note=session.queue[0];try{const ack=await api('notes',note);if(!ack.ok||ack.id!==note.id||!Number.isSafeInteger(ack.revision)||ack.revision<note.revision)throw Error('保存確認が一致しません。');session.queue=session.queue.filter(n=>n.id!==note.id||n.revision!==note.revision);persist();if(session.queue.length){pending();schedule(100);}else status('sent');}catch(e){if(e.permanent){terminal=true;status('error');}else{pending();schedule(15000);}}finally{active=false;}}
 window.addEventListener('online',()=>schedule(100));
 window.addEventListener('beforeunload',e=>{if(session?.queue.length){e.preventDefault();e.returnValue='';}});
 return {isLesson,attach,queue};
})();
