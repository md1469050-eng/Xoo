"use strict";
const fs = require("fs-extra");
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

const IMGS = ["https://i.postimg.cc/wTZJ1Yvb/images-1-29.jpg","https://i.postimg.cc/ZRN79xP1/97420.jpg","https://i.postimg.cc/tCB54cQs/27712360-320x180.jpg","https://i.postimg.cc/Mp4myjGx/556-contact-01749889097.jpg","https://i.postimg.cc/rm2GHXWP/images-2022-08-16-T112453-202.jpg","https://i.postimg.cc/ZYcPwQqw/www-bangla-xxx-com.jpg","https://i.postimg.cc/SQvRQL1y/990-young.jpg","https://i.postimg.cc/FHQSb5tW/horny-booby-girl-moaning-hard-fingering-pussy.jpg","https://i.postimg.cc/0NzwGp5n/Hot-Indian-lovers-standing-sex-MMS.jpg","https://i.postimg.cc/02H5Yh6g/Hot-Desi-girl-striptease-nude-dance.jpg","https://i.postimg.cc/CMQ9m044/naughty-Bhabhi-licking-own-nipples.jpg","https://i.postimg.cc/RFjyCQhD/cute-girl-showing-her-big-round-boobs.jpg","https://i.postimg.cc/VsqDbcV6/beautiful-Pakistani-girl-salwar-striptease-show.jpg","https://i.postimg.cc/kXZ6J2vt/sexy-Girl-shows-boobs-and-pussy-many-clips-merged.jpg","https://i.postimg.cc/XYkrws09/sexy-horny-girl-fingering-masturbating-with-bottle.jpg","https://i.postimg.cc/g03mvQWD/10-272.jpg","https://i.postimg.cc/7L1jPT0H/young-lovers-enjoying-nude-sex-on-selfie-cam.jpg","https://i.postimg.cc/fRnH3RwJ/foreplay-sex-with-beautiful-Bhabhi-before-fucking.jpg","https://i.postimg.cc/Hkgfq28Z/NRI-Punjabi-girl-showing-her-big-boobies.jpg","https://i.postimg.cc/yNWntgjp/unsatisfied-Desi-Milf-showing-her-big-clit.jpg","https://i.postimg.cc/NjCk6Gt6/Desi-girl-showing-her-cute-small-boobies-on-VC.jpg","https://i.postimg.cc/7YW5X5CZ/Desi-couple-hot-romance-in-shower.jpg","https://i.postimg.cc/xTCkKv1Z/Bangladeshi-cute-village-girl-showing-boobs-on-video-call.jpg","https://i.postimg.cc/V6kw3FpQ/Indian-girl-shows-her-boobs-and-pussy.jpg","https://i.postimg.cc/hjQnDGDp/sexy-ass-Bhabhi-fucked-doggy-style-with-moanings-1.jpg","https://i.postimg.cc/13W1DF4v/cute-college-girl-showing-her-shaved-pussy-on-VC.jpg","https://i.postimg.cc/Hn0fncf4/beautiful-college-girl-showing-her-tiny-tits.jpg","https://i.postimg.cc/8PKZHmBf/Pakistani-mature-girl-paid-to-expose-her-assets.jpg","https://i.postimg.cc/QMLk44BC/skinny-Desi-girl-masturbating-pussy-with-brinjal.jpg","https://i.postimg.cc/tJ7xCW18/Indian-lovers-hot-foreplay-sex-in-front-of-mirror.jpg"];

module.exports.config = {
  name: "hot pp", version: "2.0.0", hasPermssion: 0,
  credits: "BELAL BOTX666", description: "Hot pp ছবি",
  commandCategory: "Random-IMG", usages: "hot pp", cooldowns: 2,
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;
  const url = IMGS[Math.floor(Math.random() * IMGS.length)];
  let tmp   = null;
  try {
    tmp = await downloadToTmp(url, `hotpp_${Date.now()}.jpg`);
    await api.sendMessage({ body: "যাও এনার সাথে কাজ করো 🥵😆🤌\n┄┉❈চাঁদের~পাহাড়🪬❈┉┄", attachment: fs.createReadStream(tmp) }, threadID, messageID);
  } catch { api.sendMessage("❌ ছবি লোড ব্যর্থ।", threadID, messageID); }
  finally { if (tmp) cleanTmp(tmp); }
};
