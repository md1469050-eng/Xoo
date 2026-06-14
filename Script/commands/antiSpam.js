/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📡 antiSpam.js — স্প্যাম রোধ সিস্টেম
  BELAL BOTX666 | Master: Belal YT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
"use strict";
const spamMap = new Map();

module.exports.config = {
  name: "antiSpam",
  eventType: ["message"],
  version: "2.0.0",
  description: "স্প্যাম বার্তা সনাক্ত করে ব্যবস্থা নেয়",
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (event.type !== "message") return;
    const { senderID, threadID } = event;
    const sid = String(senderID);
    const { ADMINBOT, ANTI_ABUSE } = global.config;
    if (!ANTI_ABUSE?.blockSpam) return;
    if (ADMINBOT.includes(sid)) return;

    const now = Date.now();
    const key = `${sid}_${threadID}`;
    const limit = ANTI_ABUSE.spamThreshold || 5;
    const cooldown = (ANTI_ABUSE.spamCooldown || 60) * 1000;

    if (!spamMap.has(key)) spamMap.set(key, { count: 0, firstMsg: now, warned: false });
    const data = spamMap.get(key);

    if (now - data.firstMsg > cooldown) {
      data.count = 1; data.firstMsg = now; data.warned = false;
    } else {
      data.count++;
    }

    if (data.count >= limit && !data.warned) {
      data.warned = true;
      const name = await getUserName(api, sid);
      await api.sendMessage(
        `⚠️ ${name}, স্প্যাম করা বন্ধ করুন!\n🚫 ${cooldown / 1000} সেকেন্ড কুলডাউন চলছে।`,
        threadID
      );
    }
  } catch {}
};

async function getUserName(api, uid) {
  try { const i = await api.getUserInfo(uid); return i?.[uid]?.name || uid; } catch { return uid; }
}
