/* Striver Arena MVP — Firebase compat SDK */
const CONFIG = window.STRIVER_CONFIG || {};
const CATALOGUE_URL = './data/striver-sheet.json';
const state = { user:null, page:'home', catalogue:null, progress:{}, competitions:[], activeCompetition:null, busy:false };
const $ = (s,root=document)=>root.querySelector(s);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const allTasks = ()=>state.catalogue.topics.flatMap(t=>t.tasks.map(x=>({...x,topic:t.name,topicId:t.id})));
const completed = ()=>Object.values(state.progress).filter(x=>x.completed).length;
const total = ()=>allTasks().length;
const percent = ()=>total()?Math.round(completed()/total()*100):0;
let auth,db,unsubscribeProgress=null;
function toast(msg){let n=$('#toast');if(!n){n=document.createElement('div');n.id='toast';n.className='notice';document.body.append(n)}n.textContent=msg;setTimeout(()=>n.remove(),3200)}
function bootFirebase(){
 if(!CONFIG.firebase || !CONFIG.firebase.apiKey || CONFIG.firebase.apiKey.includes('YOUR_')) return false;
 if(!firebase.apps.length) firebase.initializeApp(CONFIG.firebase);
 auth=firebase.auth();db=firebase.firestore();
 auth.onAuthStateChanged(async user=>{state.user=user;if(user){await ensureProfile(user);listenProgress();await loadCompetitions();render()}else{if(unsubscribeProgress)unsubscribeProgress();state.progress={};render()}});
 return true;
}
async function ensureProfile(user){
 const ref=db.collection('users').doc(user.uid),snap=await ref.get();
 const profile={displayName:user.displayName||user.email?.split('@')[0]||'Learner',photoURL:user.photoURL||'',email:user.email||'',updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
 if(!snap.exists) profile.createdAt=firebase.firestore.FieldValue.serverTimestamp();
 await ref.set(profile,{merge:true});
}
function listenProgress(){
 if(unsubscribeProgress)unsubscribeProgress();
 unsubscribeProgress=db.collection('users').doc(state.user.uid).collection('progress').onSnapshot(snap=>{
 state.progress={};snap.forEach(d=>state.progress[d.id]=d.data());render();
 },err=>toast('Progress sync error: '+err.message));
}
async function loadCompetitions(){
 const snap=await db.collection('competitions').where('memberUids','array-contains',state.user.uid).get();
 state.competitions=snap.docs.map(d=>({id:d.id,...d.data()}));
}
function render(){
 const root=$('#app');
 if(!state.user){root.innerHTML=authScreen();bindAuth();return}
 root.innerHTML=appShell();bindNavigation();bindTasks();bindCompetition();
}
function authScreen(){return `<main class="auth card"><div class="brand">STRIVER <span>ARENA</span></div><p class="eyebrow">YOUR DSA. YOUR RACE.</p><h1>Outlearn.<br>Outlast.</h1><p class="muted">Track your sheet, challenge a friend and make every solved problem count.</p><button class="btn" id="google">Continue with Google</button><div class="muted" style="text-align:center;margin:12px">or use email</div><input class="field" id="email" type="email" placeholder="Email address"><input class="field" id="password" type="password" placeholder="Password (6+ characters)"><button class="btn secondary" id="signin">Sign in</button><button class="btn ghost" id="signup">Create account</button><p class="muted" id="authmsg" style="font-size:12px"></p></main>`}
function bindAuth(){
 const msg=t=>$('#authmsg').textContent=t;
 $('#google').onclick=async()=>{try{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())}catch(e){msg(e.message)}};
 $('#signin').onclick=async()=>{try{await auth.signInWithEmailAndPassword($('#email').value,$('#password').value)}catch(e){msg(e.message)}};
 $('#signup').onclick=async()=>{try{await auth.createUserWithEmailAndPassword($('#email').value,$('#password').value)}catch(e){msg(e.message)}};
}
function appShell(){
 const user=state.user,photo=user.photoURL||'';
 return `<main class="shell"><header class="topbar"><div class="brand">STRIVER <span>ARENA</span></div><div class="row"><span class="muted">${esc(user.displayName||user.email)}</span><img class="avatar" src="${esc(photo||'https://placehold.co/80x80/28301f/c8f169?text=S')}" alt=""></div></header>
 <section class="hero"><div><div class="eyebrow">THE DAILY GRIND</div><h1>Keep showing up.</h1><div class="muted">Small wins. Serious momentum.</div></div><button class="btn secondary" id="signout">Sign out ↗</button></section>
 <section class="grid">
 <article class="card stat"><span class="muted">Completed</span><strong>${completed()}</strong><small>of ${total()} starter tasks</small></article>
 <article class="card stat"><span class="muted">Progress</span><strong>${percent()}%</strong><small>Sheet completion</small></article>
 <article class="card stat"><span class="muted">Topics</span><strong>${state.catalogue.topics.length}</strong><small>In current catalogue</small></article>
 <article class="card stat"><span class="muted">Competitions</span><strong>${state.competitions.length}</strong><small>Joined challenges</small></article>
 <article class="card wide"><div class="section-head"><h2>My DSA sheet</h2><span class="pill">MANUAL TRACKING</span></div><div class="row" style="justify-content:space-between"><b>${completed()} / ${total()} completed</b><span class="muted">${percent()}%</span></div><div class="progress"><i style="width:${percent()}%"></i></div><div id="topics">${state.catalogue.topics.map(topicHTML).join('')}</div></article>
 <aside class="card side"><div class="section-head"><h2>Compete</h2><span>⚔</span></div><p class="muted">Create a private arena or join your friend's challenge with a code.</p><button class="btn" id="create-comp" style="width:100%">＋ Create competition</button><input class="field" id="join-code" placeholder="Enter invite code"><button class="btn secondary" id="join-comp" style="width:100%">Join competition</button><div style="margin-top:18px"><h2 style="font-size:16px">Your arenas</h2>${state.competitions.length?state.competitions.map(c=>`<div class="topic"><b>${esc(c.name||'DSA Showdown')}</b><div class="muted" style="font-size:12px">${esc(c.code||'')}</div><button class="btn ghost open-comp" data-id="${c.id}" style="margin-top:8px">View comparison →</button></div>`).join(''):'<div class="empty">No competitions yet.</div>'}</div></aside>
 </section><div id="competition-detail"></div></main><nav class="nav"><div class="nav-inner"><button class="active"><b>⌂</b>Home</button><button onclick="document.querySelector('#topics').scrollIntoView({behavior:'smooth'})"><b>▤</b>Sheet</button><button onclick="document.querySelector('#create-comp').scrollIntoView({behavior:'smooth'})"><b>⚔</b>Compete</button><button id="nav-profile"><b>◉</b>Profile</button></div></nav>`;
}
function topicHTML(topic){
 const done=topic.tasks.filter(t=>state.progress[t.id]?.completed).length;
 return `<section class="topic"><div class="topic-head"><span class="topic-title">${esc(topic.name)}</span><span class="pill">${done}/${topic.tasks.length}</span></div>${topic.tasks.map(t=>`<label class="task"><input type="checkbox" data-task="${esc(t.id)}" ${state.progress[t.id]?.completed?'checked':''}><span>${esc(t.title)}</span>${t.url?`<a href="${esc(t.url)}" target="_blank" rel="noopener">Open ↗</a>`:''}</label>`).join('')}</section>`;
}
function bindNavigation(){
 $('#signout').onclick=()=>auth.signOut();
 $('#nav-profile').onclick=()=>toast('Signed in as '+(state.user.email||''));
}
function bindTasks(){
 document.querySelectorAll('[data-task]').forEach(input=>input.onchange=async()=>{
  const id=input.dataset.task,ref=db.collection('users').doc(state.user.uid).collection('progress').doc(id);
  try{
   if(input.checked) await ref.set({completed:true,completedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
   else await ref.delete();
   const snap=await db.collection('users').doc(state.user.uid).collection('progress').get();
   const count=snap.docs.filter(d=>d.data().completed).length;
   await db.collection('users').doc(state.user.uid).set({completedCount:count,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
   const comps=await db.collection('competitions').where('memberUids','array-contains',state.user.uid).get();
   for(const c of comps.docs) await c.ref.collection('members').doc(state.user.uid).set({completedCount:count,progressPercent:total()?Math.round(count/total()*100):0},{merge:true});
  }
  catch(e){input.checked=!input.checked;toast(e.message)}
 });
}
function makeCode(){return 'STR-'+Math.random().toString(36).slice(2,6).toUpperCase()+'-'+Math.random().toString(36).slice(2,4).toUpperCase()}
function bindCompetition(){
 $('#create-comp').onclick=async()=>{
  const name=prompt('Competition name?','DSA Showdown');if(!name)return;
  const code=makeCode(),ref=db.collection('competitions').doc();
  const payload={name,code,ownerUid:state.user.uid,memberUids:[state.user.uid],status:'active',createdAt:firebase.firestore.FieldValue.serverTimestamp()};
  try{
   await ref.set(payload);
   await ref.collection('members').doc(state.user.uid).set({uid:state.user.uid,displayName:state.user.displayName||state.user.email,photoURL:state.user.photoURL||'',joinedAt:firebase.firestore.FieldValue.serverTimestamp()});
   await db.collection('inviteCodes').doc(code).set({competitionId:ref.id,ownerUid:state.user.uid});
   await loadCompetitions();render();toast('Competition created. Code: '+code);
  }catch(e){toast('Could not create competition: '+e.message)}
 };
 $('#join-comp').onclick=async()=>{
  const code=$('#join-code').value.trim().toUpperCase();if(!code)return toast('Enter an invite code');
  try{
   const codeDoc=await db.collection('inviteCodes').doc(code).get();if(!codeDoc.exists)return toast('Invite code not found');
   const ref=db.collection('competitions').doc(codeDoc.data().competitionId),snap=await ref.get();if(!snap.exists)return toast('Competition no longer exists');
   const data=snap.data();if(data.memberUids.includes(state.user.uid))return toast('You already joined this competition');
   await ref.update({memberUids:firebase.firestore.FieldValue.arrayUnion(state.user.uid),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
   await ref.collection('members').doc(state.user.uid).set({uid:state.user.uid,displayName:state.user.displayName||state.user.email,photoURL:state.user.photoURL||'',joinedAt:firebase.firestore.FieldValue.serverTimestamp()});
   await loadCompetitions();render();toast('Competition joined!');
  }catch(e){toast('Could not join: '+e.message)}
 };
 document.querySelectorAll('.open-comp').forEach(b=>b.onclick=()=>showCompetition(b.dataset.id));
}
async function showCompetition(id){
 const host=$('#competition-detail');host.innerHTML='<div class="card">Loading comparison…</div>';
 try{
  const ref=db.collection('competitions').doc(id),snap=await ref.get();if(!snap.exists)throw Error('Competition not found');
  const comp=snap.data(),members=await ref.collection('members').get(),rows=[];
  for(const m of members.docs){const uid=m.id,profile=m.data();rows.push({...profile,uid,count:profile.completedCount||0,percent:profile.progressPercent||0})}
  rows.sort((a,b)=>b.count-a.count);
  host.innerHTML=`<section class="card" style="margin-top:16px"><div class="section-head"><div><div class="eyebrow">HEAD TO HEAD</div><h2>${esc(comp.name)}</h2></div><span class="pill">${esc(comp.code)}</span></div><p class="muted">Share this code with a friend: <b style="color:var(--lime)">${esc(comp.code)}</b></p>${rows.map((r,i)=>`<div class="leader"><span class="rank">#${i+1}</span><img src="${esc(r.photoURL||'https://placehold.co/80x80')}" alt=""><strong>${esc(r.displayName||'Learner')}${r.uid===state.user.uid?' (you)':''}</strong><span>${r.count} done · ${r.percent}%</span></div>`).join('')}<p class="muted" style="font-size:12px">Comparison uses each member's manually marked completed tasks.</p></section>`;
 }catch(e){host.innerHTML='<div class="card">'+esc(e.message)+'</div>'}
}
async function start(){
 try{const response=await fetch(CATALOGUE_URL);state.catalogue=await response.json()}catch(e){state.catalogue={topics:[]}}
 if(!bootFirebase()){
  $('#app').innerHTML='<main class="auth card"><div class="brand">STRIVER <span>ARENA</span></div><h1>Firebase setup needed</h1><p class="muted">Open env.js and add your Firebase Web App configuration. Follow firebase.txt for the complete setup.</p></main>';return;
 }
}
start();