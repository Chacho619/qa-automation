# Automatización QA - Liverpool

Este proyecto cubre el flujo de selección de productos y agregado a la bolsita de Liverpool. Está desarrollado con **JavaScript, Selenium WebDriver y Page Object Model (POM)**.

El objetivo es validar que los productos seleccionados se conserven en la bolsita con la cantidad y las variantes correctas, y llegar a la opción **Comprar ahora**.

## Alcance

El escenario contempla una unidad de cada producto:

- Botas para hombre.
- Mocasines para hombre.
- Perfume.
- Computadora Lenovo.
- Pantalla Sony.
- Consola Xbox.

La búsqueda se realiza desde el buscador del sitio y después se abre la ficha del producto. La navegación por el menú de departamentos no está incluida.

Por defecto, la prueba termina cuando el botón **Comprar ahora** está visible y habilitado en la bolsita. Con `CLICK_BUY_NOW=true`, también lo pulsa y valida la entrada al checkout. No se realiza el pago ni se confirma un pedido.

## Estado actual

La última validación registrada tiene **36 pruebas unitarias aprobadas** y revisión de sintaxis sin errores. Estas pruebas revisan la lógica del framework; no sustituyen la ejecución sobre Liverpool.

**El flujo E2E completo sigue pendiente de validación.** Se pudo abrir Chrome desde la terminal local, pero en el entorno restringido de ejecución se presentó `SessionNotCreatedError`. Se revisaron páginas públicas del sitio y se implementó el login automático, aunque todavía falta comprobarlo con Selenium.

Antes de dar el escenario por aprobado, falta:

- Validar los selectores de login y la detección de sesión iniciada.
- Comprobar selección de tallas, confirmación de agregado y lectura de líneas de la bolsita.
- Confirmar stock y variantes de los seis productos.
- Ejecutar el recorrido completo y revisar el reporte.
- Validar la ruta y el encabezado de checkout si se activa `CLICK_BUY_NOW`.

## Organización del proyecto

```text
config/selectors.json          Selectores de las pantallas
data/products.json             Datos y criterios de búsqueda
src/pages/BasePage.js          Esperas y acciones comunes
src/pages/LoginPage.js         Inicio de sesión
src/pages/CatalogPage.js       Búsqueda y selección de productos
src/pages/ProductPage.js       Detalle, variantes y agregado
src/pages/BagPage.js           Validaciones de la bolsita
src/support/                   Configuración, driver y reportes
tests/e2e/shopping.test.js      Flujo completo
tests/unit/                    Pruebas de la lógica del framework
scripts/session.js             Preparación de sesión
scripts/inspect.js             Revisión de selectores visibles
.github/workflows/quality.yml  Validaciones en GitHub Actions
```

POM permite separar las acciones de cada pantalla del caso de prueba. Si cambia un control del sitio, el ajuste se concentra en su Page Object o en el archivo de selectores.

Los datos de productos también están separados del test para poder cambiar una talla o fijar un producto sin modificar el flujo.

## Requisitos y configuración

- Node.js 22 o superior. Para este proyecto se utilizó Node 24.
- npm.
- Google Chrome.
- Una cuenta de prueba de Liverpool con la bolsita vacía.

Ejecutar los comandos desde la carpeta del proyecto:

```powershell
node --version
npm ci

# Crear .env únicamente si todavía no existe
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Configurar `LIVERPOOL_USERNAME` y `LIVERPOOL_PASSWORD` en el archivo `.env`. Ambos valores son necesarios para el login automático. Si la contraseña contiene caracteres especiales, escribirla entre comillas.

`.env` guarda estos datos localmente en texto plano y está excluido de Git. No debe compartirse ni mostrarse durante la grabación. El archivo `.env.example` contiene únicamente las variables vacías.

### Variables principales

| Variable | Valor por defecto | Descripción |
|---|---|---|
| BASE_URL | https://www.liverpool.com.mx | Sitio bajo prueba |
| LIVERPOOL_USERNAME | Vacío | Correo de la cuenta de prueba |
| LIVERPOOL_PASSWORD | Vacío | Contraseña de la cuenta de prueba |
| WAIT_MS | 20000 | Tiempo máximo de espera por condición |
| LOGIN_WAIT_MS | 120000 | Tiempo de espera para confirmar la sesión |
| HEADLESS | false | Permite ver la ejecución en Chrome |
| PROFILE_DIR | .session/chrome | Perfil usado para conservar la sesión |
| PRODUCTS_FILE | data/products.json | Archivo de datos de prueba |
| SELECTORS_FILE | Sin configurar | Archivo opcional con ajustes de selectores |
| SCREENSHOTS | false | Habilita captura final de la ejecución |
| CLICK_BUY_NOW | false | Permite avanzar al checkout |

Selenium Manager obtiene el controlador de Chrome. Si es necesario indicar una instalación específica, se pueden configurar `CHROMEDRIVER_PATH` y `CHROME_BINARY`. `CHECKOUT_PATH_PATTERN` permite ajustar la ruta esperada del checkout; debe comprobarse contra el sitio antes de cambiarla.

## Ejecución

```powershell
# Revisar sintaxis
npm run check

# Ejecutar pruebas unitarias
npm test

# Ejecutar login y flujo de productos
npm run test:e2e
```

El E2E intenta reutilizar la sesión del perfil. Si no encuentra una sesión activa, utiliza las credenciales de `.env`. La reutilización no comprueba el correo del titular, por lo que el perfil debe usarse solo con la cuenta de prueba elegida.

Para comprobar únicamente el acceso:

```powershell
npm run session
```

También está disponible el inicio manual:

```powershell
npm run session:manual
```

En modo manual, iniciar sesión en Chrome, dejar la bolsita vacía, volver a la portada y pulsar Enter en la terminal. Si Liverpool solicita CAPTCHA o un código de verificación durante el login automático, es necesaria la intervención del usuario en el navegador.

Ejecutar un solo proceso a la vez: `session`, `inspect` y `test:e2e` comparten el perfil de Chrome. Al terminar, el navegador se cierra aunque la prueba falle. Los productos agregados pueden permanecer en la cuenta y deben revisarse antes de repetir el caso.

### Problemas de ejecución conocidos

| Mensaje o situación | Qué revisar |
|---|---|
| `bad option: --env-file-if-exists` | La terminal está usando una versión antigua de Node. Revisar `node --version`, `where.exe node` y `where.exe npm`. |
| `SessionNotCreatedError` / `DevToolsActivePort` | Revisar que Chrome pueda arrancar, que el perfil no esté abierto en otro proceso y que el driver sea compatible. |
| `spawn EPERM` al correr unitarias | En un entorno con restricciones de procesos, usar Node 24 con el comando de abajo. |
| Timeout al detectar sesión o agregar un producto | Revisar la pantalla, el selector y el estado del elemento antes de aumentar la espera. |

Alternativa para ejecutar unitarias en un entorno restringido con Node 24:

```powershell
node --test --test-isolation=none tests/unit/domain.test.js tests/unit/waits.test.js tests/unit/login.test.js
```

## Datos de prueba y selectores

Los seis tipos están definidos en `data/products.json`. La talla de ejemplo para calzado es **27**; debe ajustarse según la disponibilidad del producto.

`include` define los criterios que debe cumplir el resultado y `exclude` ayuda a descartar accesorios u otras categorías. Se puede indicar `productId` para elegir un producto específico y evitar depender del orden de resultados. El producto debe aparecer en los resultados cargados, ya que no se implementó paginación automática.

Para color, capacidad o volumen, cada producto admite `variants` con:

- `choose`: selector de la opción que se va a elegir.
- `selected`: selector que confirma la opción elegida.
- `cartText`: texto esperado en la línea de la bolsita.

Si `variants` está vacío, se utiliza la variante predeterminada del sitio, cuando exista. Las tallas se manejan por separado. La validación usa el código de producto y el texto de sus variantes; no consulta el SKU interno del backend.

Los selectores generales están en `config/selectors.json`. Para revisarlos:

1. Ejecutar `npm run inspect` y navegar hasta la pantalla correspondiente.
2. Pulsar Enter para consultar cuántos elementos visibles coinciden con cada selector.
3. Revisar los atributos en DevTools. Preferir IDs estables, atributos accesibles o `data-testid` cuando estén disponibles.
4. Ajustar el selector y volver a comprobarlo. Cada acción debe identificar un único elemento visible.

Los cambios locales pueden guardarse en `config/selectors.local.json`, configurando `SELECTORS_FILE` con esa ruta. Cada definición acepta `css` o `xpath`.

Hay que revisar especialmente `authenticated`, `added`, `cartRows` y `cartQuantity`. Cada fila de la bolsita debe contener un producto, sus variantes y su cantidad. La selección de talla también tiene lógica en `ProductPage.js`.

## Criterios de automatización

Se utilizan esperas explícitas para consultar el estado de la página antes de interactuar. La espera implícita está en cero y no se utilizan pausas fijas con `sleep`.

Antes de hacer clic se comprueba que el elemento esté visible y habilitado. Si un selector encuentra varios elementos visibles, la prueba falla para evitar actuar sobre un control incorrecto.

Después de cada agregado se revisan el código del producto, la cantidad y la talla o variante configurada. También se comprueba que se conserven los artículos anteriores. No se reintenta automáticamente un clic de agregado, porque podría duplicar la cantidad.

El recorrido se ejecuta como un solo test E2E secuencial. La bolsita vacía es una precondición; el script no elimina automáticamente productos que ya estuvieran en la cuenta.

## Casos funcionales

Precondiciones: cuenta de prueba disponible, bolsita vacía y stock para las variantes elegidas. En la tabla, **implementado** significa que existe código para el caso; su ejecución real sigue pendiente.

| ID | Caso / pasos | Resultado esperado | Cobertura |
|---|---|---|---|
| F01 | Iniciar sesión y abrir la bolsita | Sesión confirmada y bolsita vacía | E2E implementado |
| F02 | Buscar botas para hombre, elegir talla y agregar | Bota con la talla indicada y cantidad 1 | E2E implementado |
| F03 | Buscar mocasines para hombre, elegir talla y agregar | Mocasín correcto; se conserva la bota | E2E implementado |
| F04 | Buscar perfume, configurar volumen si aplica y agregar | Perfume con la variante elegida | E2E; configurar variante |
| F05 | Buscar computadora Lenovo y agregar | Computadora Lenovo, cantidad 1 | E2E implementado |
| F06 | Buscar pantalla Sony y agregar | Pantalla Sony, cantidad 1 | E2E implementado |
| F07 | Buscar consola Xbox y agregar | Consola Xbox, cantidad 1 | E2E implementado |
| F08 | Revisar la bolsita al terminar los agregados | Seis productos distintos con cantidades y variantes correctas | E2E implementado |
| F09 | Llegar a Comprar ahora desde la bolsita | Botón visible y habilitado | E2E por defecto |
| F10 | Activar CLICK_BUY_NOW y pulsar el botón | Se muestra el checkout de entrega | E2E opcional; validar selectores |
| F11 | Recargar la bolsita | Se mantienen productos y cantidades | Manual pendiente |
| F12 | Comparar precios por cantidad contra subtotal | El subtotal coincide con la suma de las líneas | Manual pendiente |

## Casos negativos

Estos casos deben ejecutarse de forma independiente. Las validaciones unitarias del framework no confirman cómo responde Liverpool ante cada situación.

| ID | Caso / pasos | Resultado esperado | Cobertura |
|---|---|---|---|
| N01 | Intentar acceder con contraseña incorrecta | Se informa el error y no se inicia sesión | Manual pendiente; sin reintentos del login |
| N02 | Buscar un término sin resultados | Mensaje de búsqueda sin resultados | Manual pendiente |
| N03 | Intentar agregar calzado sin talla | Se solicita seleccionar una talla y la bolsita no cambia | Manual pendiente |
| N04 | Intentar agregar una variante agotada | Se bloquea la acción o se informa falta de stock | Manual pendiente |
| N05 | Ingresar cantidad cero, negativa, decimal o texto | El sitio rechaza el valor o lo ajusta a uno permitido | Manual pendiente |
| N06 | Intentar comprar con bolsita vacía | No permite continuar la compra | Manual pendiente |
| N07 | Interrumpir la conexión durante el agregado | Se informa el problema y no se duplican artículos | Manual en entorno controlado |
| N08 | Buscar Lenovo, Sony o Xbox con accesorios entre los resultados | El script selecciona el tipo de producto requerido | Filtro y unitarias implementados |
| N09 | Perder la sesión antes de entrar al checkout | Se solicita autenticación antes de continuar | Manual pendiente |

## Edge cases

| ID | Escenario | Resultado esperado | Cobertura |
|---|---|---|---|
| E01 | Tallas 27 y 27.5 disponibles | Se conserva exactamente la seleccionada | Unitaria y aserción E2E |
| E02 | Dos variantes del mismo producto | Se distinguen según las reglas de la bolsita | Manual; fuera del flujo de seis productos distintos |
| E03 | Cambio de precio entre listado y bolsita | Se muestra el precio vigente de forma consistente | Manual pendiente |
| E04 | Pérdida de stock después de seleccionar | Se informa el cambio antes de continuar | Manual pendiente |
| E05 | Respuesta lenta o reemplazo de elementos del DOM | Espera hasta el límite configurado, sin repetir el agregado | Unitarias; pendiente en sitio |
| E06 | Bolsita con artículos previos | La prueba se detiene sin modificar esos artículos | Precondición E2E |
| E07 | Producto sin entrega al código postal elegido | Se muestra la restricción de entrega | Manual pendiente |
| E08 | Visualización móvil | Los controles siguen siendo utilizables | Revisión pública parcial; E2E usa escritorio |
| E09 | Dos ejecuciones con el mismo perfil | Evitar que compartan y modifiquen la misma sesión | Ejecución secuencial como medida preventiva |
| E10 | Acentos, comillas y espacios en los textos | Comparaciones y selectores válidos | Unitarias |

## Riesgos

| Riesgo | Impacto | Medida considerada |
|---|---|---|
| Cambios en el DOM o pruebas A/B del sitio | Fallas de localización | Centralizar selectores y revisarlos ante cambios |
| Stock o tallas variables | El caso no puede completarse | Preparar productos y variantes antes de ejecutar |
| Orden de resultados distinto | Se selecciona otro candidato | Fijar productId cuando se requiera repetir el mismo caso |
| CAPTCHA o MFA | Se necesita intervención manual | Contemplar la verificación en la ejecución; no automatizar su evasión |
| Sesión expirada o de otra cuenta | Carrito incorrecto o interrupción | Usar un perfil dedicado con la cuenta de prueba |
| Respuesta incierta al agregar | Duplicados o falso positivo | Un solo clic y validación posterior en la bolsita |
| Código postal o vendedor distinto | Cambia la disponibilidad | Preparar la ubicación y revisar condiciones de entrega |
| Exposición de credenciales o datos personales | Acceso no autorizado a la cuenta | Excluir .env y perfil de Git; revisar las evidencias |
| Interpretación del recorrido solicitado | El evaluador podría esperar navegación por menús | Documentar que se usa el buscador y confirmar el alcance |

## Resultados y evidencias

El E2E genera `artifacts/<fecha>/result.json` con los pasos, duración y estado de la ejecución. Con `SCREENSHOTS=true` se guarda una captura final, excepto cuando falla el login.

Las 36 unitarias cubren filtros de productos, datos obligatorios, cantidades, tallas, esperas y lógica de autenticación. GitHub Actions ejecuta estas pruebas y la revisión de sintaxis. El E2E se ejecuta localmente con la cuenta configurada.

Para cerrar la validación faltan una ejecución completa exitosa y su evidencia. Los casos manuales deben registrar su resultado por separado. Antes de compartir capturas o video, revisar que no aparezcan credenciales ni datos personales.

## Puntos para explicar en el video

1. Presentar el flujo y aclarar dónde termina la prueba.
2. Mostrar el test E2E y cómo se apoya en los Page Objects.
3. Explicar los datos de prueba y la configuración usando `.env.example`.
4. Mostrar una espera explícita y las validaciones de la bolsita.
5. Ejecutar el caso, revisar el reporte y explicar cualquier fallo que aparezca.
6. Comentar los casos negativos, los edge cases y los pendientes.

## Entrega en GitHub

Versionar código, pruebas, configuración de ejemplo y este README. Mantener fuera del repositorio `.env`, `.session`, `node_modules` y evidencias con información sensible.

La publicación del repositorio y la grabación del video siguen pendientes. Antes de entregar, revisar `git status` y comprobar que la documentación corresponda con los resultados obtenidos.
