const fs = require('fs');
const path = require('path');
const dirs = [
  'node_modules/react-native-screens',
  'node_modules/react-native-gesture-handler',
  'node_modules/@react-navigation/native',
  'node_modules/@react-navigation/native-stack',
  'node_modules/@react-navigation/bottom-tabs',
  'node_modules/socket.io-client',
  'node_modules/@react-native-async-storage/async-storage',
  'node_modules/react-native-safe-area-context',
  'node_modules/react-native-reanimated',
  'node_modules/@react-native-community/masked-view'
];
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const results = [];
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        walk(p);
      } else if (p.endsWith('.js') || p.endsWith('.mjs')) {
        const content = fs.readFileSync(p, 'utf8');
        if (content.includes('import.meta')) {
          results.push(p);
        }
      }
    }
  };
  walk(dir);
  if (results.length > 0) {
    console.log('FOUND in', dir);
    results.slice(0, 20).forEach((p) => console.log(p));
  }
}
