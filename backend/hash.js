import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Informe a senha como argumento. Ex.: node hash.js "GhostBoy21!!!"');
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
} catch (err) {
  console.error(err);
  process.exit(1);
}
