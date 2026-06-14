"use strict";
const fs   = require("fs-extra");
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

module.exports.config = {
  name: "short", version: "4.0", hasPermssion: 0, credits: "BELAL BOTX666",
  description: "TikTok রিমিক্স সং ভিডিও সার্চ", commandCategory: "fun", usages: "[query]", cooldowns: 5,
};

async function searchVideos(query) {
  const SOURCES = [
    () => safeGet(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(query)}&count=20`,{timeout:10000})
          .then(r=>(r?.data?.data?.videos||[]).filter(v=>v.play).map(v=>({url:v.play,title:v.title||query}))),
    () => safeGet(`https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(query)}&count=20`,{timeout:10000})
          .then(r=>(r?.data?.data?.videos||[]).filter(v=>v.play).map(v=>({url:v.play,title:v.title||query}))),
    () => safeGet(`https://mahi-apis.onrender.com/api/tiktok?search=${encodeURIComponent(query)}`,{timeout:15000})
          .then(r=>(r?.data?.data||[]).filter(v=>v.video).map(v=>({url:v.video,title:v.title||query}))),
  ];
  for (const fn of SOURCES) {
    try { const v = await fn(); if (v?.length) return v; } catch {}
  }
  return [];
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");
  if (!query) return api.sendMessage("❌ query দিন। উদাহরণ: /short dj sonu", threadID, messageID);
  api.setMessageReaction("✨", messageID, ()=>{}, true);
  let tmpFile = null;
  try {
    const videos = await searchVideos(query + " remix song");
    if (!videos.length) {
      api.setMessageReaction("❌", messageID, ()=>{}, true);
      return api.sendMessage(`❌ "${query}" এর জন্য ভিডিও পাওয়া যায়নি।`, threadID, messageID);
    }
    const picked = videos[Math.floor(Math.random()*videos.length)];
    tmpFile = await downloadToTmp(picked.url, `short_${Date.now()}.mp4`);
    api.setMessageReaction("✅", messageID, ()=>{}, true);
    await api.sendMessage({
      body: `🎵 ${picked.title}\n\nরিমিক্স সং ভিডিও নিচে দেওয়া হলো!`,
      attachment: fs.createReadStream(tmpFile),
    }, threadID, messageID);
  } catch {
    api.setMessageReaction("❌", messageID, ()=>{}, true);
    api.sendMessage("❌ এরর হয়েছে। আবার চেষ্টা করুন।", threadID, messageID);
  } finally {
    if (tmpFile) cleanTmp(tmpFile);
  }
};
