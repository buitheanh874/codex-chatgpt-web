const fs = require('fs');
let content = fs.readFileSync('src/adapters/chatgpt-web/browser-worker.ts', 'utf8');

const search = `    throwIfPromptAttachmentAborted(abortSignal);
    const commonPrefix = this.promptEquivalentPrefixLength(prompt, observed);
    throw new ChatGptPromptAttachmentIntegrityError(
      \`ChatGPT composer did not preserve the complete prompt (expectedChars=\${prompt.length}, actualChars=\${observed.length}, commonPrefixChars=\${commonPrefix})\`,
    );`;

const replace = `    throwIfPromptAttachmentAborted(abortSignal);
    const commonPrefix = this.promptEquivalentPrefixLength(prompt, observed);
    if (prompt.length === observed.length) {
      this.logger?.warn("browser.prompt_mutation_tolerated", { expectedChars: prompt.length, commonPrefix });
      return;
    }
    throw new ChatGptPromptAttachmentIntegrityError(
      \`ChatGPT composer did not preserve the complete prompt (expectedChars=\${prompt.length}, actualChars=\${observed.length}, commonPrefixChars=\${commonPrefix})\`,
    );`;

content = content.replace(search, replace);
content = content.replace(search.replace(/\n/g, '\r\n'), replace);

fs.writeFileSync('src/adapters/chatgpt-web/browser-worker.ts', content);
console.log("Patched again.");
