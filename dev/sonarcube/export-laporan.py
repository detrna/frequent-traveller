"""Ekspor hasil analisis SonarQube proyek `aps` ke README.md + sonarqube-raw.json.

Pemakaian:
    SONAR_ADMIN_PW=... python dev/sonarcube/export-laporan.py [host] [berkas-password] [folder-keluaran]

Default: host http://localhost:9001, kata sandi admin dari env SONAR_ADMIN_PW (atau berkas
argumen ke-2), folder keluaran = folder skrip ini. Bagian "## Catatan analisis" dan seterusnya
di README.md yang sudah ada dipertahankan (tidak ditimpa).
"""
import json, sys, os, base64, subprocess, urllib.request, urllib.parse, collections
here = os.path.dirname(os.path.abspath(__file__))
host = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:9001"
out = sys.argv[3] if len(sys.argv) > 3 else here
if len(sys.argv) > 2:
    pw = open(sys.argv[2]).read().strip()
elif os.environ.get("SONAR_ADMIN_PW"):
    pw = os.environ["SONAR_ADMIN_PW"]
else:
    sys.exit(__doc__)
auth = "Basic " + base64.b64encode(("admin:" + pw).encode()).decode()
try:
    commit = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=here, capture_output=True, text=True, check=True).stdout.strip()
except Exception:
    commit = "?"
def get(path, **q):
    r = urllib.request.Request(f"{host}{path}?{urllib.parse.urlencode(q)}", headers={"Authorization": auth})
    return json.load(urllib.request.urlopen(r))
os.makedirs(out, exist_ok=True)
metrics = "bugs,vulnerabilities,code_smells,security_hotspots,reliability_rating,security_rating,sqale_rating,sqale_index,duplicated_lines_density,duplicated_blocks,ncloc,files,functions,complexity,cognitive_complexity,comment_lines_density,alert_status"
m = get("/api/measures/component", component="aps", metricKeys=metrics)
meas = {x["metric"]: x.get("value") for x in m["component"]["measures"]}
qg = get("/api/qualitygates/project_status", projectKey="aps")
issues, p = [], 1
while True:
    r = get("/api/issues/search", componentKeys="aps", ps=500, p=p, additionalFields="rules", resolved="false")
    issues += r["issues"]; rules = {x["key"]: x["name"] for x in r.get("rules", [])} | (globals().get("rules_all") or {})
    globals()["rules_all"] = rules
    if p * 500 >= r["paging"]["total"]: break
    p += 1
rules = globals()["rules_all"]
hs = get("/api/hotspots/search", project="aps", ps=500)["hotspots"]
json.dump({"measures": meas, "qualityGate": qg, "issues": issues, "rules": rules, "hotspots": hs}, open(f"{out}/sonarqube-raw.json", "w"), indent=2, ensure_ascii=False)

def typ(i): return i.get("type")
def sev(i):
    imp = i.get("impacts") or []
    return imp[0]["severity"] if imp else i.get("severity")
def fname(i): return i["component"].split(":",1)[1]
rating = {"1.0":"A","2.0":"B","3.0":"C","4.0":"D","5.0":"E"}
debt = int(meas.get("sqale_index") or 0)
L = []
L.append("# Laporan SonarQube — Frequent Traveller (APS)\n")
L.append(f"- Commit: `{commit}`\n- SonarQube Community Build 26.11 (lokal, Docker), quality profile bawaan *Sonar way*")
L.append(f"- Quality Gate: **{qg['projectStatus']['status']}**")
L.append(f"- Cakupan analisis: `src/`, `prisma/`, `scripts/`, `tests/`, berkas konfigurasi di root (dikecualikan: `src/prisma/contract.*` hasil generate, `*.d.ts`, `node_modules`, `.next*`)\n")
L.append("## Ringkasan metrik\n")
L.append("| Metrik | Nilai |\n|---|---|")
for k, lab in [("bugs","Bugs"),("reliability_rating","Reliability rating"),("vulnerabilities","Vulnerabilities"),("security_rating","Security rating"),("security_hotspots","Security hotspots"),("code_smells","Code smells"),("sqale_rating","Maintainability rating"),("duplicated_lines_density","Duplikasi baris (%)"),("duplicated_blocks","Blok duplikat"),("ncloc","Baris kode (ncloc)"),("files","Berkas"),("functions","Fungsi"),("complexity","Cyclomatic complexity"),("cognitive_complexity","Cognitive complexity"),("comment_lines_density","Densitas komentar (%)")]:
    v = meas.get(k)
    if k.endswith("_rating"): v = rating.get(v, v)
    L.append(f"| {lab} | {v} |")
L.append(f"| Technical debt | {debt//60} jam {debt%60} menit |\n")
by_type = collections.Counter(typ(i) for i in issues)
by_sev = collections.Counter((typ(i), sev(i)) for i in issues)
L.append("## Isu per tipe dan severity\n")
L.append("| Tipe | Jumlah | Rincian severity |\n|---|---|---|")
for t in ["BUG","VULNERABILITY","CODE_SMELL"]:
    d = ", ".join(f"{s}: {n}" for (tt,s),n in sorted(by_sev.items()) if tt==t)
    L.append(f"| {t} | {by_type.get(t,0)} | {d or '-'} |")
L.append("")
L.append("## Aturan yang paling sering dilanggar\n")
L.append("| Aturan | Tipe | Jumlah |\n|---|---|---|")
for (r,t),n in collections.Counter((i["rule"], typ(i)) for i in issues).most_common(25):
    L.append(f"| `{r}` {rules.get(r,'')} | {t} | {n} |")
L.append("")
L.append("## Berkas dengan isu terbanyak\n")
L.append("| Berkas | Jumlah |\n|---|---|")
for f,n in collections.Counter(fname(i) for i in issues).most_common(15):
    L.append(f"| `{f}` | {n} |")
L.append("")
order = {"BLOCKER":0,"HIGH":1,"CRITICAL":1,"MEDIUM":2,"MAJOR":2,"LOW":3,"MINOR":3,"INFO":4}
for t, title in [("BUG","Bugs"),("VULNERABILITY","Vulnerabilities"),("CODE_SMELL","Code smells")]:
    items = sorted([i for i in issues if typ(i)==t], key=lambda i:(order.get(sev(i),9), fname(i), i.get("line",0)))
    L.append(f"## Daftar lengkap: {title} ({len(items)})\n")
    if not items: L.append("Tidak ada.\n"); continue
    L.append("| Severity | Lokasi | Pesan | Aturan |\n|---|---|---|---|")
    for i in items:
        msg = i["message"].replace("|","\\|")
        L.append(f"| {sev(i)} | `{fname(i)}:{i.get('line','-')}` | {msg} | `{i['rule']}` |")
    L.append("")
L.append(f"## Security hotspots ({len(hs)})\n")
if hs:
    L.append("| Prioritas | Lokasi | Pesan | Status |\n|---|---|---|---|")
    for h in hs:
        L.append(f"| {h.get('vulnerabilityProbability')} | `{h['component'].split(':',1)[1]}:{h.get('line','-')}` | {h['message'].replace('|','\\|')} | {h['status']} |")
else: L.append("Tidak ada.")
L.append("")
readme = f"{out}/README.md"
tail = ""
if os.path.exists(readme):
    old = open(readme).read()
    k = old.find("## Catatan analisis")
    if k != -1: tail = "\n" + old[k:]
open(readme, "w").write("\n".join(L) + tail)
print(meas, qg['projectStatus']['status'], by_type, len(hs))
