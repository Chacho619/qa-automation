import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { readConfig } from '../src/support/config.js';
import { createDriver } from '../src/support/driver.js';
import { loadSelectors } from '../src/support/selectors.js';
import { BasePage } from '../src/pages/BasePage.js';
import { LoginPage } from '../src/pages/LoginPage.js';
const config = { ...readConfig(), headless: false };
const driver = await createDriver(config);
let terminal;
try {
  if (!process.argv.includes('--manual')) {
    await new LoginPage(driver, config, await loadSelectors(config)).ensureAuthenticated();
    console.log('Sesión confirmada. Ya puedes ejecutar el E2E. La bolsita debe estar vacía.');
  } else {
    terminal = createInterface({ input: stdin, output: stdout });
    await driver.get(`${config.baseUrl}/tienda/home`);
    console.log('Inicia sesión manualmente en Chrome con una cuenta de prueba. No escribas credenciales en esta terminal.');
    await terminal.question('Deja la bolsita vacía, vuelve a la portada y pulsa Enter aquí. ');
    await new BasePage(driver, config, await loadSelectors(config)).assertAuthenticated();
    console.log('Sesión detectada. El perfil local queda excluido de Git.');
  }
} finally { terminal?.close(); await driver.quit(); }
