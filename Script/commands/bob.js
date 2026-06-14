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

const LINKS = ["https://i.imgur.com/aACbQt7.gif","https://i.imgur.com/S03BGHA.gif","https://i.imgur.com/aqbdtz3.gif","https://i.imgur.com/Vs2Sufq.gif","https://i.imgur.com/h2sPP3n.gif","https://i.imgur.com/YRwonrn.gif","https://i.imgur.com/lR3oytE.gif","https://i.imgur.com/uLBUECf.gif","https://i.imgur.com/QwmTgOD.gif","https://i.imgur.com/IfDNkmG.gif","https://i.imgur.com/aRvIzEr.gif","https://i.imgur.com/WpWbZCA.gif","https://i.imgur.com/TR35cIV.gif","https://i.imgur.com/JJItF7i.gif","https://i.imgur.com/toDH7M4.gif","https://i.imgur.com/42asXxv.gif","https://i.imgur.com/gixNBLq.gif","https://i.imgur.com/JGoIB6R.gif","https://i.imgur.com/oOnPAGl.gif","https://i.imgur.com/KNIsb2k.gif","https://i.imgur.com/9PFeY21.gif","https://i.imgur.com/n91AuPc.gif","https://i.imgur.com/VzDWIrh.gif","https://i.imgur.com/oKWou1H.gif","https://i.imgur.com/1js6n1Q.gif","https://i.imgur.com/zE6L9yK.gif","https://i.imgur.com/EFvrvrU.gif","https://i.imgur.com/oKSOeYo.gif","https://i.imgur.com/8CMsK9Y.gif","https://i.imgur.com/YV2Pf4y.gif","https://i.imgur.com/XbKHBgL.gif","https://i.imgur.com/AYevHVo.gif","https://i.imgur.com/vJbhaP5.gif","https://i.imgur.com/gA8UBzA.gif","https://i.imgur.com/03vpcP5.gif","https://i.imgur.com/RKgmD5L.gif","https://i.imgur.com/VZrE8y9.gif","https://i.imgur.com/BZp1jWW.gif","https://i.imgur.com/0aEmu89.gif","https://i.imgur.com/4f0hwFG.gif","https://i.imgur.com/SgH40kP.gif","https://i.imgur.com/xWBhfDx.gif","https://i.imgur.com/3pZpmoS.gif","https://i.imgur.com/Acc4eQz.gif","https://i.imgur.com/PdJ2jn2.gif","https://i.imgur.com/pQJNggR.gif","https://i.imgur.com/y1DLnMK.gif","https://i.imgur.com/gaRmobq.gif","https://i.imgur.com/GKnCZiJ.gif","https://i.imgur.com/51kBEdb.gif"];

const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const BOXES = [
  ["╔══『 👊 BOB SLAP 』══╗","╚═════════════════════╝"],
  ["«━━◤ 🖐️ SLAPPED ◢━━»","«━━━━━━━━━━━━━━━━━━━━━»"],
  ["┏━━『 😵 SMACKED 』━━┓","┗━━━━━━━━━━━━━━━━━━━━━━┛"],
  ["╔▓▓『 💢 PUNCHED 』▓▓╗","╚▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╝"],
];

module.exports.config = {
  name: "bob", version: "3.0.0", hasPermssion: 0,
  credits: "BELAL BOTX666", description: "Girl to boy slap GIF",
  commandCategory: "fun", usages: "bob [@tag]", cooldowns: 5,
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, mentions } = event;
  const [bTop, bBot] = rand(BOXES);
  const sig = "\n┄┉❈চাঁদের~পাহাড়🪬❈┉┄";

  const mention = Object.keys(mentions);
  if (!mention[0]) return api.sendMessage(`${bTop}\n❌ একজনকে tag করো!\n${bBot}`, threadID, messageID);

  const tag = mentions[mention[0]].replace("@","");
  let tmp   = null;
  try {
    tmp = await downloadToTmp(rand(LINKS), `bob_${Date.now()}.gif`);
    await api.sendMessage({
      body: `${bTop}\n🖕 ${tag}\n😎 এইভাবে খেলব তোমাকে! 🥵🤌\n${bBot}${sig}`,
      attachment: fs.createReadStream(tmp),
      mentions: [{ tag, id: mention[0] }],
    }, threadID, messageID);
  } catch { api.sendMessage("❌ GIF লোড ব্যর্থ।", threadID, messageID); }
  finally { if (tmp) cleanTmp(tmp); }
};
