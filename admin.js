let tok=sessionStorage.getItem("rss_tok")||"",D,sha,tab="games",editing=null;
const api=(p,o={})=>fetch(`https://api.github.com/repos/${REPO}/contents/${p}`,{...o,headers:{Authorization:"Bearer "+tok,Accept:"application/vnd.github+json","Content-Type":"application/json"}});
const b64=s=>btoa(unescape(encodeURIComponent(s))),unb64=s=>decodeURIComponent(escape(atob(s.replace(/\n/g,""))));
const status=m=>$("#msg").textContent=m;
const slugify=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const common=[["title","Title","text"],["slug","Page id (auto from title if blank)","text"],["tagline","Tagline","text"]];
const tail=[["description","Description (blank line = new paragraph)","area"],["features","Features (one per line)","lines"],["screenshots","Screenshots (one image path per line)","lines"]];
const F={
 games:[...common,["poster","Poster (600x900)","image"],["stage","Release stage","select",STAGES],["categories","Categories","multi",CATS],["platforms","Platforms (comma separated)","list"],["itch","itch.io link (blank = none yet)","text"],...tail],
 addons:[...common,["poster","Cover image (600x900)","image"],["version","Version","text"],["updated","Last updated","date"],["categories","Categories","multi",CATS],["curseforge","CurseForge link","text"],["mcpedl","MCPEDL link","text"],...tail],
 studio:[["name","Studio name","text"],["tagline","Tagline","text"],["about","About us","area"],["discord","Discord link","text"],["itch","itch.io profile","text"],["youtube","YouTube","text"],["contact","Contact email","text"]]
};
async function signin(){
  tok=$("#tok").value.trim()||tok;
  const r=await api("data.json?ref="+BRANCH);
  if(!r.ok){$("#lmsg").textContent="Sign-in failed ("+r.status+"). Check the token and that it can edit this repo.";return;}
  const j=await r.json();sha=j.sha;D=JSON.parse(unb64(j.content));
  sessionStorage.setItem("rss_tok",tok);$("#login").hidden=true;$("#app").hidden=false;show();
}
function signout(){sessionStorage.removeItem("rss_tok");location.reload();}
async function save(msg){
  status("Saving...");
  const r=await api("data.json",{method:"PUT",body:JSON.stringify({message:msg,content:b64(JSON.stringify(D,null,2)),sha,branch:BRANCH})});
  if(!r.ok){status("Save failed ("+r.status+"). Reload and try again.");return false;}
  sha=(await r.json()).content.sha;status("Saved. The live site updates in about a minute.");return true;
}
function field([k,l,t,o],v){
  const id="f_"+k;let h=`<div class="fld"><span>${l}</span>`;
  if(t=="area")h+=`<textarea id="${id}" rows="6">${esc(v)}</textarea>`;
  else if(t=="lines")h+=`<textarea id="${id}" rows="3">${esc((v||[]).join("\n"))}</textarea>`;
  else if(t=="list")h+=`<input id="${id}" value="${esc((v||[]).join(", "))}">`;
  else if(t=="select")h+=`<select id="${id}">${o.map(x=>`<option ${x==v?"selected":""}>${x}</option>`).join("")}</select>`;
  else if(t=="multi")h+=`<div class="multi" id="${id}">${o.map(x=>`<label><input type="checkbox" value="${x}" ${(v||[]).includes(x)?"checked":""}> ${x}</label>`).join("")}</div>`;
  else if(t=="date")h+=`<input type="date" id="${id}" value="${esc(v)}"> <button type="button" onclick="$('#${id}').value=new Date().toISOString().slice(0,10)">Today</button>`;
  else if(t=="image")h+=`<input id="${id}" value="${esc(v)}"><input type="file" accept="image/*" onchange="upload(this,'${id}')">`;
  else h+=`<input id="${id}" value="${esc(v)}">`;
  return h+"</div>";
}
function read(fs,base){
  const o={...base};
  fs.forEach(([k,,t])=>{const e=$("#f_"+k);
    o[k]=t=="multi"?[...e.querySelectorAll("input:checked")].map(x=>x.value)
      :t=="list"?e.value.split(",").map(s=>s.trim()).filter(Boolean)
      :t=="lines"?e.value.split("\n").map(s=>s.trim()).filter(Boolean):e.value.trim();});
  if("title" in o)o.slug=slugify(o.slug||o.title);
  return o;
}
async function upload(inp,id){
  const f=inp.files[0];if(!f)return;
  const m=f.name.match(/^(.*?)(\.[^.]+)?$/),name=slugify(m[1])+(m[2]||"").toLowerCase(),path="images/"+name;
  status("Uploading "+name+"...");
  const data=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(",")[1]);fr.readAsDataURL(f);});
  const ex=await api(path+"?ref="+BRANCH),s=ex.ok?(await ex.json()).sha:undefined;
  const r=await api(path,{method:"PUT",body:JSON.stringify({message:"Upload "+name,content:data,sha:s,branch:BRANCH})});
  if(r.ok){$("#"+id).value=path;status("Uploaded "+path+". Press Save to use it.");}else status("Upload failed ("+r.status+")");
}
async function saveItem(){
  const it=read(F[tab],editing==-1?{}:D[tab][editing]);
  if(!it.title){status("A title is required.");return false;}
  const isNew=editing==-1;isNew?D[tab].push(it):D[tab][editing]=it;
  if(await save((isNew?"Add ":"Update ")+it.title)){editing=null;show();}
  return false;
}
async function saveStudio(){D.studio=read(F.studio,D.studio);await save("Update studio details");return false;}
async function del(i){
  if(!confirm("Delete "+D[tab][i].title+"? This can't be undone from here."))return;
  const [x]=D[tab].splice(i,1);if(await save("Delete "+x.title))show();
}
function show(){
  $("#tabs").innerHTML=["games","addons","studio"].map(t=>`<button class="${t==tab?"on":""}" onclick="tab='${t}';editing=null;show()">${t[0].toUpperCase()+t.slice(1)}</button>`).join("");
  const box=$("#panel");
  if(tab=="studio"){box.innerHTML=`<form onsubmit="return saveStudio()">${F.studio.map(f=>field(f,D.studio[f[0]])).join("")}<button class="btn">Save</button></form>`;return;}
  if(editing!==null){const it=editing==-1?{}:D[tab][editing];
    box.innerHTML=`<form onsubmit="return saveItem()">${F[tab].map(f=>field(f,it[f[0]])).join("")}<button class="btn">Save</button> <button type="button" class="btn alt" onclick="editing=null;show()">Cancel</button></form>`;return;}
  box.innerHTML=`<button class="btn" onclick="editing=-1;show()">Add new</button>`+D[tab].map((it,i)=>`<div class="row"><b>${esc(it.title)}</b><span>${esc(it.stage||"v"+it.version)}</span><button onclick="editing=${i};show()">Edit</button><button onclick="del(${i})">Delete</button></div>`).join("");
}
if(tok)signin();
