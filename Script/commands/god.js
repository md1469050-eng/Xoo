/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📡 god.js — গালি ও অসদাচরণ রোধ
  BELAL BOTX666 | Master: Belal YT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
"use strict";
module.exports.config = {
  name: "god",
  eventType: ["message"],
  version: "2.0.0",
  description: "গালিগালাজ ও অসদাচরণ সনাক্ত করে অ্যাডমিনকে জানায়",
};

const BAD_WORDS = [
  "মাদারচোদ","মাগি","বেশ্যা","খানকি","চুদ","চোদ","শালার","হারামজাদা",
  "কুত্তার বাচ্চা","শুয়োরের বাচ্চা","ছাগলের বাচ্চা","গাধার বাচ্চা",
  "fuck","shit","bitch","asshole","bastard","motherfucker",
];

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (event.type !== "message") return;
    const { body, senderID, threadID } = event;
    if (!body) return;

    const { ADMINBOT, SECURITY } = global.config;
    if (!SECURITY?.godEnabled) return;
    if (ADMINBOT.includes(String(senderID))) return;

    const lowerBody = body.toLowerCase();
    const foundWord = BAD_WORDS.find(w => lowerBody.includes(w.toLowerCase()));
    if (!foundWord) return;

    const userName = await getUserName(api, senderID);
    const threadInfo = await api.getThreadInfo(threadID);
    const threadName = threadInfo?.name || "গ্রুপ";

    const warnMsg =
      `🚨 সতর্কতা!\n👤 ${userName} অসদাচরণ করেছে!\n` +
      `💬 মেসেজ: "${body.slice(0, 80)}"\n` +
      `🏠 গ্রুপ: ${threadName}\n` +
      `🆔 Thread ID: ${threadID}\n` +
      `📅 সময়: ${new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}`;

    for (const adminID of ADMINBOT) {
      try { await api.sendMessage(warnMsg, adminID); } catch {}
    }

    await api.sendMessage(
      `⚠️ ${userName}, অনুগ্রহ করে সদাচরণ বজায় রাখুন।\n` +
      `❌ এই ধরনের ভাষা ব্যবহার নিষিদ্ধ।`,
      threadID
    );
  } catch (err) {
    global.log.error(`god ত্রুটি: ${err.message}`);
  }
};

async function getUserName(api, uid) {
  try { const i = await api.getUserInfo(uid); return i?.[uid]?.name || uid; } catch { return uid; }
}
