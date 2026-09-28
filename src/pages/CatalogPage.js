import { Key } from 'selenium-webdriver';
import { BasePage } from './BasePage.js';
import { matchesProduct, normalize, productId } from '../support/products.js';
export class CatalogPage extends BasePage {
  async search(query) {
    await this.driver.get(`${this.config.baseUrl}/tienda/home`);
    await this.assertAuthenticated();
    await this.click(this.by('search'));
    // En móvil el buscador abre otro input: usar el foco evita IDs React dinámicos.
    const input = await this.waitFor(async () => {
      const active = await this.driver.switchTo().activeElement();
      return await active.getTagName() === 'input' && await active.isDisplayed() && active;
    }, 'El buscador no recibió el foco');
    await input.sendKeys(Key.chord(Key.CONTROL, 'a'), query, Key.ENTER);
    await this.waitFor(async () => {
      const url = new URL(await this.driver.getCurrentUrl());
      const headings = await this.visible(this.by('title'));
      return url.searchParams.get('s') === query && headings.length === 1 && normalize(await headings[0].getText()) === normalize(query);
    }, `No cargó la búsqueda: ${query}`);
  }
  async openProduct(product) {
    await this.search(product.query);
    const candidate = await this.waitFor(async () => {
      for (const link of await this.visible(this.by('results'))) {
        const url = await link.getAttribute('href');
        if (new URL(url).origin !== this.config.baseUrl) continue;
        const text = `${await link.getText()} ${await link.getAttribute('aria-label') || ''}`;
        if (matchesProduct(text, product) && (!product.productId || productId(url) === product.productId)) return { link, url };
      }
      return false;
    }, `No hay candidato para ${product.id}; revisar catálogo, patrones o productId`);
    await candidate.link.click();
    await this.waitFor(async () => {
      try { return productId(await this.driver.getCurrentUrl()) === productId(candidate.url); }
      catch { return false; }
    }, `No abrió la ficha de ${product.id}`);
    await this.ready(this.by('title'));
    return { ...product, url: candidate.url, productId: productId(candidate.url) };
  }
}
