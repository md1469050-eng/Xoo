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
 * videov2.js — v7.0 AUTO FAST
 * ✅ search করলে সাথে সাথে #1 ভিডিও পাঠায়
 * ✅ Cobalt + পুরানো API race — যেটা আগে সেটা জেতে
 * ✅ disk নেই — সরাসরি stream
 * ✅ getApi() cached
 */
const axios = require("axios");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

const COBALT_HEADERS = {
  "Accept": "application/json",
  "Content-Type": "application/json"
};

// getApi — apiHelper cached version
async function getApi() { return await getBaseApi(); }

// Cobalt — ৩টা instance race
async function getCobaltUrl(videoId, fmt) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const cobaltInstances = [
    "https://api.cobalt.tools",
    "https://cobalt.api.timelessnesses.me",
    "https://co.wuk.sh"
  ];
  const requests = cobaltInstances.map(base =>
    axios.post(base, {
      url: youtubeUrl,
      videoQuality: "720",
      audioFormat: "mp3",
      downloadMode: fmt === "mp3" ? "audio" : "auto",
      filenameStyle: "basic"
    }, { headers: COBALT_HEADERS, timeout: 15000 })
    .then(r => {
      const url = r.data?.url || r.data?.audio;
      if (!url) throw new Error("no url");
      return url;
    })
  );
  return Promise.any(requests);
}

// disk নেই — সরাসরি stream
async function fastStream(url, filename) {
  const streams = [url, url, url].map(u =>
    axios({ method: "GET", url: u, responseType: "stream", headers: HEADERS, timeout: 60000, maxRedirects: 10 })
      .then(r => { r.data.path = filename; return r.data; })
  );
  return Promise.any(streams);
}

// search + download একসাথে
async function searchAndDownload(keyword, fmt) {
  const base = await getApi();

  // search করো
  const results = (await axios.get(
    `${base}/ytFullSearch?songName=${encodeURIComponent(keyword)}`, { timeout: 15000 }
  )).data;

  if (!results || results.length === 0) return null;

  // #1 ভিডিও নাও
  const top = results[0];

  // Cobalt + পুরানো API race
  const cobaltPromise = getCobaltUrl(top.id, fmt)
    .then(url => ({ url, title: top.title, quality: "720p" }));

  const oldApiPromise = axios.get(
    `${base}/ytDl3?link=${top.id}&format=${fmt}&quality=3`, { timeout: 40000 }
  ).then(r => ({ url: r.data.downloadLink, title: r.data.title, quality: r.data.quality }));

  const winner = await Promise.any([cobaltPromise, oldApiPromise]);
  return { ...winner, thumb: top.thumbnail, time: top.time, channel: top.channel?.name || "" };
}

module.exports = {
  config: {
    name: "v",
    version: "7.0.0",
    author: "Belal YT",
    countDown: 10,
    role: 0,
    hasPermssion: 0,
    shortDescription: "YouTube ভিডিও/অডিও — সাথে সাথে পাঠায়",
    longDescription: "Search করলে #1 ভিডিও সাথে সাথে পাঠায়, নম্বর দিতে হয় না",
    category: "media",
    guide: { en: "{pn} <গানের নাম>  |  {pn} -a <গানের নাম>" },
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args.length) return api.sendMessage(
      "❌ উদাহরণ:\n/videov2 Bohemian Rhapsody\n/videov2 -a Bangla remix",
      threadID, messageID
    );

    // format check
    let fmt = "mp4";
    if (args[0]?.toLowerCase() === "-a" || args[0]?.toLowerCase() === "mp3") {
      fmt = "mp3";
      args.shift();
    }

    const keyword = args.join(" ").trim();
    if (!keyword) return api.sendMessage("❌ গানের নাম দিন।", threadID, messageID);

    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
      const result = await searchAndDownload(keyword, fmt);

      if (!result) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`⭕ "${keyword}" এর কোনো ফলাফল নেই।`, threadID, messageID);
      }

      const stream = await fastStream(result.url, `video.${fmt}`);

      await api.sendMessage(
        {
          body: `${fmt==="mp4"?"🎬":"🎵"} ${result.title}\n⏱️ ${result.time} | ${result.channel}\n📊 ${result.quality}`,
          attachment: stream
        },
        threadID, () => {}, messageID
      );
      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (e) {
      console.error("[videov2]", e.message);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`❌ ডাউনলোড ব্যর্থ: ${e.message?.slice(0,100)}`, threadID, messageID);
    }
  },
};

// startup cache warm
setTimeout(() => getApi().catch(() => {}), 2000);
