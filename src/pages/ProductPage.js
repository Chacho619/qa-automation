import assert from 'node:assert/strict';
import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage.js';
import { locator, xpathLiteral } from '../support/selectors.js';
import { matchesProduct, productId } from '../support/products.js';
export class ProductPage extends BasePage {
  async prepare(product) {
    assert.equal(productId(await this.driver.getCurrentUrl()), product.productId);
    const name = await (await this.ready(this.by('title'))).getText();
    assert.ok(matchesProduct(`${name} ${await this.driver.getTitle()}`, product), `La ficha no cumple los criterios: ${product.id}`);
    for (const variant of product.variants) {
      await this.click(locator(variant.choose));
      await this.ready(locator(variant.selected));
    }
    if (product.size) {
      await this.click(this.by('sizeToggle'));
      await this.click(By.xpath(`//*[self::button or @role='option'][normalize-space(.)=${xpathLiteral(product.size)}]`));
      await this.waitFor(async () => {
        const toggles = await this.visible(this.by('sizeToggle'));
        return toggles.length === 1 && (await toggles[0].getText()).replace(/\s+/g, ' ').trim() === `Tamaño: ${product.size}`;
      }, `No se confirmó talla ${product.size}`);
    }
    await this.ready(this.by('add'), true);
    return { ...product, name, quantity: 1 };
  }
  async addToBag() {
    // No aceptar una confirmación remanente de una operación anterior.
    await this.waitFor(async () => (await this.visible(this.by('added'))).length === 0, 'Hay una confirmación anterior abierta');
    await this.click(this.by('add'));
    await this.waitFor(async () => (await this.visible(this.by('added'))).length > 0, 'No se confirmó el agregado; revisar bolsita antes de repetir');
  }
}
