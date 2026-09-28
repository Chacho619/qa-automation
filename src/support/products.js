import { readFile } from 'node:fs/promises';
import { locator } from './selectors.js';
export const normalize = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
export function matchesProduct(text, product) {
  const normalized = normalize(text);
  return product.include.every(pattern => new RegExp(pattern, 'i').test(normalized)) &&
    !product.exclude.some(pattern => new RegExp(normalize(pattern), 'i').test(normalized));
}
export function productId(url) {
  const match = new URL(url).pathname.match(/^\/tienda\/pdp\/[^/]+\/([\w-]+)\/?$/);
  if (!match) throw new Error('URL no corresponde a una ficha de producto');
  return match[1];
}
export function validateProducts(products) {
  const expected = ['botas', 'mocasines', 'perfume', 'lenovo', 'sony', 'xbox'];
  if (!Array.isArray(products) || products.length !== 6 || new Set(products.map(p => p.id)).size !== 6 || expected.some(id => !products.some(p => p.id === id))) throw new Error('Se requieren exactamente los seis tipos del examen');
  for (const p of products) {
    if (!p.query?.trim() || !Array.isArray(p.include) || !p.include.length || !Array.isArray(p.exclude) || !Array.isArray(p.variants)) throw new Error(`Datos incompletos: ${p.id}`);
    for (const pattern of [...p.include, ...p.exclude]) { if (typeof pattern !== 'string' || !pattern) throw new Error('Patrón vacío'); new RegExp(pattern); }
    if (['botas','mocasines'].includes(p.id) && !p.size?.trim()) throw new Error(`Falta talla: ${p.id}`);
    if (p.productId && !/^[\w-]+$/.test(p.productId)) throw new Error('productId inválido');
    for (const variant of p.variants) { locator(variant.choose); locator(variant.selected); }
  }
  return products;
}
export async function loadProducts(file) { return validateProducts(JSON.parse(await readFile(file, 'utf8'))); }
