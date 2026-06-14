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
/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🌐 translate.js — ভাষা অনুবাদ
  BELAL BOTX666 | Master: Belal YT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
"use strict";
const axios = require("axios");
module.exports.config = {
  name: "translate",
  aliases: ["tr", "অনুবাদ"],
  version: "2.0.0",
  author: "Belal YT",
  description: "যেকোনো ভাষায় অনুবাদ করে",
  usage: "/translate [ভাষা কোড] [টেক্সট]\nউদাহরণ: /translate en আমি ভালো আছি",
  category: "🌐 টুলস",
  cooldowns: 3,
  hasPermssion: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  if (args.length < 2) {
    return api.sendMessage(
      `🌐 অনুবাদ ব্যবহার:\n/translate [ভাষা] [টেক্সট]\n\n📋 ভাষা কোড:\n• bn = বাংলা\n• en = ইংরেজি\n• hi = হিন্দি\n• ar = আরবি\n• zh = চীনা\n• fr = ফরাসি`,
      threadID, messageID
    );
  }
  const to = args[0];
  const text = args.slice(1).join(" ") || event.messageReply?.body;
  if (!text) return api.sendMessage("❌ অনুবাদ করার টেক্সট দিন।", threadID, messageID);

  try {
    const res = await safeGet(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
    );
    const translated = res.data[0].map(x => x[0]).join("");
    api.sendMessage(`🌐 অনুবাদ (→ ${to}):\n━━━━━━━━━━━\n${translated}`, threadID, messageID);
  } catch {
    api.sendMessage("❌ অনুবাদ করতে সমস্যা হয়েছে।", threadID, messageID);
  }
};
