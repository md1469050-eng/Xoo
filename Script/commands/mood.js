"use strict";
const axios  = require("axios");
const fs     = require("fs-extra");
const path   = require("path");
const moment = require("moment-timezone");
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

const TERMS = [
  "mood dance remix edit","vibe remix dance","aesthetic mood dance remix",
  "slow mood dance remix","chill mood dance","trend mood dance",
];
const TIKWM = [
  q => `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(q)}&count=40&cursor=0`,
  q => `https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(q)}&count=20`,
  q => `https://api.tikwm.com/api/feed/search?keywords=${encodeURIComponent(q)}&count=20`,
];
let _cache = [], _cacheTime = 0, recentIds = [];
const CACHE_TTL = 15 * 60 * 1000;

async function getVideos() {
  if (_cache.length && Date.now() - _cacheTime < CACHE_TTL) return _cache;
  const term = TERMS[Math.floor(Math.random() * TERMS.length)];
  for (const b of TIKWM) {
    try {
      const r = await safeGet(b(term), { timeout: 12000 });
      const v = r?.data?.data?.videos?.filter(v => v.play);
      if (v?.length) { _cache = v; _cacheTime = Date.now(); return v; }
    } catch {}
  }
  return _cache.length ? _cache : [];
}


module.exports = {
  config: {
    name: "mood", aliases: ["মুড","mooddance","feelings","vibe"],
    version: "10.0", author: "BELAL BOTX666 🪬",
    countDown: 10, role: 0, hasPermssion: 0, commandCategory: "Media",
    shortDescription: { en: "মুড ড্যান্স রিমিক্স ভিডিও" },
  },
  run: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const bdTime = moment.tz("Asia/Dhaka").format("hh:mm A | DD MMM YYYY");
    const header = "╔══『 𝗠𝗢𝗢𝗗 𝗗𝗔𝗡𝗖𝗘 』══╗\n║  🎭 Mood Dance Remix 🎭  ║\n╚═══════════════════════╝";
    api.setMessageReaction("⏳", messageID, () => {}, true);
    let tmpFile = null;
    try {
      const videos = await getVideos();
      if (!videos.length) throw new Error("ভিডিও নেই");
      let pool = videos.filter(v => !recentIds.includes(v.video_id));
      if (!pool.length) { recentIds = []; pool = videos; }
      const v = pool[Math.floor(Math.random() * pool.length)];
      recentIds.push(v.video_id);
      if (recentIds.length > 25) recentIds.shift();

      tmpFile = await downloadToTmp(v.play, `mood_${Date.now()}.mp4`);
      api.setMessageReaction("🎭", messageID, () => {}, true);
      await api.sendMessage({
        body: `${header}\n\n🎬 ${(v.title||"Mood Dance").slice(0,60)}...\n❤️ ${Number(v.digg_count||0).toLocaleString()}  💬 ${Number(v.comment_count||0).toLocaleString()}\n┄┉❈চাঁদেড়~পাহাড়❈┉┄\n⏰ ${bdTime}`,
        attachment: fs.createReadStream(tmpFile),
      }, threadID, messageID);
    } catch {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`${header}\n\n❌ ভিডিও আনতে ব্যর্থ। আবার চেষ্টা করো।`, threadID, messageID);
    } finally {
      if (tmpFile) setTimeout(() => fs.remove(tmpFile).catch(() => {}), 5000);
    }
  },
};
