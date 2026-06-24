name: BELAL BOTX666 MAX

on:
  workflow_dispatch:
  push:
    branches: [main]
  schedule:
    - cron: "0 */6 * * *"

concurrency:
  group: bot-runner
  cancel-in-progress: true

jobs:
  bot:
    runs-on: ubuntu-latest
    timeout-minutes: 360

    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: ⚙️ Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          # cache সরিয়ে দেওয়া হয়েছে — package-lock.json না থাকলে error হয়

      - name: 🛠️ Install System Dependencies
        run: |
          sudo apt-get update -qq
          sudo apt-get install -y ffmpeg python3 python3-pip build-essential --fix-missing || true
          sudo pip3 install -U yt-dlp --break-system-packages 2>/dev/null || true
          which yt-dlp && yt-dlp --version && echo "✅ yt-dlp OK" || echo "⚠️ yt-dlp missing"

      - name: 📁 Create Required Folders
        run: |
          mkdir -p Script/commands/cache Script/events/cache/joinGif Script/events/cache/randomgif
          mkdir -p Script/utils languages logs tmp backup assets utils
          [ -f Script/commands/cache/data.json ] || echo '{"adminbox":{}}' > Script/commands/cache/data.json
          [ -f Script/utils/apiHelper.js ] || cp utils/apiHelper.js Script/utils/apiHelper.js 2>/dev/null || true
          echo "✅ Folders ready"

      - name: 🔑 Inject API Keys
        run: |
          node -e "
          const fs = require('fs');
          try {
            const c = JSON.parse(fs.readFileSync('config.json','utf-8'));
            const k = JSON.parse(fs.readFileSync('keys.json','utf-8'));
            if (!c.APIKEYS) c.APIKEYS = {};
            c.APIKEYS.GROQ     = k.GROQ_KEY    || c.APIKEYS.GROQ    || '';
            c.APIKEYS.GROQ2    = k.GROQ_KEY2   || c.APIKEYS.GROQ2   || '';
            c.APIKEYS.GROQ3    = k.GROQ_KEY3   || c.APIKEYS.GROQ3   || '';
            c.APIKEYS.GROQ4    = k.GROQ_KEY4   || c.APIKEYS.GROQ4   || '';
            c.APIKEYS.GEMINI   = k.GEMINI_KEY  || c.APIKEYS.GEMINI  || '';
            c.APIKEYS.GEMINI2  = k.GEMINI_KEY2 || c.APIKEYS.GEMINI2 || '';
            c.APIKEYS.GEMINI3  = k.GEMINI_KEY3 || c.APIKEYS.GEMINI3 || '';
            c.APIKEYS.GEMINI4  = k.GEMINI_KEY4 || c.APIKEYS.GEMINI4 || '';
            c.APIKEYS.VOICERSS = k.VOICERSS    || c.APIKEYS.VOICERSS|| '';
            fs.writeFileSync('config.json', JSON.stringify(c, null, 2));
            console.log('✅ API keys injected');
          } catch(e) { console.log('⚠️ Key injection:', e.message); }
          "

      - name: 📦 Install NPM Packages
        run: |
          npm install --legacy-peer-deps
          npm rebuild canvas --update-binary 2>/dev/null || true
          npm install string-similarity node-schedule form-data --save --legacy-peer-deps 2>/dev/null || true
          echo "✅ Packages installed"

      - name: ⏳ Anti-Detect Delay
        run: |
          DELAY=$((RANDOM % 15 + 5))
          echo "⏳ ${DELAY}s delay..."
          sleep $DELAY

      - name: 🤖 Run Bot
        run: node index.js
        timeout-minutes: 350
        continue-on-error: true
        env:
          NODE_ENV: production
          TZ: Asia/Dhaka
          NODE_OPTIONS: "--max-old-space-size=4096"
          UV_THREADPOOL_SIZE: 8
          PATH: "/usr/local/bin:/usr/bin:/bin:$PATH"

      - name: 💾 Save Crash Logs
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: crash-logs-${{ github.run_number }}
          path: logs/
          retention-days: 7
          if-no-files-found: ignore
