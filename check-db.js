const { initDatabase, db, save } = require('./src/db');

async function main() {
  await initDatabase();
  const users = db.prepare('SELECT id, name, email, current_credit FROM users').all();
  console.log('Users:', JSON.stringify(users, null, 2));
  
  const { getSetting } = require('./src/services/settings.service');
  const freeCreditSetting = getSetting('registration.free_credit_on_signup', 5);
  console.log('Free credit setting:', freeCreditSetting);
}

main().catch(console.error);
