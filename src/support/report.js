import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from './config.js';
export class Report {
  constructor() {
    this.started = new Date().toISOString();
    this.directory = path.join(root, 'artifacts', this.started.replace(/[:.]/g, '-'));
    this.steps = [];
  }
  async step(name, action) {
    console.log(`PASO: ${name}`);
    const start = Date.now();
    try {
      const value = await action();
      this.steps.push({ name, status: 'passed', durationMs: Date.now() - start });
      return value;
    } catch (error) {
      this.steps.push({ name, status: 'failed', errorType: error.name, durationMs: Date.now() - start });
      throw error;
    }
  }
  async save(driver, config, status) {
    await mkdir(this.directory, { recursive: true });
    await writeFile(path.join(this.directory, 'result.json'), JSON.stringify({ started: this.started, status, endpoint: config.clickBuyNow ? 'checkout' : 'buy-now-visible', steps: this.steps }, null, 2));
    // Opt-in: las capturas de una sesión real pueden mostrar datos personales.
    if (driver && config.screenshots) {
      try { await writeFile(path.join(this.directory, `${status}.png`), await driver.takeScreenshot(), 'base64'); }
      catch { console.warn('No se pudo obtener captura; se conserva el resultado JSON'); }
    }
  }
}
