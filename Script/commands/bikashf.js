"use strict";
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
const fs = require("fs-extra");

const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const BOXES = [
  ["╔══『 💸 FAKE BKASH 』══╗","╚══════════════════════════╝"],
  ["«━━◤ 📱 BKASH RECEIPT ◢━━»","«━━━━━━━━━━━━━━━━━━━━━━━━━━»"],
  ["┏━━『 🟥 BKASH FAKE 』━━┓","┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛"],
  ["╔▓▓『 💰 PAYMENT SLIP 』▓▓╗","╚▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╝"],
];

module.exports.config = {
  name: "bkashf", version: "2.0.0", hasPermssion: 0,
  credits: "BELAL BOTX666", description: "Fake Bkash screenshot বানাও",
  commandCategory: "Fun", usages: "bkashf <number> - <txnID> - <amount>", cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const [bTop, bBot] = rand(BOXES);
  const sig = "\n┄┉❈চাঁদের~পাহাড়🪬❈┉┄";
  const input = args.join(" ");

  if (!input.includes("-")) return api.sendMessage(
`${bTop}
❌ ভুল format!
📝 ব্যবহার: bkashf 017xxxxxxxx - TXN123 - 1000
${bBot}`, threadID, messageID);

  const [numRaw, txnRaw, amtRaw] = input.split("-");
  const number = numRaw.trim(), txn = txnRaw.trim(), amount = amtRaw.trim();

  const APIS = [
    `https://masterapi.site/api/bkashf.php?number=${encodeURIComponent(number)}&transaction=${encodeURIComponent(txn)}&amount=${encodeURIComponent(amount)}`,
    `https://bk9.fun/fun/bkash?number=${encodeURIComponent(number)}&transaction=${encodeURIComponent(txn)}&amount=${encodeURIComponent(amount)}`,
  ];

  const wait = await api.sendMessage(`${bTop}\n📤 Generating...\n${bBot}`, threadID);
  let tmp = null;

  for (const url of APIS) {
    try {
      tmp = await downloadToTmp(url, `bkash_${Date.now()}.jpg`);
      if (tmp) break;
    } catch {}
  }

  await api.unsendMessage(wait.messageID).catch(()=>{});

  if (!tmp) return api.sendMessage("❌ Screenshot তৈরি ব্যর্থ! আবার চেষ্টা করুন।", threadID, messageID);

  try {
    await api.sendMessage({
      body:
`${bTop}
📸 FAKE BKASH SCREENSHOT ✅
━━━━━━━━━━━━━━━━━━
📱 Number : ${number}
🧾 TXN ID : ${txn}
💵 Amount : ৳${amount}
━━━━━━━━━━━━━━━━━━
${bBot}${sig}`,
      attachment: fs.createReadStream(tmp),
    }, threadID, messageID);
  } finally { cleanTmp(tmp); }
};
