const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

// --- CONFIGURATION ---
const BOT_TOKEN = '8361049528:AAEpZ0ppGNaAu8H_fPDnoOU5c-jxxsZBl50'; // Replace with your actual bot token
// AnimatedEmojies, FlagsEmoji
const STICKER_SET_NAME = 'AnimatedEmojies'; // The name of the pack
const OUTPUT_DIR = path.join(__dirname, 'stickers');

// --- API ENDPOINTS ---
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const FILE_BASE = `https://api.telegram.org/file/bot${BOT_TOKEN}`;

async function downloadStickerSet() {
  try {
    // 1. Create the output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 2. Fetch the sticker set metadata
    console.log(`Fetching metadata for sticker set: '${STICKER_SET_NAME}'...`);
    const setRes = await fetch(`${API_BASE}/getStickerSet?name=${STICKER_SET_NAME}`);
    const setData = await setRes.json();

    if (!setData.ok) {
      throw new Error(`Telegram API Error: ${setData.description}`);
    }

    const stickers = setData.result.stickers;
    console.log(`Found ${stickers.length} stickers. Starting download...`);
    // 3. Process and download each sticker
    for (let i = 0; i < stickers.length; i++) {
      const { file_id, file_unique_id, emoji } = stickers[i];

      // Fetch the actual file path from Telegram
      console.log('getFile')
      const fileRes = await fetch(`${API_BASE}/getFile?file_id=${file_id}`);
      const fileData = await fileRes.json();

      if (!fileData.ok) {
        console.error(`Failed to get file path for ${file_unique_id}: ${fileData.description}`);
        continue;
      }

      const filePath = fileData.result.file_path;
      const downloadUrl = `${FILE_BASE}/${filePath}`;

      // Format the filename. 
      // Format: <emoji>_<unique_id>.tgs (Prevents overwriting duplicates)
      const fileName = `${emoji}_${file_unique_id}.tgs`;
      const outputPath = path.join(OUTPUT_DIR, fileName);

      // Download and save the file
      console.log('actual download')
      const tgsRes = await fetch(downloadUrl);
      if (!tgsRes.ok) throw new Error(`Failed to download ${fileName}: ${tgsRes.statusText}`);

      // Stream the file directly to the disk
      const fileStream = fs.createWriteStream(outputPath);
      
      // We use pipeline to handle the Node Web Stream -> Node Writable Stream conversion safely
      await pipeline(tgsRes.body, fileStream);

      console.log(`[${i + 1}/${stickers.length}] Saved: ${fileName}`);
    }

    console.log('\n✅ All stickers downloaded successfully!');
  } catch (error) {
    console.error(error);
  }
}

downloadStickerSet();
