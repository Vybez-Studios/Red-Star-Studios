const fmt=d=>d?new Date(d+"T00:00").toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"}):"";
const poster=i=>`<div class="poster"><img src="${esc(i.poster)}" alt="${esc(i.title)} poster" loading="lazy" onerror="this.remove()"><span>${esc(i.title)}</span></div>`;
const card=(i,t)=>`<a class="card" href="item.html?t=${t}&id=${encodeURIComponent(i.slug)}">${poster(i)}<div class="cb"><h3>${esc(i.title)}</h3><p>${esc(i.tagline)}</p>
 <span class="tag">${t=="game"?esc(i.stage):"v"+esc(i.version)}</span>${t=="addon"?`<small>Updated ${esc(fmt(i.updated))}</small>`:""}</div></a>`;
const grid=(l,t)=>l.map(i=>card(i,t)).join("")||"<p>Nothing here yet.</p>";
const sel=(id,o,all)=>`<select id="f-${id}" aria-label="${all}"><option value="">${all}</option>${o.map(x=>`<option>${x}</option>`).join("")}</select>`;

function chrome(d){
  const s=d.studio,here=location.pathname.split("/").pop()||"index.html";
  const a=(h,t)=>`<a href="${h}" ${here==h?'aria-current="page"':""}>${t}</a>`;
  $("#header").innerHTML=`<a class="brand" href="index.html"><img src="images/logo.png" alt="">${esc(s.name)}</a><nav>${a("index.html","Home")}${a("games.html","Games")}${a("addons.html","Addons")}<a href="index.html#about">About</a></nav>`;
  const links=[["itch.io",s.itch],["YouTube",s.youtube],["Discord",s.discord]].filter(x=>x[1]).map(x=>`<a href="${esc(x[1])}">${x[0]}</a>`);
  if(s.contact)links.push(`<a href="mailto:${esc(s.contact)}">${esc(s.contact)}</a>`);
  $("#footer").innerHTML=`<p>© ${new Date().getFullYear()} ${esc(s.name)}</p><p>${links.join(" ")}</p>`;
  document.title=document.title.replace("{studio}",s.name);
}
function home(d){
  $("#hero").innerHTML=`<img class="logo" src="images/logo.png" alt=""><div><h1>${esc(d.studio.name)}</h1><p>${esc(d.studio.tagline)}</p><a class="btn" href="games.html">Our games</a> <a class="btn alt" href="addons.html">Addons</a></div>`;
  $("#games").innerHTML=grid(d.games.slice(0,4),"game");
  $("#addons").innerHTML=grid(d.addons.slice(0,4),"addon");
  $("#about-text").textContent=d.studio.about;
}
function list(d,key,t){
  $("#filters").innerHTML=(t=="game"?sel("stage",STAGES,"All release stages"):"")+sel("cat",CATS,"All categories");
  const draw=()=>{const s=$("#f-stage")?.value,c=$("#f-cat").value;
    $("#grid").innerHTML=grid(d[key].filter(i=>(!s||i.stage==s)&&(!c||(i.categories||[]).includes(c))),t);};
  $("#filters").onchange=draw;draw();
}
function item(d){
  const p=new URLSearchParams(location.search),t=p.get("t")=="addon"?"addon":"game";
  const i=d[t+"s"].find(x=>x.slug==p.get("id")),back=t=="game"?"games.html":"addons.html";
  if(!i){$("#item").innerHTML=`<h1>Not found</h1><p><a href="${back}">Back</a></p>`;return;}
  document.title=i.title+" | "+d.studio.name;
  const btns=t=="game"
    ?(i.itch?`<a class="btn" href="${esc(i.itch)}">Download on itch.io</a>`:`<span class="btn off">Not available yet</span>`)
    :(i.curseforge?`<a class="btn" href="${esc(i.curseforge)}">Download on CurseForge</a>`:"")+(i.mcpedl?` <a class="btn alt" href="${esc(i.mcpedl)}">Download on MCPEDL</a>`:"")+(d.studio.discord?` <a class="btn alt" href="${esc(d.studio.discord)}">Report bugs on Discord</a>`:"");
  const meta=t=="game"?[["Release stage",i.stage],["Platforms",(i.platforms||[]).join(", ")]]:[["Version","v"+i.version],["Last updated",fmt(i.updated)],["Platform","Minecraft Bedrock"]];
  meta.push(["Categories",(i.categories||[]).join(", ")]);
  $("#item").innerHTML=`<div class="ihead">${poster(i)}<div><h1>${esc(i.title)}</h1><p class="lead">${esc(i.tagline)}</p>
    <dl>${meta.filter(m=>m[1]).map(m=>`<dt>${m[0]}</dt><dd>${esc(m[1])}</dd>`).join("")}</dl><div class="btns">${btns}</div></div></div>
    <div class="ibody"><h2>About</h2>${esc(i.description).split("\n\n").map(x=>`<p>${x}</p>`).join("")}
    ${(i.features||[]).length?`<h2>Features</h2><ul>${i.features.map(f=>`<li>${esc(f)}</li>`).join("")}</ul>`:""}
    ${(i.screenshots||[]).length?`<h2>Screenshots</h2><div class="shots">${i.screenshots.map(s=>`<img src="${esc(s)}" alt="" loading="lazy">`).join("")}</div>`:""}</div>
    <p><a href="${back}">Back to ${t}s</a></p>`;
}
(async()=>{
  try{const d=await (await fetch("data.json?v="+Date.now())).json();chrome(d);
    ({home,games:d=>list(d,"games","game"),addons:d=>list(d,"addons","addon"),item})[document.body.dataset.page](d);}
  catch(e){document.body.insertAdjacentHTML("beforeend","<p style='padding:2rem'>Couldn't load data.json. Open the site through GitHub Pages, not as a local file.</p>");}
})();
