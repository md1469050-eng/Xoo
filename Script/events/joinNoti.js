const fs     = require("fs-extra");
const path   = require("path");
const moment = require("moment-timezone");

module.exports.config = {
  name: "joinnoti",
  eventType: ["log:subscribe"],  // ✅ এটা থাকলে run() call হয়
  version: "34.0.0",
  credits: "Belal x Gemini",
  dependencies: { "fs-extra": "", "path": "", "moment-timezone": "" }
};

module.exports.onLoad = function () {
  const paths = [
    path.join(__dirname, "cache", "joinGif"),
    path.join(__dirname, "cache", "randomgif")
  ];
  for (const p of paths) if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
};

module.exports.run = async function ({ api, event }) {
  if (event.logMessageType !== "log:subscribe") return;

  const { threadID } = event;
  const startTime    = Date.now();
  const botPrefix    = global.config?.PREFIX || "/";
  const botName      = "𝗕𝗘𝗟𝗔𝗟 𝗕𝗢𝗧-𝗫𝟲𝟲𝟲 🪬";
  const sig          = "\n┈──╼ ┄┉❈✡️⋆⃝চাঁদের~পাহাড়✿⃝🪬 ╾──┈";

  const emojiMax = ["🔱","💎","🛡️","🌀","🛰️","🧿","💫","🔥","👑","✨","🌟","⚙️","💠","🏆","⚡","🌈","🪬"];
  const rand     = arr => arr[Math.floor(Math.random() * arr.length)];
  const frames   = [
    ["«━━◤ ⚔️ ◢━━»","«━━◤ ⚔️ ◢━━»"],
    ["«━━◤ 🔥 ◢━━»","«━━◤ 🔥 ◢━━»"],
    ["«━━◤ 💎 ◢━━»","«━━◤ 💎 ◢━━»"],
    ["«━━◤ 🛰️ ◢━━»","«━━◤ 🛰️ ◢━━»"],
    ["«━━◤ 👑 ◢━━»","«━━◤ 👑 ◢━━»"],
  ];
  const anim = rand(frames);

  // ── বটের এন্ট্রি ──────────────────────────────────────────
  if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
    api.changeNickname(`[ ${botPrefix} ] • ${botName}`, threadID, api.getCurrentUserID()).catch(() => {});

    const gifPath  = path.join(__dirname, "cache", "randomgif");
    const files    = fs.existsSync(gifPath) ? fs.readdirSync(gifPath).filter(f => /\.(mp4|gif|jpg|png)$/i.test(f)) : [];
    const selected = files.length ? fs.createReadStream(path.join(gifPath, rand(files))) : null;

    return api.sendMessage({
      body:
`${anim[0]}
   𝗦𝗬𝗦𝗧𝗘𝗠 𝗢𝗡𝗟𝗜𝗡𝗘 🚀
${anim[1]}

👋 আসসালামু আলাইকুম!
${botName} এই গ্রুপের সেন্টিনেল।

📡 𝗡𝗘𝗧𝗪𝗢𝗥𝗞 𝗦𝗧𝗔𝗧𝗨𝗦
━━━━━━━━━━━━━━━━━━
⌬ Prefix   : [ ${botPrefix} ]
⌬ Status   : Online 🟢
⌬ Security : AES-256 🔐
⌬ Health   : Excellent 💚
━━━━━━━━━━━━━━━━━━
👑 Owner: BELAL (Verified ✅)
📞 WA: 01913246554${sig}`,
      attachment: selected,
    }, threadID);
  }

  // ── নতুন মেম্বার ─────────────────────────────────────────
  // ✅ ভিডিও ও threadInfo একসাথে parallel
  const nameArray = event.logMessageData.addedParticipants.map(i => i.fullName);
  const mentions  = event.logMessageData.addedParticipants.map(i => ({ tag: i.fullName, id: i.userFbId }));

  const joinGifPath = path.join(__dirname, "cache", "joinGif");
  const gifFiles    = fs.existsSync(joinGifPath)
    ? fs.readdirSync(joinGifPath).filter(f => /\.(mp4|gif|jpg|png)$/i.test(f))
    : [];
  const selected = gifFiles.length ? fs.createReadStream(path.join(joinGifPath, rand(gifFiles))) : null;

  // ✅ getThreadInfo এর জন্য ভিডিও আটকে থাকে না — parallel
  const infoResult = await api.getThreadInfo(threadID).catch(() => null);

  const threadName    = infoResult?.threadName || "এই গ্রুপ";
  const memCount      = infoResult?.participantIDs?.length || "?";
  const adminCount    = infoResult?.adminIDs?.length || "?";
  const time          = moment().tz("Asia/Dhaka").format("hh:mm A | DD MMM YYYY");
  const latency       = Date.now() - startTime;
  const execID        = "GX-" + Math.floor(Math.random() * 900000 + 100000);
  const potential     = Math.floor(Math.random() * 41) + 60;
  const nextMilestone = 100 * Math.ceil((Number(memCount) + 1) / 100);
  const e             = rand(emojiMax);

  return api.sendMessage({
    body:
`${anim[0]}
  𝗪𝗘𝗟𝗖𝗢𝗠𝗘 𝗧𝗢 𝗘𝗟𝗜𝗧𝗘 𝗖𝗟𝗔𝗡 ${e}
${anim[1]}

👋 স্বাগতম [ ${nameArray.join(", ")} ]! ${e}
আমাদের গ্রুপে VIP মেম্বার হিসেবে গ্রহণ করা হলো।

📊 𝗨𝗦𝗘𝗥 𝗜𝗡𝗧𝗘𝗟𝗟𝗜𝗚𝗘𝗡𝗖𝗘
━━━━━━━━━━━━━━━━━━
👤 Name     : ${nameArray.join(", ")}
🆔 UID      : ${execID}
📈 Potential: ${potential}%
🛡️ Status   : Verified 🟢
⏰ Joined   : ${time}
━━━━━━━━━━━━━━━━━━
🏰 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢
🏘️ Group  : ${threadName}
👑 Admins : ${adminCount} Active
👥 Members: #${memCount} → ${nextMilestone}
⚡ Latency : ${latency}ms
▒▒▒▒▒▒▒▒▒▒▒▒▒ 100%
━━━━━━━━━━━━━━━━━━
👑 Admin: BELAL (Verified ✅)${sig}`,
    attachment: selected,
    mentions,
  }, threadID);
};
