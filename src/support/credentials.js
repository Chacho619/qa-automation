export function readCredentials(env = process.env) {
  const username = env.LIVERPOOL_USERNAME?.trim();
  const password = env.LIVERPOOL_PASSWORD;
  if (!username && !password) return null;
  if (!username || !password) throw new Error('Configura LIVERPOOL_USERNAME y LIVERPOOL_PASSWORD juntos en .env');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) throw new Error('LIVERPOOL_USERNAME debe ser un correo válido');
  // Evitar que una serialización accidental incluya los secretos.
  return Object.defineProperties({}, {
    username: { value: username },
    password: { value: password },
  });
}

export function assertLoginOrigin(value) {
  const url = new URL(value);
  if (url.origin !== 'https://login.liverpool.com.mx' || url.username || url.password) {
    throw new Error('El formulario no está en el origen de autenticación autorizado de Liverpool');
  }
}
