import {connect,studentLogin,dbSdk as f} from './firebase-runtime.js';
export async function createTransport(room){
 const {auth,db}=await connect('student');const user=await studentLogin(auth);
 const ref=f.doc(db,'lessons',room), snapshot=await f.getDoc(ref);
 if(!snapshot.exists())throw Error('授業が見つかりません。先生のQRを読み取り直してください。');
 const lesson=snapshot.data();if(lesson.closed||Date.now()>lesson.expires)throw Error('授業の受付が終了しています。');
 const member=f.doc(db,'lessons',room,'answers',user.uid);
 return {lesson:lesson.lesson,code:lesson.code,async save(notes){
  await f.runTransaction(db,async tx=>{
   const previous=await tx.get(member);let saved=[];
   if(previous.exists()){try{saved=JSON.parse(previous.data().payload);}catch{throw Error('保存済みの回答を読み込めません。');}}
   const merged=new Map(saved.map(n=>[n.id,n]));
   for(const note of notes){if(!merged.has(note.id)||merged.get(note.id).revision<note.revision)merged.set(note.id,note);}
   const payload=JSON.stringify([...merged.values()]);if(merged.size>200||new TextEncoder().encode(payload).length>150000){const e=Error('記録数の上限です。先生に知らせてください。');e.code='limit-exceeded';throw e;}
   tx.set(member,{payload,updated:f.serverTimestamp()});
  });
 }};
}
