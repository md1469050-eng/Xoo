"use strict";
const fs   = require("fs");
const path = require("path");
// ── apiHelper safe loader ──────────────────────────────────────
const _apiHelper = (() => {
  try { return require("../../utils/apiHelper"); } catch {}
  try { return require("../utils/apiHelper"); } catch {}
  return global._apiHelper || global.apiHelper || {};
})();
const { safeGet = async(u,o)=>(await require("axios").get(u,{timeout:30000,...(o||{})})),
        safePost = async(u,d,o)=>(await require("axios").post(u,d,{timeout:30000,...(o||{})})),
        safeStream = async(u,f)=>{ const r=await require("axios")({method:"GET",url:u,responseType:"stream",timeout:30000}); if(f)r.data.path=f; return r.data; },
        downloadToTmp = async(url,filename)=>{
          const fs=require("fs-extra"),path=require("path"),axios=require("axios");
          const dir=path.join(process.cwd(),"tmp"); await fs.ensureDir(dir);
          const out=path.join(dir,filename||("dl_"+Date.now()+".mp4"));
          const r=await axios({method:"GET",url,responseType:"stream",timeout:35000,headers:{"User-Agent":getUA()},maxRedirects:8});
          await new Promise((res,rej)=>{const w=require("fs").createWriteStream(out);r.data.pipe(w);w.on("finish",res);w.on("error",rej);});
          return out;
        },
        cleanTmp = (f,ms=10000)=>setTimeout(()=>require("fs-extra").remove(f).catch(()=>{}),ms),
        getUA = ()=>(_apiHelper.getUA ? _apiHelper.getUA() : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"),
        getBaseApi = ()=>(_apiHelper.getBaseApi ? _apiHelper.getBaseApi() : null),
        jitter = (b=0)=>new Promise(r=>setTimeout(r,b+Math.random()*800))
      } = _apiHelper;
// ────────────────────────────────────────────────────────────

const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const BOXES = [
  ["╔══『 📤 PASTEBIN 』══╗","╚══════════════════════╝"],
  ["┏━━『 🗂️ FILE UPLOAD 』━━┓","┗━━━━━━━━━━━━━━━━━━━━━━━━┛"],
  ["«━━◤ 📋 CODE SHARE ◢━━»","«━━━━━━━━━━━━━━━━━━━━━━━»"],
];

module.exports.config = {
  name: "bin", version: "2.0.0", hasPermssion: 2,
  credits: "BELAL BOTX666", description: "Command file pastebin এ upload করো",
  commandCategory: "utility", usages: "bin [filename]", cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const [bTop, bBot] = rand(BOXES);
  const sig = "\n┄┉❈চাঁদের~পাহাড়🪬❈┉┄";

  if (!args[0]) return api.sendMessage(`${bTop}\n⚠️ ফাইলের নাম দিন।\nউদা: bin mycommand\n${bBot}`, threadID, messageID);

  const cmdDir  = path.join(__dirname, "..", "commands");
  const tryPath = [path.join(cmdDir, args[0]), path.join(cmdDir, args[0]+".js")];
  const filePath = tryPath.find(p => fs.existsSync(p));

  if (!filePath) return api.sendMessage(`${bTop}\n❌ ফাইল খুঁজে পাওয়া যায়নি!\n📁 নাম: ${args[0]}\n${bBot}`, threadID, messageID);

  const content = fs.readFileSync(filePath, "utf8");

  const wait = await api.sendMessage(`${bTop}\n📤 Upload হচ্ছে...\n${bBot}`, threadID);

  try {
    const APIS = [
      () => safePost("https://pastebin-api.vercel.app/paste", { text: content }, { timeout: 15000 })
              .then(r => r?.data?.id ? `https://pastebin-api.vercel.app/raw/${r.data.id}` : null),
      () => sastePost("https://haste.zneix.eu/documents", content, { headers:{"Content-Type":"text/plain"}, timeout:15000 })
              .then(r => r?.data?.key ? `https://haste.zneix.eu/raw/${r.data.key}` : null),
    ];

    let link = null;
    for (const fn of APIS) {
      try { link = await fn(); if (link) break; } catch {}
    }

    await api.unsendMessage(wait.messageID).catch(()=>{});

    if (!link) return api.sendMessage(`${bTop}\n❌ Upload ব্যর্থ হয়েছে!\n${bBot}`, threadID, messageID);

    return api.sendMessage(
`${bTop}
✅ Upload সফল!
━━━━━━━━━━━━━━━━━━
📁 File  : ${args[0]}
🔗 Link  : ${link}
━━━━━━━━━━━━━━━━━━
${bBot}${sig}`, threadID, messageID);

  } catch (e) {
    await api.unsendMessage(wait.messageID).catch(()=>{});
    api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID);
  }
};
