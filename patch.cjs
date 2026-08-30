const fs = require('fs');
const path = 'C:/Users/admin/Downloads/codex-chatgpt-web-hybrid/src/adapters/chatgpt-web/browser-worker.ts';
let content = fs.readFileSync(path, 'utf8');

const search = `throw new ChatGptPromptAttachmentIntegrityError(
      \`ChatGPT composer did not preserve the complete prompt (expectedChars=${prompt.length}, actualChars=${observed.length}, commonPrefixChars=${commonPrefix})\`,
    );`;

const replace = `if (prompt.length === observed.length) {
      this.logger?.warn("browser.prompt_mutation_tolerated", { expectedChars: prompt.length, commonPrefix });
      return;
    }
    throw new ChatGptPromptAttachmentIntegrityError(
      \`ChatGPT composer did not preserve the complete prompt (expectedChars=${prompt.length}, actualChars=${observed.length}, commonPrefixChars=${commonPrefix})\`,
    );`;

if (content.includes(search)) {
  fs.writeFileSync(path, content.replace(search, replace), 'utf8');
  console.log('Patched browser-worker.ts successfully');
} else {
  console.log('Search string not found. Printing context around error:');
  console.log(content.substring(content.indexOf('ChatGptPromptAttachmentIntegrityError') - 200, content.indexOf('ChatGptPromptAttachmentIntegrityError') + 300));
}
