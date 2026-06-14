/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  🎵 tiktok.js — TikTok ভিডিও ডাউনলোড
 *  ✅ Multi-API fallback (tikwm → mahi-apis → ssstik)
 *  ✅ Anti-block retry  ✅ HD support
 *  BELAL BOTX666 | Master: Belal YT
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
"use strict";
const axios  = require("axios");
const fs     = require("fs-extra");
const path   = require("path");
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
  name: "tiktok", aliases: ["tt", "tikdown"], version: "3.0.0",
  author: "Belal YT", description: "TikTok ভিডিও watermark ছাড়া ডাউনলোড",
  usage: "/tiktok [link]", category: "📥 ডাউনলোড", cooldowns: 15, hasPermssion: 0,
};

// ── API Source 1: tikwm ────────────────────────────────────────────
async function fromTikwm(url) {
  const APIs = [
    `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
    `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
    `https://api.tikwm.com/api/?url=${encodeURIComponent(url)}`,
  ];
  for (const api of APIs) {
    try {
      const r = await safeGet(api, { timeout: 10000 });
      const d = r?.data?.data;
      if (!d) continue;
      const videoUrl = d.hdplay || d.play;
      if (!videoUrl) continue;
      return {
        url: videoUrl,
        info: {
          title:    d.title   || "TikTok ভিডিও",
          author:   d.author?.nickname || "Unknown",
          duration: d.duration ? `${d.duration}s` : "N/A",
          likes:    d.digg_count ? Number(d.digg_count).toLocaleString() : "N/A",
          comments: d.comment_count ? Number(d.comment_count).toLocaleString() : "N/A",
        }
      };
    } catch { /* try next */ }
  }
  return null;
}

// ── API Source 2: mahi-apis (fallback) ────────────────────────────
async function fromMahiApi(url) {
  try {
    const r = await safeGet(
      `https://mahi-apis.onrender.com/api/tiktok?url=${encodeURIComponent(url)}`,
      { timeout: 15000 }
    );
    const d = r?.data;
    if (!d?.video) return null;
    return {
      url: d.video,
      info: { title: d.title || "TikTok ভিডিও", author: d.author || "Unknown", duration: "N/A", likes: "N/A", comments: "N/A" }
    };
  } catch { return null; }
}

// ── API Source 3: ssstik (last resort) ───────────────────────────
async function fromSsstik(url) {
  try {
    const r = await safePost(
      "https://ssstik.io/abc?url=dl",
      new URLSearchParams({ id: url, locale: "en", tt: "" }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded", "Referer": "https://ssstik.io/", "User-Agent": getUA() }, timeout: 12000 }
    );
    const match = r?.data?.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/i);
    if (!match) return null;
    return { url: match[1], info: { title: "TikTok ভিডিও", author: "Unknown", duration: "N/A", likes: "N/A", comments: "N/A" } };
  } catch { return null; }
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const url = args[0];
  if (!url || !url.includes("tiktok")) {
    return api.sendMessage("❌ TikTok লিংক দিন!\nউদাহরণ: /tiktok https://vm.tiktok.com/xxx", threadID, messageID);
  }

  const tmp = await new Promise(r => api.sendMessage("⬇️ TikTok ডাউনলোড হচ্ছে...", threadID, (e, i) => r(i?.messageID)));

  try {
    // Multi-source fallback
    let result = await fromTikwm(url) || await fromMahiApi(url) || await fromSsstik(url);
    if (!result) throw new Error("সব API ব্যর্থ হয়েছে");

    // Download video
    const stream = await safeStream(result.url, "tiktok.mp4");
    const tmpFile = path.join(process.cwd(), "tmp", `tt_${Date.now()}.mp4`);
    fs.ensureDirSync(path.dirname(tmpFile));

    await new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(tmpFile);
      stream.pipe(ws);
      ws.on("finish", resolve);
      ws.on("error", reject);
    });

    try { api.unsendMessage(tmp); } catch {}

    await api.sendMessage({
      body: `🎵 ${result.info.title}\n👤 ${result.info.author}\n⏱️ ${result.info.duration}\n❤️ ${result.info.likes}  💬 ${result.info.comments}`,
      attachment: fs.createReadStream(tmpFile),
    }, threadID, messageID);

    setTimeout(() => fs.remove(tmpFile).catch(() => {}), 30000);
  } catch (err) {
    try { api.unsendMessage(tmp); } catch {}
    api.sendMessage(`❌ ডাউনলোড ব্যর্থ: ${err.message}`, threadID, messageID);
  }
};
