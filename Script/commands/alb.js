"use strict";
const axios  = require("axios");
const fs     = require("fs-extra");
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

const CATEGORIES = {
  "1":  { name: "🕌 Islamic",     path: "/video/islam"    },
  "2":  { name: "🎌 Anime",       path: "/video/anime"    },
  "3":  { name: "✍️ Shairi",      path: "/video/shairi"   },
  "4":  { name: "📱 Short",       path: "/video/short"    },
  "5":  { name: "😢 Sad",         path: "/video/sad"      },
  "6":  { name: "📊 Status",      path: "/video/status"   },
  "7":  { name: "⚽ Football",    path: "/video/football" },
  "8":  { name: "😂 Funny",       path: "/video/funny"    },
  "9":  { name: "❤️ Love",        path: "/video/love"     },
  "10": { name: "🏏 CPL",         path: "/video/cpl"      },
  "11": { name: "👶 Baby",        path: "/video/baby"     },
  "12": { name: "😰 Kosto",       path: "/video/kosto"    },
  "13": { name: "🎵 Lofi",        path: "/video/lofi"     },
  "14": { name: "😊 Happy",       path: "/video/happy"    },
  "15": { name: "🎭 Humayun Sir", path: "/video/humaiyun" },
  "16": { name: "🔥 Sex",         path: "/video/sex"      },
  "17": { name: "💥 Horny",       path: "/video/horny"    },
  "18": { name: "💃 Item",        path: "/video/item"     },
  "19": { name: "🌶️ Hot",         path: "/video/hot"      },
  "20": { name: "✂️ Capcut",      path: "/video/capcut"   },
};

module.exports = {
  config: {
    name: "alb", aliases: ["album","video","vid"],
    version: "9.0.0", author: "BELAL BOTX666 🪬",
    countDown: 5, role: 0, hasPermssion: 0, commandCategory: "Media",
    shortDescription: { en: "২০ ক্যাটাগরির ভিডিও পাঠায়" },
    guide: { en: "{pn}alb → category বেছে নাও" },
  },

  run: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const bdTime = moment.tz("Asia/Dhaka").format("hh:mm A | DD MMM YYYY");
    const menu =
      "╔════『 𝗔𝗟𝗕𝗨𝗠 𝗩𝗜𝗗𝗘𝗢 』════╗\n║  🎬 ভিডিও ক্যাটাগরি মেনু 🎬  ║\n╚══════════════════════════╝\n\n" +
      "📋 নম্বর দিয়ে reply করো:\n\n" +
      "━━━『 𝗡𝗢𝗥𝗠𝗔𝗟 𝗩𝗜𝗗𝗘𝗢 』━━━\n" +
      "1️⃣  🕌 Islamic  2️⃣  🎌 Anime  3️⃣  ✍️ Shairi\n" +
      "4️⃣  📱 Short   5️⃣  😢 Sad    6️⃣  📊 Status\n" +
      "7️⃣  ⚽ Football  8️⃣  😂 Funny  9️⃣  ❤️ Love\n" +
      "🔟  🏏 CPL  1️⃣1️⃣  👶 Baby  1️⃣2️⃣  😰 Kosto\n" +
      "1️⃣3️⃣  🎵 Lofi  1️⃣4️⃣  😊 Happy  1️⃣5️⃣  🎭 Humayun Sir\n\n" +
      "━━━『 🔥 𝗛𝗢𝗧 𝗩𝗜𝗗𝗘𝗢 🔥 』━━━\n" +
      "1️⃣6️⃣  🔥 Sex  1️⃣7️⃣  💥 Horny  1️⃣8️⃣  💃 Item\n" +
      "1️⃣9️⃣  🌶️ Hot  2️⃣0️⃣  ✂️ Capcut\n\n" +
      `┄┉❈চাঁদেড়~পাহাড়❈┉┄\n⏰ ${bdTime}`;

    return api.sendMessage(menu, threadID, (err, info) => {
      if (!info?.messageID) return;
      global.client.handleReply.push({
        name: "alb", commandName: "alb",
        messageID: info.messageID, author: senderID, type: "select",
      });
    }, messageID);
  },

  handleReply: async function ({ api, event, handleReply }) {
    if (handleReply.author !== event.senderID) return;
    if (handleReply.type !== "select") return;

    const { threadID, messageID, body } = event;
    const bdTime = moment.tz("Asia/Dhaka").format("hh:mm A | DD MMM YYYY");
    const cat = CATEGORIES[body.trim()];

    if (!cat) return api.sendMessage("❓ ১ থেকে ২০ এর মধ্যে নম্বর দাও!", threadID, messageID);

    api.setMessageReaction("⏳", messageID, ()=>{}, true);
    const loadMsg = await api.sendMessage(`╔══『 𝗔𝗟𝗕𝗨𝗠 』══╗\n⏳ ${cat.name} লোড হচ্ছে...\n⚡ একটু অপেক্ষা করো!`, threadID);

    let tmpFile = null;
    try {
      const baseURL = await getBaseApi();
      if (!baseURL) throw new Error("API URL পাওয়া যায়নি");

      const res = await axios.get(`${baseURL}${cat.path}`, {
        timeout: 15000,
        headers: { "User-Agent": getUA() },
      });
      const data = res.data;
      if (!data?.data) throw new Error("ভিডিও পাওয়া যায়নি");

      tmpFile = await downloadToTmp(data.data, `alb_${Date.now()}.mp4`);
      await api.unsendMessage(loadMsg.messageID).catch(()=>{});
      api.setMessageReaction("✅", messageID, ()=>{}, true);

      await api.sendMessage({
        body:
          `╔══『 𝗔𝗟𝗕𝗨𝗠 𝗩𝗜𝗗𝗘𝗢 』══╗\n${cat.name}\n` +
          `📊 Total: ${data.count||"?"} ভিডিও\n` +
          (data.shaon ? `📝 ${data.shaon}\n` : "") +
          `┄┉❈চাঁদেড়~পাহাড়❈┉┄\n⏰ ${bdTime}`,
        attachment: fs.createReadStream(tmpFile),
      }, threadID, messageID);

    } catch (e) {
      await api.unsendMessage(loadMsg.messageID).catch(()=>{});
      api.setMessageReaction("❌", messageID, ()=>{}, true);
      api.sendMessage(`❌ ভিডিও লোড ব্যর্থ!\n📝 ${e.message?.slice(0,80)}\n🔄 আবার চেষ্টা করো।`, threadID, messageID);
    } finally {
      if (tmpFile) cleanTmp(tmpFile);
    }
  },
};
