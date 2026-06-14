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

const LINKS = ["https://i.imgur.com/2MOezkV.mp4","https://i.imgur.com/t9qQYXY.mp4","https://i.imgur.com/sfrCllI.mp4","https://i.imgur.com/wuWm4Zf.mp4","https://i.imgur.com/8Cze5eR.mp4","https://i.imgur.com/WbVxFiZ.mp4","https://i.imgur.com/5pZ7avd.mp4","https://i.imgur.com/rwJzo4j.mp4","https://i.imgur.com/IIuGEnP.mp4","https://i.imgur.com/PTcw69V.mp4","https://i.imgur.com/X1UyvYg.mp4","https://i.imgur.com/BXuOPCu.mp4","https://i.imgur.com/iYCVlFm.mp4","https://i.imgur.com/ToEnOF4.mp4","https://i.imgur.com/CHe8W0x.mp4","https://i.imgur.com/1MjqIFD.mp4","https://i.imgur.com/OYsv5kE.mp4","https://i.imgur.com/OuzACnd.mp4","https://i.imgur.com/vBc1xu0.mp4","https://i.imgur.com/ptGiFh3.mp4","https://i.imgur.com/kEd15eO.mp4","https://i.imgur.com/sUug0bN.mp4","https://i.imgur.com/kkVEHsh.mp4","https://i.imgur.com/AiAvenh.mp4","https://i.imgur.com/8iKZtJH.mp4","https://i.imgur.com/ISa89fg.mp4","https://i.imgur.com/lzWbYuo.mp4"];

const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const BOXES = [
  ["╔══『 💜 BL VIDEO 』══╗","╚═════════════════════╝"],
  ["«━━◤ 🖤 DARK BL ◢━━»","«━━━━━━━━━━━━━━━━━━━━»"],
  ["┏━━『 🌀 BL VIBES 』━━┓","┗━━━━━━━━━━━━━━━━━━━━━━┛"],
  ["╔▓▓『 💙 BL WORLD 』▓▓╗","╚▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╝"],
];

module.exports.config = {
  name: "bl", version: "2.0.0", hasPermssion: 0,
  credits: "BELAL BOTX666", description: "BL ভিডিও পাঠায়",
  commandCategory: "video", usages: "bl", cooldowns: 5,
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;
  const [bTop, bBot] = rand(BOXES);
  const sig = "\n┄┉❈চাঁদের~পাহাড়🪬❈┉┄";
  let tmp = null;
  try {
    tmp = await downloadToTmp(rand(LINKS), `bl_${Date.now()}.mp4`);
    await api.sendMessage({
      body: `${bTop}\nBL 💜\n${bBot}${sig}`,
      attachment: fs.createReadStream(tmp),
    }, threadID, messageID);
  } catch { api.sendMessage("❌ ভিডিও লোড ব্যর্থ।", threadID, messageID); }
  finally { if (tmp) cleanTmp(tmp); }
};
