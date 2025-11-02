const fs = require('fs');
const path = require('path');

const appDir = path.join(process.cwd(), 'src', 'app');
console.log('📁 App directory:', appDir);
console.log('Exists?', fs.existsSync(appDir));

const localeDir = path.join(appDir, '[locale]');
console.log('\n📁 [locale] directory:', localeDir);
console.log('Exists?', fs.existsSync(localeDir));

const pagePath = path.join(localeDir, 'page.tsx');
console.log('\n📄 page.tsx:', pagePath);
console.log('Exists?', fs.existsSync(pagePath));

if (fs.existsSync(localeDir)) {
  const files = fs.readdirSync(localeDir);
  console.log('\n📋 Files in [locale]:');
  files.forEach(f => console.log('  -', f));
}
