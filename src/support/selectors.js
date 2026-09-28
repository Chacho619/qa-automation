import { readFile } from 'node:fs/promises';
import { By } from 'selenium-webdriver';
export function locator(definition) {
  if (!definition || Object.keys(definition).length !== 1) throw new Error('Selector requiere exactamente css o xpath');
  const [type, value] = Object.entries(definition)[0];
  if (!['css', 'xpath'].includes(type) || typeof value !== 'string' || !value.trim()) throw new Error('Selector inválido');
  return By[type](value);
}
export async function loadSelectors(config) {
  const defaults = JSON.parse(await readFile(new URL('../../config/selectors.json', import.meta.url), 'utf8'));
  const overrides = config.selectorsFile ? JSON.parse(await readFile(config.selectorsFile, 'utf8')) : {};
  for (const key of Object.keys(overrides)) if (!(key in defaults)) throw new Error(`Selector desconocido: ${key}`);
  const result = { ...defaults, ...overrides };
  Object.values(result).forEach(locator);
  return result;
}
export function xpathLiteral(value) {
  if (!value.includes("'")) return `'${value}'`;
  if (!value.includes('"')) return `"${value}"`;
  return `concat(${value.split("'").map(part => `'${part}'`).join(', "\'", ')})`;
}
