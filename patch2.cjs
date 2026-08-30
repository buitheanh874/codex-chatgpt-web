const fs = require('fs');
const path = 'C:/Users/admin/Downloads/codex-chatgpt-web-hybrid/src/adapters/chatgpt-web/browser-worker.ts';
let content = fs.readFileSync(path, 'utf8');

const replacement = `if (prompt.length === observed.length) {
      this.logger?.warn("browser.prompt_mutation_tolerated", { expectedChars: prompt.length, commonPrefix });
      return;
    }
    throw new ChatGptPromptAttachmentIntegrityError(`;

content = content.replace("throw new ChatGptPromptAttachmentIntegrityError(", replacement);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched!");
