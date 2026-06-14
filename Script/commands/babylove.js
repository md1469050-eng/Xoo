"use strict";
const fs  = require("fs-extra");
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

const API_SOURCES = [
  "https://raw.githubusercontent.com/rummmmna21/rx-api/refs/heads/main/baseApiUrl.json",
  "https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json",
];
let _voiceApi = null;
async function getVoiceApi() {
  if (_voiceApi) return _voiceApi;
  for (const src of API_SOURCES) {
    try {
      const r = await safeGet(src, { timeout: 8000 });
      const base = r?.data?.voice || r?.data?.api;
      if (base) { _voiceApi = base.endsWith("/rx") ? base : base + "/rx"; return _voiceApi; }
    } catch {}
  }
  return null;
}

const marker  = "\u200B";
const wm      = t => t + marker;

const triggers = [
  { keywords: ["ghumabo"],          url: "https://files.catbox.moe/us0nva.mp3", reply: "😴 Okaay baby, sweet dreams 🌙" },
  { keywords: ["🤨🤨","🙄🙄"],     url: "https://files.catbox.moe/vgzkeu.mp3", reply: "jaki 🐥" },
  { keywords: ["ringtone"],         url: "https://files.catbox.moe/ga798u.mp3", reply: "💖 ay lo. Baby!" },
  { keywords: ["kanna"],            url: "https://files.catbox.moe/6xbjbb.mp3", reply: "" },
  { keywords: ["busy naki"],        url: "https://files.catbox.moe/cw9bdy.mp3", reply: "🥴🤔" },
  { keywords: ["bby explain"],      url: "https://files.catbox.moe/ijgma4.mp3", reply: "📝 go away!" },
  { keywords: ["mari gan","mari vabi gan"], url: "https://files.catbox.moe/vw58fi.mp3", reply: "" },
  { keywords: ["choose"],           url: "https://files.catbox.moe/hqw3my.mp3", reply: "🧃🐣" },
  { keywords: ["Dami un gar"],      url: "https://files.catbox.moe/07txpg.mp3", reply: "🎀 fuk u ukhe" },
  { keywords: ["amr girlfriend"],   url: "https://files.catbox.moe/v395oa.mp3", reply: "Oow 🫡🎀" },
];

const deepSongs = [
  { url: "https://files.catbox.moe/uodwqm.mp3", title: "🎵 Ei ta tmr jonno" },
  { url: "https://files.catbox.moe/v4i4uc.mp3", title: "🎶" },
  { url: "https://files.catbox.moe/tbdd6q.mp3", title: "🎧 kmn Hoise" },
  { url: "https://files.catbox.moe/5m6t42.mp3", title: "🔥 Created by rX" },
  { url: "https://files.catbox.moe/ag634t.mp3", title: "💥 ❤️‍🩹" },
  { url: "https://files.catbox.moe/k7gdw6.mp3", title: "🫠😊" },
  { url: "https://files.catbox.moe/wqrc2m.mp3", title: "🎀🧃" },
];

const songProgress = {};

module.exports.config = {
  name: "babylove", version: "2.0.0", hasPermssion: 0,
  credits: "BELAL BOTX666", description: "Voice trigger + AI reply",
  commandCategory: "auto", usages: "", cooldowns: 0, prefix: false,
};

async function sendAudio(api, threadID, messageID, url, reply) {
  let tmp = null;
  try {
    tmp = await downloadToTmp(url, `bl_${Date.now()}.mp3`);
    api.sendMessage({ body: wm(reply), attachment: fs.createReadStream(tmp) }, threadID, () => { if (tmp) cleanTmp(tmp, 1000); }, messageID);
  } catch { if (tmp) cleanTmp(tmp, 1000); }
}

async function sendSong(api, threadID, index, replyToID) {
  const song = deepSongs[index];
  let tmp    = null;
  try {
    tmp = await downloadToTmp(song.url, `song_${Date.now()}.mp3`);
    api.sendMessage({ body: wm(song.title), attachment: fs.createReadStream(tmp) }, threadID, (err, info) => {
      cleanTmp(tmp, 1000);
      if (!err) songProgress[threadID] = { index, msgID: info.messageID };
    }, replyToID);
  } catch { if (tmp) cleanTmp(tmp, 1000); }
}

module.exports.handleEvent = async function ({ api, event, Users }) {
  const msg = event.body?.toLowerCase();
  if (!msg) return;
  const { threadID, messageID, messageReply, senderID } = event;

  if (messageReply?.senderID === api.getCurrentUserID() && messageReply.body?.includes(marker)) {
    const text = msg.trim();
    if (!text) return;
    const rxAPI = await getVoiceApi();
    if (!rxAPI) return;
    try {
      const name = await Users.getNameUser(senderID).catch(() => "User");
      const r    = await safeGet(`${rxAPI}?text=${encodeURIComponent(text)}&senderName=${encodeURIComponent(name)}`, { timeout: 15000 });
      const replies = Array.isArray(r?.data?.response) ? r.data.response : [r?.data?.response];
      for (const rep of replies.filter(Boolean))
        await new Promise(res => api.sendMessage(wm(rep), threadID, () => res(), messageID));
    } catch {}
    return;
  }

  if (event.type === "message_reply" && ["next","arekta"].includes(msg.trim())) {
    const prog = songProgress[threadID];
    if (!prog || prog.msgID !== event.messageReply?.messageID) return;
    await sendSong(api, threadID, (prog.index + 1) % deepSongs.length, messageID);
    return;
  }

  for (const t of triggers) {
    if (t.keywords.some(k => msg.includes(k))) { await sendAudio(api, threadID, messageID, t.url, t.reply); return; }
  }

  if (msg.includes("ekta gan bolo"))
    await sendSong(api, threadID, Math.floor(Math.random() * deepSongs.length), messageID);
};

module.exports.run = () => {};
