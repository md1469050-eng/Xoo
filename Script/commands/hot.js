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

const TERMS = [
  "hot girl dance","hot girls reels","capcut_edit girl","hot girls edit",
  "tiktok hot girl dance","hot dance girl viral","trending girl remix",
  "hot edit girl","girl dance capcut","sexy dance girl",
];
const EXCLUDE = ["boy","male","guy","man","bro","dude","ছেলে","পুরুষ"];
const TIKWM = [
  q => `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(q)}&count=40`,
  q => `https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(q)}&count=30`,
  q => `https://api.tikwm.com/api/feed/search?keywords=${encodeURIComponent(q)}&count=20`,
];
let recentIds = [];

async function getVideo() {
  for (let a = 0; a < 5; a++) {
    const term = TERMS[Math.floor(Math.random() * TERMS.length)];
    for (const b of TIKWM) {
      try {
        const r = await safeGet(b(term), { timeout: 12000 });
        const videos = r?.data?.data?.videos?.filter(v => v.play);
        if (!videos?.length) continue;
        let pool = videos.filter(v => !recentIds.includes(v.video_id));
        if (!pool.length) { recentIds = []; pool = videos; }
        for (const v of pool) {
          const t = (v.title||"").toLowerCase(), au = (v.author?.unique_id||"").toLowerCase();
          if (EXCLUDE.some(w => t.includes(w) || au.includes(w))) continue;
          recentIds.push(v.video_id);
          if (recentIds.length > 25) recentIds.shift();
          return { url: v.play, title: v.title, digg: v.digg_count||0 };
        }
      } catch {}
    }
  }
  return null;
}

module.exports = {
  config: {
    name: "hot", aliases: ["হট","hotreels","hotgirls"],
    description: "হট গার্লস ভিডিও", usage: "hot", cooldown: 10, role: 0,
  },
  run: async ({ api, event }) => {
    const { threadID, messageID } = event;
    const wait = await api.sendMessage("🔥 হট গার্লস ভিডিও খুঁজছি...", threadID);
    let tmpFile = null;
    try {
      const video = await getVideo();
      if (!video) throw new Error("ভিডিও পাওয়া যায়নি");
      tmpFile = await downloadToTmp(video.url, `hot_${Date.now()}.mp4`);
      await api.unsendMessage(wait.messageID).catch(() => {});
      await api.sendMessage({
        body: `💃 হট গার্লস ভিডিও:\n📹 ${(video.title||"Hot Dance").slice(0,80)}\n❤️ লাইক: ${Number(video.digg).toLocaleString()}`,
        attachment: fs.createReadStream(tmpFile),
      }, threadID, messageID);
    } catch {
      await api.unsendMessage(wait.messageID).catch(() => {});
      api.sendMessage("❌ ভিডিও আনতে ব্যর্থ। আবার চেষ্টা করুন।", threadID, messageID);
    } finally {
      if (tmpFile) cleanTmp(tmpFile);
    }
  },
};
