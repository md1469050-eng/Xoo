"use strict";
const axios  = require("axios");
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

// ৩টা Imgur-compatible upload API
const IMGUR_APIS = [
  (url, base) => `${base}/imgur?link=${encodeURIComponent(url)}`,
  (url)       => `https://aryan-xyz-google-drive.vercel.app/imgur?url=${encodeURIComponent(url)}`,
  (url)       => `https://bk9.fun/upload/imgur?url=${encodeURIComponent(url)}`,
];

async function uploadToImgur(attUrl) {
  const base = await getBaseApi();
  for (const b of IMGUR_APIS) {
    try {
      const r = await safeGet(b(attUrl, base), { timeout: 25000 });
      const d = r?.data || {};
      const link = d?.uploaded?.image || d?.link || d?.url || d?.data?.link;
      if (link) return link;
    } catch {}
  }
  throw new Error("সব Imgur API ব্যর্থ হয়েছে");
}

module.exports = {
  config: {
    name: "imgur", aliases: ["imgupload","imglink"],
    version: "4.0.0", author: "BELAL BOTX666 🪬",
    countDown: 5, role: 0, hasPermssion: 0, category: "Media",
    shortDescription: { en: "ছবি/ভিডিও/GIF Imgur এ upload করে direct link দেয়" },
    guide: { en: "যেকোনো media তে reply দিয়ে {pn}imgur লিখো" },
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, messageReply } = event;
    const bdTime = moment.tz("Asia/Dhaka").format("hh:mm A | DD MMM YYYY");
    const header = "╔═══『 𝐈𝐌𝐆𝐔𝐑 𝐔𝐏𝐋𝐎𝐀𝐃𝐄𝐑 』═══╗\n║  ☁️  Fast Cloud Upload  ☁️  ║\n╚══════════════════════════╝";
    const sig = "\n┄┉❈চাঁদেড়~পাহাড়❈┉┄\n⏰ " + bdTime;

    if (!messageReply?.attachments?.length) {
      return api.sendMessage(`${header}\n\n⚠️ কোনো ছবি/ভিডিও/GIF এ reply দিয়ে কমান্ড দাও!${sig}`, threadID, messageID);
    }

    api.setMessageReaction("⏳", messageID, ()=>{}, true);
    const links = [], failed = [];

    for (let i = 0; i < messageReply.attachments.length; i++) {
      const att = messageReply.attachments[i];
      try {
        const link = await uploadToImgur(att.url);
        links.push(`${i+1}. 🔗 ${link}`);
      } catch {
        failed.push(`${i+1}. ❌ upload ব্যর্থ`);
      }
    }

    api.setMessageReaction(links.length ? "✅" : "❌", messageID, ()=>{}, true);
    let body = `${header}\n\n`;
    if (links.length) body += links.length === 1 ? `✅ Upload সফল!\n\n🔗 Link:\n${links[0].replace("1. 🔗 ","")}` : `✅ ${links.length}টি file upload সফল!\n\n${links.join("\n")}`;
    if (failed.length) body += `\n\n❌ ব্যর্থ (${failed.length}টি):\n${failed.join("\n")}`;
    body += sig;
    return api.sendMessage(body, threadID, messageID);
  },
};
