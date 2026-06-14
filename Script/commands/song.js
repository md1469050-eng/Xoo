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
 * song.js — v6.0
 * ✅ লিস্ট দেখায়, নম্বর দিয়ে select
 * ✅ Cobalt + পুরানো API race — যেটা আগে সেটা জেতে
 * ✅ disk নেই — সরাসরি stream (arraybuffer নেই)
 * ✅ getApi() cached
 * ✅ mp3 অডিও হিসেবে মেসেঞ্জারে আসবে
 */
const axios = require("axios");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

const COBALT_HEADERS = {
  "Accept": "application/json",
  "Content-Type": "application/json"
};

// getApi — apiHelper থেকে cached version (GitHub rate limit safe)
async function getApi() { return await getBaseApi(); }

// Cobalt — ৩টা instance একসাথে race, mp3
async function getCobaltUrl(videoId) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const instances = [
    "https://api.cobalt.tools",
    "https://cobalt.api.timelessnesses.me",
    "https://co.wuk.sh"
  ];
  return Promise.any(instances.map(base =>
    axios.post(base, {
      url: youtubeUrl,
      audioFormat: "mp3",
      downloadMode: "audio",
      filenameStyle: "basic"
    }, { headers: COBALT_HEADERS, timeout: 15000 })
    .then(r => {
      const url = r.data?.url || r.data?.audio;
      if (!url) throw new Error("no url");
      return url;
    })
  ));
}

// disk নেই, সরাসরি mp3 stream — path: song.mp3 দিলে মেসেঞ্জার অডিও হিসেবে চেনে
async function fastAudioStream(url) {
  return Promise.any([url, url, url].map(u =>
    axios({ method: "GET", url: u, responseType: "stream", headers: HEADERS, timeout: 60000, maxRedirects: 10 })
      .then(r => {
        r.data.path = "song.mp3"; // .mp3 extension — মেসেঞ্জার অডিও হিসেবে দেখাবে
        return r.data;
      })
  ));
}

async function streamImg(url, name) {
  const r = await axios.get(url, { responseType: "stream", timeout: 10000 });
  r.data.path = name;
  return r.data;
}

// Cobalt + পুরানো API race করে download URL আনো
async function getDownloadUrl(videoId) {
  const base = await getApi();

  const cobalt = getCobaltUrl(videoId);

  const oldApi = axios.get(
    `${base}/ytDl3?link=${videoId}&format=mp3&quality=3`, { timeout: 40000 }
  ).then(r => {
    if (!r.data?.downloadLink) throw new Error("no link");
    return r.data.downloadLink;
  });

  return Promise.any([cobalt, oldApi]);
}

module.exports = {
  config: {
    name: "song",
    aliases: ["music", "play", "mp3", "audio", "গান"],
    version: "6.0.0",
    author: "Belal YT",
    countDown: 10,
    role: 0,
    hasPermssion: 0,
    shortDescription: "গান সার্চ করে অডিওতে পাঠায়",
    category: "media",
    guide: { en: "{pn} <গানের নাম>" },
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    if (!args.length) return api.sendMessage(
      "🎵 ব্যবহার: /song <গানের নাম>\nউদাহরণ: /song Bohemian Rhapsody",
      threadID, messageID
    );

    const keyword = args.join(" ").trim();
    api.setMessageReaction("🔍", messageID, () => {}, true);

    try {
      const base = await getApi();
      const results = (await axios.get(
        `${base}/ytFullSearch?songName=${encodeURIComponent(keyword)}`, { timeout: 15000 }
      )).data.slice(0, 6);

      if (!results.length) return api.sendMessage(
        `⭕ "${keyword}" এর কোনো গান পাওয়া যায়নি।`, threadID, messageID
      );

      // লিস্ট তৈরি + thumbnail একসাথে load
      let msg = `🎵 "${keyword}"\n${"─".repeat(22)}\n\n`;
      const thumbPromises = results.map((r, i) => {
        msg += `${i+1}. ${r.title}\n⏱️ ${r.time} | ${r.channel?.name||"?"}\n\n`;
        return streamImg(r.thumbnail, `st${i+1}.jpg`);
      });
      msg += "👉 নম্বর দিয়ে reply করুন (১-৬)";

      const imgs = await Promise.all(thumbPromises);
      api.setMessageReaction("✅", messageID, () => {}, true);

      api.sendMessage({ body: msg, attachment: imgs }, threadID, (err, info) => {
        if (err || !info) return;
        global.client.handleReply.push({
          name: "song",
          messageID: info.messageID,
          author: senderID,
          result: results,
        });
      }, messageID);

    } catch (e) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`❌ Search ব্যর্থ: ${e.message?.slice(0,100)}`, threadID, messageID);
    }
  },

  handleReply: async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (senderID !== handleReply.author) return;

    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > handleReply.result.length)
      return api.sendMessage("❌ সঠিক নম্বর দিন (১-৬)।", threadID, messageID);

    const vid = handleReply.result[choice - 1];
    try { await api.unsendMessage(handleReply.messageID); } catch {}

    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
      // Cobalt + পুরানো API race — যেটা আগে দেয় সেটা নাও
      const downloadUrl = await getDownloadUrl(vid.id);

      // সরাসরি mp3 stream — disk নেই
      const stream = await fastAudioStream(downloadUrl);

      await api.sendMessage(
        {
          body: `🎵 ${vid.title}\n⏱️ ${vid.time} | ${vid.channel?.name||""}\n\n🎶 ┄┉ উপভোগ করুন ┉┄ 🎶`,
          attachment: stream
        },
        threadID, () => {}, messageID
      );
      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (e) {
      console.error("[song]", e.message);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`❌ গান আনতে ব্যর্থ: ${e.message?.slice(0,100)}`, threadID, messageID);
    }
  },
};

// startup cache warm
setTimeout(() => getApi().catch(() => {}), 2000);
                      
