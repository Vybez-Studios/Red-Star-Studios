const STAGES=["Unreleased","Demo","Full Game","Beta Build","Alpha Build"];
const CATS=["Action","FPS","TPS","Sci-Fi","Adventure","Survival","Horror","RPG","Sandbox","Puzzle","Platformer"];
const REPO="Vybez-Studios/Red-Star-Studios",BRANCH="main";
const $=s=>document.querySelector(s);
const esc=t=>String(t??"").replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
