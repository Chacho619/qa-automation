import test from 'node:test';
import assert from 'node:assert/strict';
import { error, By } from 'selenium-webdriver';
import { BasePage } from '../../src/pages/BasePage.js';
function fakeDriver(findElements) {
  return {
    findElements,
    async wait(predicate) {
      for (let i = 0; i < 4; i++) { const result = await predicate(); if (result) return result; }
      throw new Error('timeout');
    },
  };
}
const element = (visible, enabled) => ({ isDisplayed:async()=>visible, isEnabled:async()=>enabled, getAttribute:async()=>null });
test('La espera ignora elementos ocultos y espera habilitación', async () => {
  let calls = 0;
  const driver = fakeDriver(async()=>[element(false,true), element(true, ++calls > 1)]);
  const page = new BasePage(driver, { waitMs:1000 }, {});
  assert.ok(await page.ready(By.css('button'), true));
  assert.equal(calls,2);
});
test('La espera recupera una referencia stale', async () => {
  let calls = 0;
  const driver = fakeDriver(async()=>{ if (++calls === 1) throw new error.StaleElementReferenceError(); return [element(true,true)]; });
  assert.ok(await new BasePage(driver, { waitMs:1000 }, {}).ready(By.css('button')));
});
test('Los selectores ambiguos fallan sin hacer clic', async () => {
  const page = new BasePage(fakeDriver(async()=>[element(true,true),element(true,true)]), { waitMs:1000 }, {});
  await assert.rejects(()=>page.ready(By.css('button')), /ambiguo/);
});
test('Los errores reales no se convierten en reintentos', async () => {
  const page = new BasePage(fakeDriver(async()=>{ throw new error.InvalidSelectorError('bad'); }), { waitMs:1000 }, {});
  await assert.rejects(()=>page.ready(By.css('[')), error.InvalidSelectorError);
});
