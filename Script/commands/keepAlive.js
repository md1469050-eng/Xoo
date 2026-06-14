/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  BELAL BOTX666 — Keep Alive v2.1                    ║
 * ║  ✅ GitHub Actions port-conflict safe               ║
 * ║  ✅ Memory + uptime monitoring                      ║
 * ║  ✅ Render/Railway self-ping                        ║
 * ╚══════════════════════════════════════════════════════╝
 */
"use strict";
const express = require("express");
const axios   = require("axios");
const logger  = require("./log");

module.exports = function keepAlive() {
  const app  = express();
  const PORT = global.config?.Render?.port || process.env.PORT || 3000;
  const isCI = !!process.env.GITHUB_ACTIONS || !!process.env.CI;

  app.get("/", (req, res) => res.json({
    status:   "🟢 Online",
    bot:      "BELAL BOTX666 MAX",
    version:  "8.0.0",
    master:   "Belal YT — চাঁদের পাহাড়",
    uptime:   Math.floor(process.uptime()) + "s",
    commands: global.client?.commands?.size || 0,
    events:   global.client?.events?.size   || 0,
    memory:   Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
    time:     new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" }),
    env:      isCI ? "GitHub Actions" : "External Host",
  }));
  app.get("/ping",   (req, res) => res.send("🏓 Pong!"));
  app.get("/health", (req, res) => res.json({ status: "healthy", uptime: process.uptime() }));

  // Port conflict হলে next port try করো (GitHub Actions safe)
  const tryListen = (port, attempt = 0) => {
    const srv = app.listen(port, () => {
      logger.success(`🌐 Keep-Alive চালু: Port ${port}${isCI ? " [GitHub Actions]" : ""}`);
    });
    srv.on("error", e => {
      if (e.code === "EADDRINUSE" && attempt < 10) {
        tryListen(port + 1, attempt + 1);
      } else {
        logger.warn(`⚠️ Keep-Alive server ছাড়াই চলছে: ${e.message}`);
      }
    });
  };
  tryListen(PORT);

  // Self-ping — শুধু Render/Railway এর জন্য, GitHub Actions এ skip
  const pingURL = global.config?.Render?.pingURL;
  if (pingURL && !isCI) {
    const interval = global.config?.Render?.keepAliveInterval || 840000;
    let fails = 0;
    setInterval(async () => {
      try {
        await axios.get(pingURL + "/ping", { timeout: 10000 });
        fails = 0;
        logger.info("🏓 Keep-alive ping সফল!");
      } catch {
        if (++fails <= 3) logger.warn(`⚠️ Ping ব্যর্থ (${fails}/3)`);
      }
    }, interval);
  }
};
