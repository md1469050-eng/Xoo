"use strict";
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

const DRIVE_APIS = [
  url => `https://aryan-xyz-google-drive.vercel.app/drive?url=${encodeURIComponent(url)}&apikey=ArYAN`,
  url => `https://gdrive-upload.vercel.app/api/upload?url=${encodeURIComponent(url)}`,
  url => `https://bk9.fun/upload/gdrive?url=${encodeURIComponent(url)}`,
];

async function uploadToDrive(inputUrl) {
  for (const b of DRIVE_APIS) {
    try {
      const r = await safeGet(b(inputUrl), { timeout: 35000 });
      const d = r?.data || {};
      const link = d.driveLink || d.driveLIink || d.link || d.url || d.download_url;
      if (link) return link;
    } catch {}
  }
  throw new Error("সব Drive API ব্যর্থ হয়েছে");
}

module.exports = {
  config: {
    name: "drive", aliases: ["gdrive","googledrive","gd"],
    version: "4.0.0", author: "BELAL BOTX666 🪬",
    countDown: 5, role: 0, hasPermssion: 0, category: "Media",
    shortDescription: { en: "media Google Drive এ upload করে link দেয়" },
    guide: { en: "media reply → {pn}drive অথবা {pn}drive [url]" },
  },
  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;
    const bdTime = moment.tz("Asia/Dhaka").format("hh:mm A | DD MMM YYYY");
    const header = "╔════『 𝐆𝐎𝐎𝐆𝐋𝐄 𝐃𝐑𝐈𝐕𝐄 』════╗\n║  ☁️  Cloud Storage Upload  ☁️  ║\n╚═══════════════════════════╝";
    const sig = "\n┄┉❈চাঁদেড়~পাহাড়❈┉┄\n⏰ " + bdTime;

    let inputUrl = null, fileName = "media";
    if (messageReply?.attachments?.length > 0) {
      inputUrl = messageReply.attachments[0].url;
      fileName = messageReply.attachments[0].filename || "media";
    } else if (args.length > 0) inputUrl = args[0];

    if (!inputUrl) return api.sendMessage(`${header}\n\n⚠️ media তে reply দিয়ে drive লিখো\nঅথবা drive [url]${sig}`, threadID, messageID);

    api.setMessageReaction("⏳", messageID, () => {}, true);
    const loadMsg = await api.sendMessage(`${header}\n\n☁️ Upload হচ্ছে... ⚡`, threadID);
    try {
      const link = await uploadToDrive(inputUrl);
      await api.unsendMessage(loadMsg.messageID).catch(() => {});
      api.setMessageReaction("✅", messageID, () => {}, true);
      api.sendMessage(`${header}\n\n✅ Upload সফল!\n\n📁 ${fileName}\n\n🔗 Drive Link:\n${link}${sig}`, threadID, messageID);
    } catch (e) {
      await api.unsendMessage(loadMsg.messageID).catch(() => {});
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`${header}\n\n❌ Upload ব্যর্থ!\n${e.message.slice(0,100)}${sig}`, threadID, messageID);
    }
  },
};
