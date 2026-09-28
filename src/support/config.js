import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = fileURLToPath(new URL('../../', import.meta.url));
export function readConfig(env = process.env) {
  const base = new URL(env.BASE_URL || 'https://www.liverpool.com.mx');
  if (base.protocol !== 'https:' || base.username || base.password) throw new Error('BASE_URL debe ser HTTPS y no contener credenciales');
  const waitMs = Number(env.WAIT_MS || 20000);
  if (!Number.isInteger(waitMs) || waitMs < 100 || waitMs > 120000) throw new Error('WAIT_MS inválido');
  const loginWaitMs = Number(env.LOGIN_WAIT_MS || 120000);
  if (!Number.isInteger(loginWaitMs) || loginWaitMs < 1000 || loginWaitMs > 300000) throw new Error('LOGIN_WAIT_MS inválido');
  for (const key of ['HEADLESS', 'SCREENSHOTS', 'CLICK_BUY_NOW']) {
    if (env[key] && !['true', 'false'].includes(env[key])) throw new Error(`${key} debe ser true o false`);
  }
  return {
    baseUrl: base.origin, waitMs, loginWaitMs, headless: env.HEADLESS === 'true',
    screenshots: env.SCREENSHOTS === 'true', clickBuyNow: env.CLICK_BUY_NOW === 'true',
    profile: path.resolve(root, env.PROFILE_DIR || '.session/chrome'),
    productsFile: path.resolve(root, env.PRODUCTS_FILE || 'data/products.json'),
    selectorsFile: env.SELECTORS_FILE ? path.resolve(root, env.SELECTORS_FILE) : null,
    driverPath: env.CHROMEDRIVER_PATH, binary: env.CHROME_BINARY,
    checkoutPattern: new RegExp(env.CHECKOUT_PATH_PATTERN || '^/tienda/checkout(?:/|$)'),
  };
}
