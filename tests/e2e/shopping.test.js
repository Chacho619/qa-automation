import test from 'node:test';
import { readConfig } from '../../src/support/config.js';
import { createDriver } from '../../src/support/driver.js';
import { loadSelectors } from '../../src/support/selectors.js';
import { loadProducts } from '../../src/support/products.js';
import { Report } from '../../src/support/report.js';
import { CatalogPage } from '../../src/pages/CatalogPage.js';
import { ProductPage } from '../../src/pages/ProductPage.js';
import { BagPage } from '../../src/pages/BagPage.js';
import { LoginPage } from '../../src/pages/LoginPage.js';

test('Sesión iniciada: seis productos a bolsita y Comprar ahora', async () => {
  const config = readConfig();
  const selectors = await loadSelectors(config);
  const products = await loadProducts(config.productsFile);
  const report = new Report();
  let driver;
  let status = 'failed';
  let authenticated = false;
  try {
    driver = await report.step('Abrir Chrome', () => createDriver(config));
    const catalog = new CatalogPage(driver, config, selectors);
    const detail = new ProductPage(driver, config, selectors);
    const bag = new BagPage(driver, config, selectors);
    await report.step('Iniciar sesión o reutilizar sesión vigente', () => new LoginPage(driver, config, selectors).ensureAuthenticated());
    authenticated = true;
    await report.step('Comprobar sesión y bolsita vacía', async () => {
      await driver.get(`${config.baseUrl}/tienda/home`);
      await catalog.assertAuthenticated();
      await bag.open();
      await bag.assertEmpty();
    });
    const expected = [];
    for (const product of products) {
      const selected = await report.step(`Buscar y configurar ${product.id}`, async () => detail.prepare(await catalog.openProduct(product)));
      await report.step(`Agregar ${product.id} y verificar bolsita`, async () => {
        await detail.addToBag();
        // Esperar el enlace clicable; el servidor puede aún estar actualizando el carrito.
        await bag.open();
        expected.push(selected);
        await bag.assertProducts(expected);
      });
    }
    await report.step('Validar los seis productos y llegar a Comprar ahora', async () => {
      await bag.assertAuthenticated();
      await bag.assertProducts(expected);
      await bag.reachBuyNow();
    });
    status = 'passed';
  } finally {
    try { await report.save(driver, { ...config, screenshots: config.screenshots && authenticated }, status); }
    finally { if (driver) await driver.quit(); }
  }
});
