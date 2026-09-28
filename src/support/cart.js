import assert from 'node:assert/strict';
import { normalize } from './products.js';
export function assertCart(actual, expected) {
  assert.equal(actual.length, expected.length, 'Cantidad de líneas inesperada en bolsita');
  assert.equal(new Set(actual.map(p => p.productId)).size, actual.length, 'Productos duplicados');
  for (const product of expected) {
    const row = actual.find(p => p.productId === product.productId);
    assert.ok(row, `Falta ${product.id}`);
    assert.equal(row.quantity, product.quantity, `Cantidad incorrecta: ${product.id}`);
    if (product.size) {
      const escaped = product.size.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      assert.match(normalize(row.text), new RegExp(`(?:tamano|talla)\\s*:?\\s*${escaped}(?![\\d.])`), `Talla incorrecta: ${product.id}`);
    }
    for (const variant of product.variants || []) {
      if (variant.cartText) assert.ok(normalize(row.text).includes(normalize(variant.cartText)), `Variante incorrecta: ${product.id}`);
    }
  }
}
