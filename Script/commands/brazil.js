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
  "Argentina funny troll Bangladesh","আর্জেন্টিনা ট্রল মজার ভিডিও",
  "Brazil vs Argentina Bangla funny","আর্জেন্টিনা নিয়ে মজার ভিডিও",
  "argentina fail tiktok funny","brazil troll argentina tiktok",
];
const TIKWM = [
  q => `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(q)}&count=25`,
  q => `https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(q)}&count=20`,
  q => `https://api.tikwm.com/api/feed/search?keywords=${encodeURIComponent(q)}&count=20`,
];
let recentIds = [];

async function getVideo() {
  const term = TERMS[Math.floor(Math.random() * TERMS.length)];
  for (const b of TIKWM) {
    try {
      const r = await safeGet(b(term), { timeout: 12000 });
      const videos = r?.data?.data?.videos?.filter(v => v.play);
      if (!videos?.length) continue;
      let pool = videos.filter(v => !recentIds.includes(v.video_id));
      if (!pool.length) { recentIds = []; pool = videos; }
      const v = pool[Math.floor(Math.random() * pool.length)];
      recentIds.push(v.video_id);
      if (recentIds.length > 25) recentIds.shift();
      return { url: v.play, title: v.title || "Troll Video" };
    } catch {}
  }
  return null;
}

module.exports = {
  config: {
    name: "brazil", aliases: ["brasil","bratroll","ব্রাজিল"],
    description: "🇧🇷 vs 🇦🇷 ট্রল ভিডিও", usage: "brazil", cooldown: 12, role: 0,
  },
  run: async ({ api, event }) => {
    const { threadID, messageID } = event;
    const wait = await api.sendMessage("⚽ ট্রল ভিডিও খুঁজছি...", threadID);
    let tmpFile = null;
    try {
      const video = await getVideo();
      if (!video) throw new Error("ভিডিও পাওয়া যায়নি");
      tmpFile = await downloadToTmp(video.url, `brazil_${Date.now()}.mp4`);
      await api.unsendMessage(wait.messageID).catch(() => {});
      await api.sendMessage({
        body: `🎭 আর্জেন্টিনা ট্রল ভিডিও:\n📹 ${video.title.slice(0,80)}\n❤️ লাইক কমেন্ট করো!`,
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
