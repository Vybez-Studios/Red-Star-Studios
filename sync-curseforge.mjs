// Runs in GitHub Actions. Reads each addon's CurseForge page via CFWidget (no API key)
// and updates version, last-updated date, Minecraft version, downloads and file link in data.json.
import fs from "node:fs";
const data = JSON.parse(fs.readFileSync("data.json", "utf8"));
let changed = false;
for (const a of data.addons) {
  if (!a.curseforge) continue;
  const key = a.curseforgeId || new URL(a.curseforge).pathname.replace(/^\/|\/$/g, "");
  try {
    const r = await fetch("https://api.cfwidget.com/" + key, { headers: { "User-Agent": "rss-site-sync" } });
    if (!r.ok) { console.log(a.slug, "- CFWidget answered", r.status); continue; }
    const d = await r.json();
    const f = d.download || (d.files || []).slice().sort((x, y) => new Date(y.uploaded_at) - new Date(x.uploaded_at))[0];
    if (!f) { console.log(a.slug, "- no file found in response"); continue; }
    const set = (k, v) => { if (v !== undefined && v !== "" && a[k] !== v) { console.log(a.slug, k, "=", v); a[k] = v; changed = true; } };
    set("version", ((f.name || "").match(/(\d+(?:\.\d+)+)/) || (f.display || "").match(/(\d+(?:\.\d+)+)/) || [])[1]);
    const day = String(f.uploaded_at || "").slice(0, 10);
    set("updated", /^\d{4}-\d\d-\d\d$/.test(day) ? day : undefined);
    set("mcVersion", typeof f.version === "string" ? f.version.replace(/^v/i, "") : undefined);
    set("downloads", d.downloads && Number(d.downloads.total) ? Number(d.downloads.total) : undefined);
    set("fileUrl", f.id ? a.curseforge.replace(/\/$/, "") + "/files/" + f.id : undefined);
  } catch (e) { console.log(a.slug, "- failed:", e.message); }
}
if (changed) fs.writeFileSync("data.json", JSON.stringify(data, null, 2) + "\n");
else console.log("No changes.");
