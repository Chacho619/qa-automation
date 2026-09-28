import { error } from 'selenium-webdriver';
import { locator } from '../support/selectors.js';
export class BasePage {
  constructor(driver, config, selectors) { Object.assign(this, { driver, config, selectors }); }
  by(key) { return locator(this.selectors[key]); }
  async visible(by, scope = this.driver) {
    const found = [];
    for (const element of await scope.findElements(by)) if (await element.isDisplayed()) found.push(element);
    return found;
  }
  async waitFor(predicate, message) {
    return this.driver.wait(async () => {
      try { return await predicate(); }
      catch (err) {
        if (err instanceof error.StaleElementReferenceError || err instanceof error.NoSuchElementError) return false;
        throw err;
      }
    }, this.config.waitMs, message, 250);
  }
  async ready(by, enabled = false) {
    return this.waitFor(async () => {
      const elements = await this.visible(by);
      if (elements.length > 1) throw new Error(`Selector ambiguo (${elements.length} visibles): ${by}`);
      if (!elements.length) return false;
      const el = elements[0];
      return (!enabled || (await el.isEnabled() && await el.getAttribute('aria-disabled') !== 'true')) && el;
    }, `No está listo: ${by}`);
  }
  async click(by) {
    const element = await this.ready(by, true);
    await this.driver.executeScript('arguments[0].scrollIntoView({block:"center"})', element);
    // Una sola acción: no repetir clics de agregar/comprar si la respuesta es incierta.
    await element.click();
  }
  async assertAuthenticated() {
    await this.ready(this.by('authenticated'));
  }
}
