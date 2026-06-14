"use strict";
const fs = require("fs-extra");
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

const LINKS = ["https://i.imgur.com/HtKWgma.mp4","https://i.imgur.com/T0YDigG.mp4","https://i.imgur.com/n0vIGPL.mp4","https://i.imgur.com/3DmuzVK.mp4","https://i.imgur.com/3T9MDRN.mp4","https://i.imgur.com/OKe4qU9.mp4","https://i.imgur.com/mu9406G.mp4","https://i.imgur.com/soOacql.mp4","https://i.imgur.com/CDdnb47.mp4","https://i.imgur.com/3ejxOV4.mp4","https://i.imgur.com/HsX02Pw.mp4"];

const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const BOXES = [
  ["╔══『 💀 BODY 』══╗","╚══════════════════╝"],
  ["«━━◤ 🖤 DARK VIBE ◢━━»","«━━━━━━━━━━━━━━━━━━━»"],
  ["┏━━『 😔 SAD VIDEO 』━━┓","┗━━━━━━━━━━━━━━━━━━━━━━┛"],
  ["╔▓▓『 🌑 MOOD OFF 』▓▓╗","╚▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╝"],
];

module.exports.config = {
  name: "body", version: "2.0.0", hasPermssion: 0,
  credits: "BELAL BOTX666", description: "Sad/Dark ভিডিও",
  commandCategory: "video", usages: "body", cooldowns: 5,
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;
  const [bTop, bBot] = rand(BOXES);
  const sig = "\n┄┉❈চাঁদের~পাহাড়🪬❈┉┄";
  let tmp = null;
  try {
    tmp = await downloadToTmp(rand(LINKS), `body_${Date.now()}.mp4`);
    await api.sendMessage({
      body: `${bTop}\nbody\n${bBot}${sig}`,
      attachment: fs.createReadStream(tmp),
    }, threadID, messageID);
  } catch { api.sendMessage("❌ ভিডিও লোড ব্যর্থ।", threadID, messageID); }
  finally { if (tmp) cleanTmp(tmp); }
};
