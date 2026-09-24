/* Write-only classroom collection. No response is marked sent without an ACK. */
window.SafetyHomeCollection = (() => {
  const storageKey='safety-home-outbox-v1';
  let config, unity, queue=[], timer, active, memoryOnly=false;
  const currentJobs=()=>queue.filter(x=>x.endpoint===config?.endpoint && x.classKey===config?.classKey);
  const sendStatus=state=>unity?.SendMessage('SafetyHome','OnCollectionStatus',state);
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(queue));}catch{memoryOnly=true;}}
  function pendingStatus(){sendStatus(memoryOnly?'pending-memory':'pending');}
  function schedule(delay=2500){clearTimeout(timer);timer=setTimeout(flush,delay);}
  function queueNote(json){
    if(window.SafetyHomeGameCollection?.isLesson())return window.SafetyHomeGameCollection.queue(json);
    if(!config?.endpoint)return;
    const note=JSON.parse(json);
    const job={...note,lesson:config.lesson,endpoint:config.endpoint,classKey:config.classKey,queuedAt:Date.now()};
    const index=queue.findIndex(x=>x.id===job.id);
    if(index<0)queue.push(job);else queue[index]=job;
    persist();pendingStatus();schedule();
  }
  function cleanup(){if(!active)return;clearTimeout(active.timeout);active.form.remove();active.frame.remove();active=null;}
  function flush(){
    if(active || !queue.length || !config?.endpoint)return;
    const job=queue.find(x=>x.endpoint===config.endpoint && x.classKey===config.classKey);
    if(!job)return;
    if(!navigator.onLine){pendingStatus();schedule(15000);return;}
    const nonce=crypto.randomUUID();
    const frame=document.createElement('iframe');frame.name='receipt-'+nonce;frame.hidden=true;frame.title='回答の送信';
    const form=document.createElement('form');form.method='POST';form.action=job.endpoint;form.target=frame.name;form.hidden=true;
    const field=document.createElement('input');field.name='payload';field.value=JSON.stringify({...job,nonce,origin:location.origin});form.appendChild(field);
    document.body.append(frame,form);
    active={job,nonce,frame,form,timeout:setTimeout(()=>{cleanup();pendingStatus();schedule(15000);},20000)};
    pendingStatus();form.submit();
  }
  window.addEventListener('message',event=>{
    if(!active || !/^https:\/\/(?:script|[a-z0-9-]+-script)\.googleusercontent\.com$/.test(event.origin))return;
    const ack=event.data;
    if(!ack || ack.type!=='safety-home-receipt' || ack.nonce!==active.nonce || ack.id!==active.job.id || ack.revision!==active.job.revision)return;
    if(ack.ok){
      queue=queue.filter(x=>!(x.id===ack.id && x.revision===ack.revision));persist();cleanup();
      if(currentJobs().length){pendingStatus();schedule(100);}else sendStatus('sent');
    }else{cleanup();sendStatus('error');schedule(30000);}
  });
  window.addEventListener('online',()=>schedule(100));
  window.addEventListener('beforeunload',event=>{if(queue.length){event.preventDefault();event.returnValue='';}});
  async function attach(instance){
    if(window.SafetyHomeGameCollection?.isLesson())return window.SafetyHomeGameCollection.attach(instance);
    unity=instance;
    try{
      config=window.SafetyHomeSettings.decode(location.hash);
      if(!config)config=await (await fetch('collection-config.json',{cache:'no-store',signal:AbortSignal.timeout(8000)})).json();
      if(!config.endpoint)return;
      config=window.SafetyHomeSettings.validate(config);
      try{queue=JSON.parse(localStorage.getItem(storageKey)||'[]');if(!Array.isArray(queue))throw new Error('invalid outbox');}catch{queue=[];memoryOnly=true;}
      unity.SendMessage('SafetyHome','OnCollectionReady',config.lesson);
      if(currentJobs().length){pendingStatus();schedule(1000);}else sendStatus('ready');
    }catch{sendStatus('unavailable');}
  }
  return {attach,queue:queueNote};
})();
