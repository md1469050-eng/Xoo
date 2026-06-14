# BELAL-BOTX666-MAX
2026 Advanced Messenger Chatbot by Belal

### <br>   ❖ DEPLOY_WORKFLOWS ❖
```
name: BELAL BOTX666

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
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install system dependencies
        run: |
          sudo apt-get update -qq
          sudo apt-get install -y ffmpeg python3 python3-pip build-essential --fix-missing || true
          sudo pip3 install -U yt-dlp --break-system-packages 2>/dev/null || \
          pip3 install -U yt-dlp 2>/dev/null || \
          sudo curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
            -o /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp || true
          which yt-dlp && yt-dlp --version && echo "✅ yt-dlp OK" || echo "❌ yt-dlp MISSING"

      - name: Create required folders
        run: |
          mkdir -p Script/commands/cache Script/events/cache/joinGif
          mkdir -p Script/events/leaveGif languages logs tmp backup utils assets
          [ -f Script/commands/cache/data.json ] || echo '{"adminbox":{}}' > Script/commands/cache/data.json
          echo "✅ Folders ready"

      - name: Inject API keys into config.json
        run: |
          node -e "
          const fs = require('fs');
          const c = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
          const k = JSON.parse(fs.readFileSync('keys.json', 'utf-8'));
          c.APIKEYS.GROQ     = k.GROQ_KEY    || '';
          c.APIKEYS.GROQ2    = k.GROQ_KEY2   || '';
          c.APIKEYS.GROQ3    = k.GROQ_KEY3   || '';
          c.APIKEYS.GROQ4    = k.GROQ_KEY4   || '';
          c.APIKEYS.GEMINI   = k.GEMINI_KEY  || '';
          c.APIKEYS.GEMINI2  = k.GEMINI_KEY2 || '';
          c.APIKEYS.GEMINI3  = k.GEMINI_KEY3 || '';
          c.APIKEYS.GEMINI4  = k.GEMINI_KEY4 || '';
          c.APIKEYS.VOICERSS = k.VOICERSS    || '7434460c8e2f4b39b8a21ac708f21fee';
          fs.writeFileSync('config.json', JSON.stringify(c, null, 2));
          console.log('✅ API keys injected');
          "

      - name: Install npm packages
        run: |
          npm install --legacy-peer-deps
          npm rebuild canvas --update-binary 2>/dev/null || true
          npm install string-similarity node-schedule --save --legacy-peer-deps 2>/dev/null || true

      - name: Anti-detect delay
        run: |
          DELAY=$((RANDOM % 20 + 10))
          echo "⏳ ${DELAY}s delay..."
          sleep $DELAY

      - name: Run Bot
        run: node index.js
        timeout-minutes: 350
        env:
          NODE_ENV: production
          TZ: Asia/Dhaka
          NODE_OPTIONS: "--max-old-space-size=4096"
          PATH: "/usr/local/bin:/usr/bin:/bin:$PATH"

      - name: Upload Crash Logs
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: crash-logs-${{ github.run_number }}
          path: logs/
          retention-days: 7
          if-no-files-found: ignore      
