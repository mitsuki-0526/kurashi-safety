// Browser text controls retain the operating system's Japanese IME and selection behavior.
(() => {
  const fields=new Map();
  let instance,canvas,root,scaleX=1,scaleY=1,offsetX=0,offsetY=0;
  function attach(unity){
    instance=unity;canvas=document.getElementById('unity-canvas');
    root=document.createElement('div');root.id='native-fields';
    document.body.appendChild(root);
  }
  function send(field){
    if(field.composing || field.lastSent===field.input.value)return;
    field.lastSent=field.input.value;
    instance.SendMessage('SafetyHome','OnNativeEdit',JSON.stringify({id:field.id,value:field.input.value}));
  }
  function begin(width,height){
    if(!root)return;
    const rect=canvas.getBoundingClientRect();
    scaleX=rect.width/width;scaleY=rect.height/height;offsetX=rect.left;offsetY=rect.top;
    for(const field of fields.values())field.seen=false;
  }
  function show(data){
    if(!root)return;
    let field=fields.get(data.id);
    if(!field){
      const wrapper=document.createElement('div'),input=document.createElement(data.multiline?'textarea':'input');
      wrapper.className='native-field-clip';input.className='native-field';
      if(!data.multiline)input.type='text';
      input.value=data.value;input.maxLength=data.maxLength;input.setAttribute('aria-label',data.label);
      input.spellcheck=false;input.autocomplete='off';
      if(data.id==='number')input.inputMode='numeric';
      field={id:data.id,wrapper,input,seen:true,composing:false,lastSent:data.value,modelValue:data.value};
      input.addEventListener('compositionstart',()=>{field.composing=true;});
      input.addEventListener('compositionend',()=>{field.composing=false;send(field);});
      input.addEventListener('input',event=>{if(!event.isComposing)send(field);});
      input.addEventListener('blur',()=>{field.composing=false;send(field);});
      // Do not preventDefault: Enter/Space/arrows belong to the IME and text editor here.
      for(const type of ['keydown','keyup','keypress'])input.addEventListener(type,event=>event.stopPropagation());
      wrapper.appendChild(input);root.appendChild(wrapper);fields.set(data.id,field);
    }
    field.seen=true;
    // Unity repaints continuously. Never replace the text/caret during conversion or typing.
    if(data.value!==field.modelValue){
      field.modelValue=data.value;
      if(!field.composing && document.activeElement!==field.input){field.input.value=data.value;field.lastSent=data.value;}
    }
    const left=Math.max(data.x,data.clipX),top=Math.max(data.y,data.clipY);
    const right=Math.min(data.x+data.width,data.clipX+data.clipWidth),bottom=Math.min(data.y+data.height,data.clipY+data.clipHeight);
    Object.assign(field.wrapper.style,{left:(offsetX+left*scaleX)+'px',top:(offsetY+top*scaleY)+'px',width:Math.max(0,right-left)*scaleX+'px',height:Math.max(0,bottom-top)*scaleY+'px'});
    Object.assign(field.input.style,{left:(data.x-left)*scaleX+'px',top:(data.y-top)*scaleY+'px',width:data.width*scaleX+'px',height:data.height*scaleY+'px',fontSize:20*scaleY+'px'});
  }
  function end(){
    for(const [id,field] of fields){
      if(field.seen)continue;
      field.composing=false;send(field);field.wrapper.remove();fields.delete(id);
    }
  }
  window.SafetyHomeFields={attach,begin,show,end};
})();
