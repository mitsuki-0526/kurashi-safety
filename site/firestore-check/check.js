import { firebaseConfig } from './config.js';
const el = id => document.getElementById(id);
const room = new URLSearchParams(location.hash.slice(1)).get('room');
let stopListening = () => {}, timer;
function status(text) { el('status').textContent = text; }
function stop() { stopListening(); clearTimeout(timer); el('stop').hidden = true; }
function error(e) { status(`接続できませんでした。\n${e.code || e.name || 'Error'}: ${e.message || e}\nこの表示を先生に伝えてください。`); }
window.addEventListener('pagehide', stop);
el('stop').onclick = () => { stop(); status('受信を停止しました。再開するには新しいテストを始めてください。'); };
el('copy').onclick = async () => { try { await navigator.clipboard.writeText(el('link').value); el('copy').textContent = 'コピーしました'; } catch { el('link').select(); status('リンクを選択しました。コピーして生徒端末へ渡してください。'); } };
async function boot() {
  if (!firebaseConfig.apiKey || !firebaseConfig.appId) { status('Firebaseの初期設定待ちです。まだ送信テストはできません。'); return; }
  if (room !== null && !/^[a-f0-9]{32}$/.test(room)) throw new Error('テストリンクが正しくありません。');
  status('Firebaseへ接続しています…');
  const sdk = 'https://www.gstatic.com/firebasejs/10.9.0/';
  const [appSdk, authSdk, dbSdk] = await Promise.all([import(sdk+'firebase-app.js'), import(sdk+'firebase-auth.js'), import(sdk+'firebase-firestore.js')]);
  const app = appSdk.initializeApp(firebaseConfig);
  const auth = authSdk.getAuth(app);
  await authSdk.setPersistence(auth, authSdk.browserSessionPersistence);
  const db = dbSdk.getFirestore(app);
  el('start').textContent = room ? 'テストを送る' : 'Googleでログインしてテストを始める';
  el('start').disabled = false;
  status(room ? 'ボタンを押すとテストを1件送ります。Googleログインの操作は不要です。' : '先生が先にテストを始め、生徒端末へリンクを渡してください。');
  el('start').onclick = async () => {
    el('start').disabled = true;
    try {
      if (room) {
        status('送信しています…');
        // Keep student tests separate from any teacher session on this origin.
        const studentApp = appSdk.getApps().find(app => app.name === 'student-test') || appSdk.initializeApp(firebaseConfig, 'student-test');
        const studentAuth = authSdk.getAuth(studentApp);
        await authSdk.setPersistence(studentAuth, authSdk.inMemoryPersistence);
        const {user} = await authSdk.signInAnonymously(studentAuth);
        await dbSdk.setDoc(dbSdk.doc(dbSdk.getFirestore(studentApp), 'connectionTests', room, 'receipts', user.uid), {message:'テスト', sentAt:dbSdk.serverTimestamp()});
        status('送信成功！ 先生の画面にも届いたことを確認してください。');
        el('start').textContent = '送信済み';
      } else {
        stop();
        status('ログインを確認しています…');
        const {user} = await authSdk.signInWithPopup(auth, new authSdk.GoogleAuthProvider());
        const id = crypto.randomUUID().replaceAll('-', '');
        await dbSdk.setDoc(dbSdk.doc(db, 'connectionTests', id), {owner:user.uid, createdAt:dbSdk.serverTimestamp()});
        const link = new URL(location.href); link.hash = new URLSearchParams({room:id}).toString();
        el('link').value = link.href; el('share').hidden = false; el('results').replaceChildren(); el('count').textContent = '0件'; el('copy').textContent = 'リンクをコピー';
        stopListening = dbSdk.onSnapshot(dbSdk.collection(db, 'connectionTests', id, 'receipts'), snapshot => {
          el('results').replaceChildren(); el('count').textContent = `${snapshot.size}件`;
          snapshot.docs.forEach((receipt, index) => { const li=document.createElement('li'); const time=receipt.data().sentAt?.toDate().toLocaleTimeString('ja-JP') || ''; li.textContent=`${index+1}件目：テストを受信 ${time}`; el('results').append(li); });
        }, e => { stop(); error(e); });
        el('stop').hidden = false;
        timer = setTimeout(() => { stop(); status('10分経過したため受信を停止しました。必要なら新しいテストを始めてください。'); }, 600000);
        status('受信待ちです。下のリンクを生徒端末で開いてください。');
        el('start').textContent = '新しいテストを始める'; el('start').disabled = false;
      }
    } catch(e) { error(e); el('start').disabled = false; }
  };
}
boot().catch(error);
