const { db, runMigrations, save } = require('./index');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const now = new Date().toISOString();

function seed() {
  runMigrations();
  
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount > 0) {
    console.log('[Seed] Already seeded');
    return;
  }

  console.log('[Seed] Seeding...');
  const pw = bcrypt.hashSync(env.defaultAdminPassword, 10);

  // Admin
  db.prepare('INSERT INTO users (name, email, password_hash, role, status, account_type, current_credit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('Admin', 'admin@showmodel.com', pw, 'admin', 'active', 'subscription', 100, now, now);
  save();

  // Providers
  const providers = [
    { n: 'Google Gemini', s: 'gemini', d: 'gemini', u: 'https://generativelanguage.googleapis.com/v1', dsc: 'Google Gemini AI' },
    { n: 'OpenAI', s: 'openai', d: 'openai', u: 'https://api.openai.com/v1', dsc: 'OpenAI GPT Models' },
    { n: 'Anthropic', s: 'anthropic', d: 'anthropic', u: 'https://api.anthropic.com', dsc: 'Anthropic Claude' },
    { n: 'Mistral', s: 'mistral', d: 'mistral', u: 'https://api.mistral.ai/v1', dsc: 'Mistral AI' },
    { n: 'Groq', s: 'groq', d: 'openai', u: 'https://api.groq.com/openai/v1', dsc: 'Groq (Llama, Mixtral)' },
    { n: 'Grok AI', s: 'grok', d: 'openai', u: 'https://api.x.ai/v1', dsc: 'xAI Grok' },
    { n: 'Kie.ai', s: 'kie', d: 'kie', u: 'https://api.kie.ai/v1', dsc: 'Kie.ai Gemini' },
    { n: 'Novita', s: 'novita', d: 'openai', u: 'https://api.novita.ai/v3', dsc: 'Novita AI' },
    { n: 'Perplexity', s: 'perplexity', d: 'openai', u: 'https://api.perplexity.ai', dsc: 'Perplexity AI' },
    { n: 'SambaNova', s: 'sambanova', d: 'openai', u: 'https://api.sambanova.net/v1', dsc: 'SambaNova' },
    { n: 'Together AI', s: 'together', d: 'openai', u: 'https://api.together.xyz/v1', dsc: 'Together AI' },
    { n: 'Cloudflare Workers AI', s: 'cloudflare', d: 'cloudflare', u: 'https://api.cloudflare.com/client/v4', dsc: 'Cloudflare Workers AI' },
  ];
  for (const p of providers) {
    db.prepare('INSERT INTO ai_providers (name, slug, driver, base_url, status, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(p.n, p.s, p.d, p.u, 'active', p.dsc, now, now);
  }
  save();

  // Models - one per provider
  const models = [
    { pid: 1, n: 'Gemini 2.0 Flash', c: 'gemini-2.0-flash-exp-02-05', d: 1 },
    { pid: 2, n: 'GPT-4o', c: 'gpt-4o', d: 1 },
    { pid: 3, n: 'Claude 3.5 Sonnet', c: 'claude-3-5-sonnet-20241022', d: 1 },
    { pid: 4, n: 'Mistral Large', c: 'mistral-large-latest', d: 1 },
    { pid: 5, n: 'Llama 3.3 70B', c: 'llama-3.3-70b-versatile', d: 1 },
    { pid: 6, n: 'Grok 2', c: 'grok-2-1212', d: 1 },
    { pid: 7, n: 'Gemini 3 Flash', c: 'gemini-3-flash-v1betamodels', d: 1 },
    { pid: 8, n: 'Llama 3.1 70B', c: 'Llama-3.1-70B-Instruct', d: 1 },
    { pid: 9, n: 'Llama 3.1 8B', c: 'Llama-3.1-8B-Instruct', d: 1 },
    { pid: 10, n: 'Llama 3.2 90B', c: 'Llama-3.2-90B-Vision-Instruct', d: 1 },
    { pid: 11, n: 'Llama 3.2 11B', c: 'Llama-3.2-11B-Vision-Instruct', d: 1 },
    { pid: 12, n: '@cf/meta/meta-model', c: '@cf/meta/meta-model', d: 1 },
  ];
  for (const m of models) {
    db.prepare('INSERT INTO provider_models (provider_id, name, model_code, is_default, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(m.pid, m.n, m.c, m.d, 'active', now, now);
  }
  save();

  // Packages
  const pkgs = [
    { n: 'Starter', t: 'credit', p: 50000, c: 10, d: '10 credits' },
    { n: 'Pro Pack', t: 'credit', p: 250000, c: 60, d: '60 credits - save 20%' },
    { n: 'Premium', t: 'credit', p: 500000, c: 150, d: '150 credits - save 50%' },
    { n: 'Monthly Pro', t: 'duration', p: 500000, dy: 30, d: 'Unlimited 30 days' },
    { n: 'BYOK Add-on', t: 'byok', p: 100000, dy: 30, d: 'Bring your own key' },
  ];
  for (const pkg of pkgs) {
    db.prepare('INSERT INTO subscription_packages (name, package_type, price_amount, credit_amount, duration_days, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(pkg.n, pkg.t, pkg.p, pkg.c || 0, pkg.dy || 0, pkg.d, 'active', now, now);
  }
  save();

  // Payment methods
  const pm = [
    { n: 'BCA', c: 'bca', t: 'bank', an: 'PT ShowModel', ac: '1234567890', i: 'Transfer BCA 1234567890' },
    { n: 'Mandiri', c: 'mandiri', t: 'bank', an: 'PT ShowModel', ac: '0987654321', i: 'Transfer Mandiri 0987654321' },
    { n: 'Dana', c: 'dana', t: 'ewallet', an: '081234567890', ac: '081234567890', i: 'Send to Dana 081234567890' },
  ];
  for (const m of pm) {
    db.prepare('INSERT INTO payment_methods (name, code, type, account_name, account_number, instructions, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(m.n, m.c, m.t, m.an, m.ac, m.i, 'active', now, now);
  }
  save();

  // Settings
  const ss = [
    // General
    { g: 'general', k: 'general.app_name', t: 'string', v: 'ShowModel', d: 'ShowModel', desc: 'App name', o: 1, pub: false },
    { g: 'general', k: 'general.app_description', t: 'string', v: 'AI Adobe Stock metadata', d: 'AI Adobe Stock metadata', desc: 'App desc', o: 2, pub: false },
    { g: 'general', k: 'general.support_email', t: 'string', v: 'support@showmodel.com', d: 'support@showmodel.com', desc: 'Support email', o: 3, pub: true },
    
    // Registration
    { g: 'registration', k: 'registration.free_credit_on_signup', t: 'number', v: '5', d: '5', desc: 'Free credits on signup', o: 10, pub: false },
    { g: 'registration', k: 'registration.require_email_verification', t: 'boolean', v: 'false', d: 'false', desc: 'Require email verification', o: 11, pub: false },
    
    // Generation
    { g: 'generation', k: 'generation.default_provider_id', t: 'number', v: '1', d: '1', desc: 'Default provider', o: 20, pub: false },
    { g: 'generation', k: 'generation.request_timeout_ms', t: 'number', v: '60000', d: '60000', desc: 'Request timeout (ms)', o: 21, pub: false },
    { g: 'generation', k: 'generation.max_batch_items', t: 'number', v: '5', d: '5', desc: 'Max batch items', o: 22, pub: false },
    { g: 'generation', k: 'generation.max_image_size_mb', t: 'number', v: '10', d: '10', desc: 'Max image size (MB)', o: 23, pub: false },
    { g: 'generation', k: 'generation.daily_credit_limit', t: 'number', v: '100', d: '100', desc: 'Daily credit limit for free users', o: 24, pub: false },
    
    // Payments
    { g: 'payments', k: 'payments.min_deposit', t: 'number', v: '10000', d: '10000', desc: 'Minimum deposit (IDR)', o: 30, pub: false },
    { g: 'payments', k: 'payments.max_deposit', t: 'number', v: '100000000', d: '100000000', desc: 'Maximum deposit (IDR)', o: 31, pub: false },
    { g: 'payments', k: 'payments.auto_approve', t: 'boolean', v: 'false', d: 'false', desc: 'Auto-approve payments', o: 32, pub: false },
    
    // API Keys
    { g: 'api', k: 'api.rate_limit_per_minute', t: 'number', v: '10', d: '10', desc: 'Rate limit per minute', o: 40, pub: false },
    { g: 'api', k: 'api.max_retries', t: 'number', v: '3', d: '3', desc: 'Max API retries', o: 41, pub: false },
  ];
  for (const s of ss) {
    db.prepare('INSERT INTO app_settings (group_key, setting_key, value_type, value_text, default_value_text, is_public, is_editable, description, validation_rules, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(s.g, s.k, s.t, s.v, s.d, s.pub ? 1 : 0, 1, s.desc, null, s.o, now, now);
  }
  save();

  // Coupon
db.prepare('INSERT INTO coupons (code, name, discount_type, discount_value, min_purchase_amount, usage_limit, status, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run('WELCOME20', 'Welcome Bonus', 'percentage', 20, 0, 100, 'active', '20% off', now, now);
  save();
 
  console.log('[Seed] Done');
}

module.exports = { seed };