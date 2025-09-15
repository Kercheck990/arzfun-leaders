// === Конфигурация ===
const API_BASE = "http://localhost:5000/api"; 
// поменяй на адрес своего бэкенда, например: "https://мойдомен.ру/api"

function saveToken(token){ localStorage.setItem('ghetto_token', token); }
function getToken(){ return localStorage.getItem('ghetto_token'); }
function authHeaders(){ const t=getToken(); return t?{Authorization:"Bearer "+t}:{ }; }
function escapeHtml(s){ if(!s&&s!==0)return"";return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }

// === ЛОГИН ===
function initLogin(){
  const form=document.getElementById("loginForm");
  if(!form)return;
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const username=document.getElementById("username").value.trim();
    const password=document.getElementById("password").value;
    try{
      const r=await fetch(API_BASE+"/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||"Ошибка входа");
      saveToken(data.token);
      localStorage.setItem("ghetto_user",JSON.stringify(data.user));
      location.href="dashboard.html";
    }catch(err){
      const errBox=document.getElementById("loginError");
      errBox.innerText=err.message; errBox.style.display="block";
    }
  });
}

// === DASHBOARD ===
async function initDashboard(){
  if(!document.querySelector(".app"))return;
  const content=document.getElementById("content");
  const topTitle=document.getElementById("topTitle");
  const refreshBtn=document.getElementById("refreshBtn");
  const logoutBtn=document.getElementById("logoutBtn");
  const user=JSON.parse(localStorage.getItem("ghetto_user")||"null");
  if(!user||!getToken())return location.href="index.html";
  document.querySelector(".user-pill").innerText=user.username;
  document.querySelectorAll(".navbtn[data-view]").forEach(btn=>btn.addEventListener("click",()=>{topTitle.innerText=btn.innerText;renderView(btn.dataset.view);}));  
  logoutBtn.addEventListener("click",()=>{localStorage.removeItem("ghetto_token");localStorage.removeItem("ghetto_user");location.href="index.html";});
  refreshBtn.addEventListener("click",()=>renderView(topTitle.innerText.toLowerCase()||"profiles"));
  renderView("profiles");

  async function apiFetch(path,opts={}){
    opts.headers=Object.assign({},opts.headers||{},authHeaders());
    const r=await fetch(API_BASE+path,opts);
    if(r.status===401){localStorage.removeItem("ghetto_token");location.href="index.html";}
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.error||"API error");
    return data;
  }

  async function loadProfiles(){return (await apiFetch("/profiles")).users||[];}

  function createProfileCard(u){
    const div=document.createElement("div");div.className="card-profile";
    const img=document.createElement("img");img.className="avatar";img.src=u.avatar_path||"https://via.placeholder.com/84?text=AV";img.alt=u.display_name;
    const info=document.createElement("div");info.className="info";
    info.innerHTML=`<div class="display-name">${escapeHtml(u.display_name)}</div>
      <div class="username">@${escapeHtml(u.username)}</div>
      <div class="label">${escapeHtml(u.bio||"")}</div>
      <div class="controls"></div>`;
    div.appendChild(img);div.appendChild(info);
    const controls=info.querySelector(".controls");
    if(user.role==="admin"||user.id===u.id){
      const btnEdit=document.createElement("button");btnEdit.className="btn small";btnEdit.innerText="Редактировать";
      btnEdit.onclick=()=>openEditModal(u);controls.appendChild(btnEdit);
    }
    if(user.role==="admin"){
      const btnDelete=document.createElement("button");btnDelete.className="btn small";btnDelete.innerText="Удалить";
      btnDelete.onclick=()=>deleteProfile(u.id);
      const badge=document.createElement("div");badge.className="badge";badge.innerText=u.role||"user";
      controls.append(btnDelete,badge);
    }
    return div;
  }

  async function renderView(view){
    content.innerHTML="<div class='center'>Загрузка...</div>";
    try{
      const users=await loadProfiles();
      if(view==="profiles"){
        content.innerHTML="<h2>Профили</h2>";
        if(user.role==="admin"){let b=document.createElement("button");b.className="btn";b.innerText="Добавить игрока";b.onclick=openCreateModal;content.appendChild(b);}
        const wrap=document.createElement("div");users.forEach(u=>wrap.appendChild(createProfileCard(u)));content.appendChild(wrap);
      }else if(view==="leaders"){
        content.innerHTML="<h2>Лидеры</h2>";
        const top=users.sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,20);
        const wrap=document.createElement("div");top.forEach(u=>{let el=document.createElement("div");el.className="card-small";el.innerHTML=`<b>${escapeHtml(u.display_name)}</b> @${escapeHtml(u.username)} — score:${u.score||0}`;wrap.appendChild(el);});content.appendChild(wrap);
      }else if(view==="followers"){
        content.innerHTML="<h2>Следящие</h2>";
        const wrap=document.createElement("div");users.filter(u=>u.role==="follower").forEach(u=>wrap.appendChild(createProfileCard(u)));content.appendChild(wrap);
      }else if(view==="info"){
        const info=await apiFetch("/siteinfo");
        content.innerHTML=`<h2>Инфо сайта</h2><div class="card-small"><b>${escapeHtml(info.name||"Site")}</b><br>Версия: ${escapeHtml(info.version||"1.0")}<br>Игроков: ${users.length}</div>`;
      }
    }catch(e){content.innerHTML="<div class='error'>"+e.message+"</div>";}
  }

  function openCreateModal(){
    const username=prompt("Username");if(!username)return;
    const display=prompt("Display name",username)||username;
    apiFetch("/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,display_name:display})})
      .then(()=>renderView("profiles")).catch(e=>alert("Ошибка: "+e.message));
  }
  function openEditModal(u){
    const display=prompt("Display name",u.display_name)||u.display_name;
    const bio=prompt("Bio",u.bio||"")||"";
    apiFetch("/profiles/"+u.id,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({display_name:display,bio})})
      .then(()=>renderView("profiles")).catch(e=>alert("Ошибка: "+e.message));
  }
  function deleteProfile(id){
    if(!confirm("Удалить?"))return;
    apiFetch("/profiles/"+id,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"deleted"})})
      .then(()=>renderView("profiles")).catch(e=>alert("Ошибка: "+e.message));
  }
}

// === INIT ===
document.addEventListener("DOMContentLoaded",()=>{initLogin();initDashboard();});
