// Loaded as a classic script by the existing Unity template.
window.SafetyHomeGameCollection=(()=>{
 let unity,transport,session,key,timer,active=false,first=0,terminal=false,memoryOnly=false;
 const params=()=>new URLSearchParams(location.hash.slice(1));
 const status=s=>unity?.SendMessage('SafetyHome','OnCollectionStatus',s);
 const persist=()=>{try{sessionStorage.setItem(key,JSON.stringify(session));}catch{memoryOnly=true;}};
 const schedule=(delay=5000)=>{clearTimeout(timer);timer=setTimeout(flush,delay);};
 async function attach(instance){unity=instance;const p=params();const room=p.get('room');
  if(p.get('collector')!=='firebase'||!/^[a-f0-9]{48}$/.test(room||''))throw Error('先生から新しい参加リンクを受け取ってください。');
  key='safety-firebase:'+room;try{session=JSON.parse(sessionStorage.getItem(key));}catch{}
  if(!session||!Array.isArray(session.queue))session={queue:[]};
  const module=await import('./firebase-student.js');transport=await module.createTransport(room);
  unity.SendMessage('SafetyHome','OnClassroomSession',JSON.stringify({lesson:transport.lesson,code:transport.code}));
  status(session.queue.length?'pending':'ready');if(session.queue.length)schedule(100);
 }
 function queue(json){if(!session)return;const note=JSON.parse(json);const i=session.queue.findIndex(n=>n.id===note.id);if(i<0)session.queue.push(note);else session.queue[i]=note;persist();status(terminal?'error':memoryOnly?'pending-memory':'pending');first ||= Date.now();if(!terminal)schedule(Math.max(0,Math.min(5000,30000-(Date.now()-first))));}
 async function flush(){if(terminal||active||!transport||!session.queue.length)return;if(!navigator.onLine){schedule(15000);return;}active=true;const batch=session.queue.slice();
  try{await transport.save(batch);session.queue=session.queue.filter(n=>!batch.some(sent=>sent.id===n.id&&sent.revision===n.revision));persist();first=0;status(session.queue.length?'pending':'sent');if(session.queue.length)schedule();}
  catch(e){terminal=['permission-denied','unauthenticated','resource-exhausted','limit-exceeded'].includes(e.code);status(terminal?'error':memoryOnly?'pending-memory':'pending');if(!terminal)schedule(15000);}finally{active=false;}
 }
 window.addEventListener('online',()=>schedule(100));window.addEventListener('beforeunload',e=>{if(session?.queue.length){e.preventDefault();e.returnValue='';}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();});
 return {isLesson:()=>params().has('room')||params().has('collector'),attach,queue};
})();
