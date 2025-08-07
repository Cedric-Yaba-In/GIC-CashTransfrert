const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Vérifier que le hash fonctionne
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash valid:', isValid);
}

generateHash();