/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📡 antiJoin.js — অ্যান্টি-জয়েন সিস্টেম
  BELAL BOTX666 | Master: Belal YT
  ✅ Rooo Bot Compatible — handleEvent
  ✅ antiJoin চালু থাকলে নতুন সদস্য কিক করে
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
"use strict";

module.exports.config = {
  name: "antiJoin",
  eventType: ["log:subscribe"],
  version: "2.0.0",
  description: "antiJoin চালু থাকলে নতুন কাউকে গ্রুপে যোগ করতে দেয় না",
};

module.exports.handleEvent = async function ({ api, event, Threads }) {
  try {
    const { logMessageData, threadID, logMessageType } = event;
    if (logMessageType !== "log:subscribe") return;

    // ── থ্রেড সেটিংস চেক ──────────────────────────────────
    const threadData = global.data.threadData.get(String(threadID)) || {};
    if (!threadData.antiJoin) return;

    // বট নিজে জয়েন হলে এই ফিচার প্রযোজ্য নয়
    const addedList = logMessageData?.addedParticipants || [];
    if (addedList.some(p => String(p.userFbId || p.userID || p.id) === String(api.getCurrentUserID()))) return;

    // ── প্রতিটি নতুন সদস্যকে কিক করো ───────────────────────
    for (const participant of addedList) {
      const uid = String(participant.userFbId || participant.userID || participant.id || "");
      if (!uid || uid === "undefined") continue;

      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        await new Promise((resolve, reject) => {
          api.removeUserFromGroup(uid, threadID, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (kickErr) {
        global.log?.warn(`antiJoin kick ব্যর্থ [${uid}]: ${kickErr.message}`);
      }
    }

    // ── অ্যালার্ট মেসেজ (একবার) ──────────────────────────
    const alertMsg =
`╔══════════════════════════╗
  🚫  𝗔𝗡𝗧𝗜-𝗝𝗢𝗜𝗡 𝗔𝗖𝗧𝗜𝗩𝗘  🚫
╚══════════════════════════╝

⚠️ এই গ্রুপে এখন Anti-Join মোড চালু আছে।
নতুন কাউকে যোগ করা সম্ভব নয়।

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 𝗦𝘁𝗮𝘁𝘂𝘀  :  Anti-Join ON 🔴
🚷 𝗔𝗰𝘁𝗶𝗼𝗻  :  Member Removed ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

নতুন মেম্বার যোগ করতে হলে আগে Anti-Join বন্ধ করুন।

👑 𝗔𝗱𝗺𝗶𝗻  :  𝗕𝗘𝗟𝗔𝗟 (𝗩𝗲𝗿𝗶𝗳𝗶𝗲𝗱)
┈──╼ ❈✡️ চাঁদের পাহাড় ✿🪬 ╾──┈`;

    await api.sendMessage(alertMsg, threadID);

  } catch (err) {
    global.log?.error(`antiJoin ত্রুটি: ${err.message}`);
  }
};
