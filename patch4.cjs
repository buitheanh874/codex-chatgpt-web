const fs = require('fs');
let content = fs.readFileSync('src/adapters/chatgpt-web/browser-worker.ts', 'utf8');

const oldCheck = `    try {
      await Promise.all(files.map(file => (
        composerForm.getByRole("group", { name: file.name, exact: true })
          .waitFor({ state: "visible", timeout: 60_000 })
      )));
    } catch {`;

const newCheck = `    try {
      await Promise.all(files.map(file => (
        composerForm.getByRole("group", { name: file.name, exact: true })
          .waitFor({ state: "visible", timeout: 60_000 })
      )));
      
      const alerts = (await page.locator('[role="alert"]').allInnerTexts().catch(() => []))
        .map(text => text.replace(/\\s+/g, " ").trim())
        .filter(Boolean);
      if (alerts.length > 0) {
        throw new Error("Alerts present after upload");
      }
    } catch {`;

content = content.replace(oldCheck, newCheck);
// normalize CRLF just in case
content = content.replace(oldCheck.replace(/\n/g, '\r\n'), newCheck);
fs.writeFileSync('src/adapters/chatgpt-web/browser-worker.ts', content);
console.log('Patched upload verification');
