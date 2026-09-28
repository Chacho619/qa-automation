import { BasePage } from './BasePage.js';
import { readCredentials, assertLoginOrigin } from '../support/credentials.js';

export class LoginPage extends BasePage {
  async ensureAuthenticated(credentials = readCredentials()) {
    await this.driver.get(`${this.config.baseUrl}/tienda/cart`);
    const state = await this.waitFor(async () => {
      if ((await this.visible(this.by('authenticated'))).length) return 'authenticated';
      if ((await this.visible(this.by('loginEntry'))).length) return 'guest';
      return false;
    }, 'No se detectó sesión ni acceso al login. Revisa authenticated/loginEntry.');
    if (state === 'authenticated') return;
    if (!credentials) throw new Error('No hay sesión iniciada. Configura las credenciales en .env o ejecuta session:manual.');
    await this.click(this.by('loginEntry'));
    await this.ready(this.by('loginUsername'), true);
    assertLoginOrigin(await this.driver.getCurrentUrl());
    await this.fillSecret('loginUsername', credentials.username);
    await this.fillSecret('loginPassword', credentials.password);
    assertLoginOrigin(await this.driver.getCurrentUrl());
    // Un solo envío. Un error de credenciales no debe generar reintentos ni bloqueos de cuenta.
    await this.click(this.by('loginSubmit'));
    console.log('Esperando confirmación de sesión. Si el portal solicita una verificación adicional, complétala en Chrome.');
    const loginWait = new BasePage(this.driver, { ...this.config, waitMs: this.config.loginWaitMs }, this.selectors);
    await loginWait.waitFor(async () => {
      const url = new URL(await this.driver.getCurrentUrl());
      if (url.origin === this.config.baseUrl) {
        return (await this.visible(this.by('authenticated'))).length > 0;
      }
      assertLoginOrigin(url.href);
      const messages = await this.visible(this.by('loginError'));
      for (const message of messages) {
        if ((await message.getText()).trim()) throw new Error('Liverpool mostró un error de autenticación. Revisa el mensaje en Chrome; no se reintentará el envío.');
      }
      return false;
    }, 'No se confirmó el login. Puede requerir verificación manual o ajustes del selector authenticated.');
  }

  async fillSecret(key, value) {
    const input = await this.ready(this.by(key), true);
    assertLoginOrigin(await this.driver.getCurrentUrl());
    await input.clear();
    try { await input.sendKeys(value); }
    catch { throw new Error(`No se pudo completar ${key}; no se muestran sus datos.`); }
  }
}
