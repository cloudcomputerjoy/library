const bcrypt = require('bcryptjs');

(async () => {
  try {
    const password = 'TempAdmin@2026';
    const hash = await bcrypt.hash(password, 10);
    console.log(hash);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
