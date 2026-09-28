import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { mkdir } from 'node:fs/promises';
export async function createDriver(config) {
  await mkdir(config.profile, { recursive: true });
  const options = new chrome.Options().addArguments('--window-size=1440,1000', `--user-data-dir=${config.profile}`);
  if (config.headless) options.addArguments('--headless=new');
  if (config.binary) options.setChromeBinaryPath(config.binary);
  const builder = new Builder().forBrowser('chrome').setChromeOptions(options);
  if (config.driverPath) builder.setChromeService(new chrome.ServiceBuilder(config.driverPath));
  const driver = await builder.build();
  try {
    await driver.manage().setTimeouts({ implicit: 0, pageLoad: 60000, script: 15000 });
    return driver;
  } catch (error) { await driver.quit(); throw error; }
}
