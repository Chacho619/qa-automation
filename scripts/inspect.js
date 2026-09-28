import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { readConfig } from '../src/support/config.js';
import { createDriver } from '../src/support/driver.js';
import { loadSelectors, locator } from '../src/support/selectors.js';
const config = { ...readConfig(), headless: false };
const selectors = await loadSelectors(config);
const driver = await createDriver(config);
const terminal = createInterface({ input: stdin, output: stdout });
try {
  await driver.get(`${config.baseUrl}/tienda/home`);
  console.log('Navega manualmente a la pantalla por revisar. No se guardan cookies, HTML ni textos personales.');
  while (true) {
    if (await terminal.question('Enter: contar selectores visibles; q: salir. ') === 'q') break;
    for (const [name, definition] of Object.entries(selectors)) {
      let visible = 0;
      for (const element of await driver.findElements(locator(definition))) if (await element.isDisplayed()) visible++;
      console.log(`${name}: ${visible}`);
    }
  }
} finally { terminal.close(); await driver.quit(); }
