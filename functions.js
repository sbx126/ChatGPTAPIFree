import { CUSTOM_KEYS } from "./config.js";
import fs from "fs";
import path from "path";

async function* chunksToLines(chunksAsync) {
    let previous = "";
    for await (const chunk of chunksAsync) {
        const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        previous += bufferChunk;
        let eolIndex;
        while ((eolIndex = previous.indexOf("\n")) >= 0) {
            // line includes the EOL
            const line = previous.slice(0, eolIndex + 1).trimEnd();
            if (line === "data: [DONE]") break;
            if (line.startsWith("data: ")) yield line;
            previous = previous.slice(eolIndex + 1);
        }
    }
}

async function* linesToMessages(linesAsync) {
    for await (const line of linesAsync) {
        const message = line.substring("data :".length);

        yield message;
    }
}

async function* streamCompletion(data) {
    yield* linesToMessages(chunksToLines(data));
}

function generateId() {
    const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let id = "org-";
    for (let i = 0; i < 24; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function recordKeyUsage(key, tokensUsed) {
    // Get the current date
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    console.log(date);  
    //console.log(__dirname); 
    const USAGE_LOG_FILE = path.resolve("./logs", `usage_log_${date}.json`);
    console.log(USAGE_LOG_FILE);
    // Read the existing usage data
    let usageData = {};
    if (fs.existsSync(USAGE_LOG_FILE)) {
        usageData = JSON.parse(fs.readFileSync(USAGE_LOG_FILE, 'utf8'));
    }
  
    // Update the usage data for the given key and date
    usageData[key] = (usageData[key] || 0) + tokensUsed;
  
    // Write the updated usage data back to the file
    fs.writeFileSync(USAGE_LOG_FILE, JSON.stringify(usageData, null, 2));
  }

export { generateId, recordKeyUsage, streamCompletion }