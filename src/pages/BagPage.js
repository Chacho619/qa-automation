import { BasePage } from './BasePage.js';
import { productId } from '../support/products.js';
import { assertCart } from '../support/cart.js';
export class BagPage extends BasePage {
  async open() {
    await this.click(this.by('cartLink'));
    await this.waitFor(async () => new URL(await this.driver.getCurrentUrl()).pathname === '/tienda/cart', 'No abrió la bolsita');
  }
  async assertEmpty() {
    await this.ready(this.by('emptyCart'));
    if ((await this.visible(this.by('cartRows'))).length) throw new Error('La bolsita contiene productos: usar una cuenta de prueba y vaciarla manualmente');
  }
  async snapshot() {
    const result = [];
    for (const row of await this.visible(this.by('cartRows'))) {
      const links = await this.visible(this.by('cartProductLink'), row);
      const ids = new Set(await Promise.all(links.map(async link => productId(await link.getAttribute('href')))));
      if (ids.size !== 1) throw new Error('Selector de línea de bolsita ambiguo');
      const quantities = await this.visible(this.by('cartQuantity'), row);
      if (quantities.length !== 1) throw new Error('Debe existir una cantidad por línea');
      const quantity = Number(await quantities[0].getAttribute('value'));
      if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Cantidad inválida en bolsita');
      result.push({ productId: [...ids][0], quantity, text: await row.getText() });
    }
    return result;
  }
  async assertProducts(expected) {
    let lastMismatch;
    try {
      return await this.waitFor(async () => {
        const actual = await this.snapshot();
        try { assertCart(actual, expected); return actual; }
        catch (error) { lastMismatch = error; return false; }
      }, 'La bolsita no coincide con los productos esperados');
    } catch (error) { if (lastMismatch) throw lastMismatch; throw error; }
  }
  async reachBuyNow() {
    if (new URL(await this.driver.getCurrentUrl()).pathname !== '/tienda/cart') throw new Error('Comprar ahora solo puede ejecutarse desde la bolsita');
    await this.ready(this.by('buyNow'), true);
    if (this.config.clickBuyNow) {
      await this.click(this.by('buyNow'));
      await this.waitFor(async () => {
        const url = new URL(await this.driver.getCurrentUrl());
        return url.origin === this.config.baseUrl && this.config.checkoutPattern.test(url.pathname);
      }, 'No se alcanzó la ruta de checkout esperada');
      await this.ready(this.by('checkout'));
    }
  }
}
