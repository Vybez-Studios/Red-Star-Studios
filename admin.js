let tok=sessionStorage.getItem("rss_tok")||"",D,tab="games",editing=null;
const api=(p,o={})=>fetch(`https://api.github.com/repos/${REPO}/contents/${p}`,{cache:"no-store",...o,headers:{Authorization:"Bearer "+tok,Accept:"application/vnd.github+json","Content-Type":"application/json"}});
const b64=s=>btoa(unescape(encodeURIComponent(s))),unb64=s=>decodeURIComponent(escape(atob(s.replace(/\n/g,""))));
const slugify=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const say=(m,k="")=>{const e=$("#msg");e.textContent=m;e.className=k;e.hidden=!m;if(k=="ok")setTimeout(()=>{if(e.textContent==m)e.hidden=true},9000);};
const WHY={401:"The token was rejected. Sign out and sign in with a fresh token.",
 403:"Your token can read the repo but not write to it. Make a new token with Contents set to Read and write for Red-Star-Studios, then sign out and sign in again.",
 404:"GitHub can't reach the repo or file with this token. Check the token covers Red-Star-Studios with Contents set to Read and write.",
 409:"The file changed while saving. Press Save again.",422:"GitHub refused the change. Press Save again or reload the page."};
const fail=(what,code)=>{say(`${what} (error ${code}). ${WHY[code]||"Try again."}`,"err");return false;};
const common=[["title","Title","text"],["slug","Page id (auto from title if blank)","text"],["tagline","Tagline","text"]];
const tail=[["description","Description (blank line = new paragraph)","area"],["features","Features (one per line)","lines"],["screenshots","Screenshots (one image path per line)","lines"]];
const F={
 games:[...common,["poster","Poster (600x900)","image"],["stage","Release stage","select",STAGES],["categories","Categories","multi",CATS],["platforms","Platforms (comma separated)","list"],["itch","itch.io link (blank = none yet)","text"],...tail],
 addons:[...common,["poster","Cover image (600x900)","image"],["categories","Categories","multi",CATS],["curseforge","CurseForge link","text"],["version","Version (auto-filled from CurseForge)","text"],["updated","Last updated (auto-filled)","date"],...tail],
 studio:[["name","Studio name","text"],["tagline","Tagline","text"],["about","About us","area"],["discord","Discord link","text"],["itch","itch.io profile","text"],["youtube","YouTube","text"],["contact","Contact email","text"]]
};
async function signin(){
  tok=$("#tok").value.trim()||tok;
  const r=await api("data.json?ref="+BRANCH);
  if(!r.ok){$("#lmsg").textContent=`Sign-in failed (error ${r.status}). ${WHY[r.status]||""}`;return;}
  D=JSON.parse(unb64((await r.json()).content));
  sessionStorage.setItem("rss_tok",tok);$("#login").hidden=true;$("#app").hidden=false;show();
}
function signout(){sessionStorage.removeItem("rss_tok");location.reload();}
// Re-reads the latest data.json from GitHub, applies the change to it, and commits it.
async function save(msg,mutate){
  say("Saving...");
  const g=await api("data.json?ref="+BRANCH);
  if(!g.ok)return fail("Couldn't read the latest data",g.status);
  const j=await g.json(),fresh=JSON.parse(unb64(j.content));
  mutate(fresh);
  const r=await api("data.json",{method:"PUT",body:JSON.stringify({message:msg,content:b64(JSON.stringify(fresh,null,2)+"\n"),sha:j.sha,branch:BRANCH})});
  if(!r.ok)return fail("Save failed",r.status);
  D=fresh;say("Saved to GitHub. The live site updates in about a minute.","ok");return true;
}
const diff=(a,b)=>Object.fromEntries(Object.entries(a).filter(([k,v])=>JSON.stringify(v)!==JSON.stringify((b||{})[k])));
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
function read(fs){
  const o={};
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
  say("Uploading "+name+"...");
  const data=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(",")[1]);fr.readAsDataURL(f);});
  const ex=await api(path+"?ref="+BRANCH),s=ex.ok?(await ex.json()).sha:undefined;
  const r=await api(path,{method:"PUT",body:JSON.stringify({message:"Upload "+name,content:data,sha:s,branch:BRANCH})});
  if(!r.ok)return fail("Image upload failed",r.status);
  $("#"+id).value=path;say("Uploaded "+path+". Now press Save to use it.","ok");
}
async function saveItem(){
  const t=tab,base=editing==-1?null:D[t][editing],it=read(F[t]);
  if(!it.title){say("A title is required.","err");return;}
  const ok=await save((base?"Update ":"Add ")+it.title,d=>{
    const l=d[t],i=base?l.findIndex(x=>x.slug==base.slug):-1;
    if(i>=0)Object.assign(l[i],diff(it,base));
    else{let s=it.slug,n=2;while(l.some(x=>x.slug==s))s=it.slug+"-"+n++;l.push({...it,slug:s});}
  });
  if(ok){editing=null;show();}
}
async function saveStudio(){
  const ch=diff(read(F.studio),D.studio);
  if(await save("Update studio details",d=>Object.assign(d.studio,ch)))show();
}
async function del(i){
  const t=tab,s=D[t][i].slug,name=D[t][i].title;
  if(!confirm("Delete "+name+"? This removes it from the site."))return;
  if(await save("Delete "+name,d=>{d[t]=d[t].filter(x=>x.slug!=s);}))show();
}
function show(){
  $("#tabs").innerHTML=["games","addons","studio"].map(t=>`<button class="${t==tab?"on":""}" onclick="tab='${t}';editing=null;show()">${t[0].toUpperCase()+t.slice(1)}</button>`).join("");
  const box=$("#panel");
  if(tab=="studio"){box.innerHTML=`<form onsubmit="saveStudio();return false">${F.studio.map(f=>field(f,D.studio[f[0]])).join("")}<button class="btn">Save</button></form>`;return;}
  if(editing!==null){const it=editing==-1?{}:D[tab][editing];
    box.innerHTML=`<form onsubmit="saveItem();return false">${F[tab].map(f=>field(f,it[f[0]])).join("")}<button class="btn">Save</button> <button type="button" class="btn alt" onclick="editing=null;show()">Cancel</button></form>`;return;}
  box.innerHTML=`<button class="btn" onclick="editing=-1;show()">Add new</button>`+D[tab].map((it,i)=>`<div class="row"><b>${esc(it.title)}</b><span>${esc(it.stage||(it.version?"v"+it.version:""))}</span><button onclick="editing=${i};show()">Edit</button><button onclick="del(${i})">Delete</button></div>`).join("");
}
if(tok)signin();
