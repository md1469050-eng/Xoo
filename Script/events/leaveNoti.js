const axios  = require("axios");
const fs     = require("fs-extra");
const path   = require("path");
const Canvas = require("canvas");
const moment = require("moment-timezone");

module.exports.config = {
  name: "leave",
  version: "20.0.0",
  credits: "Belal x Gemini",
  description: "স্পেশাল ডার্ক নিওন কার্ড — parallel download",
  // ✅ eventType নেই — তাই handleEvent() call হবে
};

module.exports.handleEvent = async function ({ api, event, Users }) {
  if (event.logMessageType !== "log:unsubscribe") return;
  if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

  const { threadID } = event;
  const leftID       = event.logMessageData.leftParticipantFbId;
  const isSelf       = event.author == leftID;
  const time         = moment.tz("Asia/Dhaka").format("hh:mm A | DD/MM/YYYY");

  const emojiMax = ["🔱","💎","🛡️","🛸","🌀","🛰️","🦾","🧿","💫","🎐","🐉","🔥","👑","🌠","🌌","✨","🌟","🔮","⚡","🌈","🏆","🎖️","🪬"];
  const rand     = arr => arr[Math.floor(Math.random() * arr.length)];

  let name = "Facebook User";
  try {
    name = global.data?.userName?.get(leftID)
        || global.data?.userName?.get(String(leftID))
        || await Users.getNameUser(leftID);
  } catch {}

  const roastTxt = isSelf
    ? `নিজে নিজেই পালালি? ${rand(emojiMax)} রাস্তা মাপ আবাল! যা ভাগ! 💩`
    : `থাকার যোগ্যতা নেই তোর! 😡 তোকে সজোরে একটা লাথি মেরে বের করে দেওয়া হলো! 👞💥`;

  const cacheDir  = path.join(__dirname, "cache");
  const cachePath = path.join(cacheDir, `leave_${leftID}.png`);
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  try {
    const avatarUrl = `https://graph.facebook.com/${leftID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    // ✅ avatar + background একসাথে parallel — দ্রুততম উপায়
    const [avatarRes, bgRes] = await Promise.all([
      axios.get(avatarUrl, { responseType: "arraybuffer", timeout: 6000 })
        .catch(() => axios.get("https://i.imgur.com/6ve9YAs.png", { responseType: "arraybuffer", timeout: 5000 })),
      axios.get("https://i.ibb.co/qyfD9wD/bg3.jpg", { responseType: "arraybuffer", timeout: 6000 })
        .catch(() => null),
    ]);

    const canvas = Canvas.createCanvas(1200, 700);
    const ctx    = canvas.getContext("2d");

    // Background
    if (bgRes?.data) {
      ctx.drawImage(await Canvas.loadImage(bgRes.data), 0, 0, 1200, 700);
    } else {
      const bg = ctx.createLinearGradient(0,0,1200,700);
      bg.addColorStop(0,"#03001C"); bg.addColorStop(.5,"#1B0033"); bg.addColorStop(1,"#03001C");
      ctx.fillStyle = bg; ctx.fillRect(0,0,1200,700);
    }

    // Glass card
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(400,150,750,450,40);
    else ctx.rect(400,150,750,450);
    ctx.fill();
    ctx.strokeStyle = "#FF0000"; ctx.lineWidth = 10; ctx.stroke();

    // Avatar
    ctx.save();
    ctx.shadowColor = "#FF0000"; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(250,375,180,0,Math.PI*2);
    ctx.fillStyle = "#FF0000"; ctx.fill();
    ctx.beginPath(); ctx.arc(250,375,170,0,Math.PI*2); ctx.clip();
    ctx.drawImage(await Canvas.loadImage(avatarRes.data), 80,205,340,340);
    ctx.restore();

    // Header
    ctx.font = "bold 80px Arial"; ctx.fillStyle = "#FF0000";
    ctx.shadowColor = "#FF0000"; ctx.shadowBlur = 20;
    ctx.fillText("REST IN HELL", 450, 120);

    // Divider
    ctx.font = "bold 35px Arial"; ctx.fillStyle = "#00FFFF";
    ctx.shadowColor = "#00FFFF"; ctx.shadowBlur = 8;
    ctx.fillText("━━━━━━━ 𝗨𝗦𝗘𝗥 𝗘𝗫𝗜𝗧 ━━━━━━━", 460, 250);

    // Info
    ctx.font = "40px Arial"; ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#000"; ctx.shadowBlur = 5;
    ctx.fillText(`👤 𝗡𝗮𝗺𝗲 : ${name}`, 460, 340);
    ctx.fillText(`🆔 𝗜𝗗   : ${leftID}`, 460, 420);
    ctx.fillText(`⏰ 𝗧𝗶𝗺𝗲 : ${time}`, 460, 500);

    // Footer
    ctx.font = "bold 40px Arial"; ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FFD700"; ctx.shadowBlur = 12;
    ctx.fillText("👑 𝗔𝗱𝗺𝗶𝗻 : 𝗕𝗘𝗟𝗔𝗟 (𝗩𝗲𝗿𝗶𝗳𝗶𝗲𝗱)", 460, 570);

    fs.writeFileSync(cachePath, canvas.toBuffer());

    const finalMsg =
`┏━━━━━━━  ${rand(emojiMax)}  ━━━━━━━┓
   ⚠️ 𝗟𝗢𝗦𝗘𝗥 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗 ⚠️
┗━━━━━━━  ${rand(emojiMax)}  ━━━━━━━┛

আহারে ${name}! ${rand(emojiMax)}
${roastTxt}

👑 𝗔𝗱𝗺𝗶𝗻: 𝗕𝗘𝗟𝗔𝗟 (𝗩𝗲𝗿𝗶𝗳𝗶𝗲𝗱)
┈──╼ ┄┉❈${rand(emojiMax)}⋆⃝চাঁদের~পাহাড়${rand(emojiMax)}`;

    return api.sendMessage({
      body: finalMsg,
      attachment: fs.createReadStream(cachePath),
    }, threadID, () => { try { fs.unlinkSync(cachePath); } catch {} });

  } catch (e) { console.error("leaveNoti:", e.message); }
};
