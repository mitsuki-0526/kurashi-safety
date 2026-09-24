(function(root){
  function validate(value){
    if(!value || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(value.endpoint||''))throw Error('回答受付用のURL（末尾が /exec）を入力してください。');
    if(!/^[a-zA-Z0-9_-]{16,100}$/.test(value.classKey||''))throw Error('授業キーを確認してください。');
    if(typeof value.lesson!=='string' || !value.lesson.trim() || value.lesson.length>80)throw Error('授業名を80文字以内で入力してください。');
    return {endpoint:value.endpoint,classKey:value.classKey,lesson:value.lesson.trim()};
  }
  function encode(value){return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(validate(value))))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function decode(hash){
    const value=new URLSearchParams(hash.replace(/^#/,'' )).get('class');
    if(value===null)return null;
    if(value.length>2400)throw Error('配布URLが長すぎます。');
    const binary=atob(value.replace(/-/g,'+').replace(/_/g,'/'));
    return validate(JSON.parse(new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0)))));
  }
  function spreadsheetId(url){
    const match=/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:\/|$|[?#])/.exec(url.trim());
    if(!match)throw Error('GoogleスプレッドシートのURLを入力してください。');return match[1];
  }
  const api={validate,encode,decode,spreadsheetId};
  if(typeof module==='object')module.exports=api;else root.SafetyHomeSettings=api;
})(typeof window==='undefined'?{}:window);
