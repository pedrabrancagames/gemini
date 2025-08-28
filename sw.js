// Importa a biblioteca Workbox a partir da CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Verifica se o Workbox foi carregado
if (workbox) {
  console.log(`Workbox carregado com sucesso!`);

  // Configura Workbox para GitHub Pages
  workbox.setConfig({
    debug: false,
    urlBase: '/gemini/' // Define a base URL para o precaching no GitHub Pages
  });

  const { precacheAndRoute } = workbox.precaching;
  const { registerRoute } = workbox.routing;
  const { CacheFirst, StaleWhileRevalidate } = workbox.strategies;
  const { CacheableResponsePlugin } = workbox.cacheableResponse;

  // Adiciona um manipulador para pular a espera e ativar o novo SW imediatamente
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  // Estratégia de Pre-caching para o App Shell e assets principais
  // Estes arquivos serão cacheados durante a instalação do Service Worker
  precacheAndRoute([
    { url: '/gemini/', revision: null }, // Raiz do projeto no GitHub Pages
    { url: '/gemini/index.html', revision: null },
    { url: '/gemini/style.css', revision: null },
    { url: '/gemini/main.js', revision: null },
    { url: '/gemini/firebase-config.js', revision: null },
    { url: '/gemini/favicon.ico', revision: null },
    // Assets de Imagem
    { url: '/gemini/assets/images/logo.png', revision: null },
    { url: '/gemini/assets/images/ghost_trap.png', revision: null },
    { url: '/gemini/assets/images/pke_meter.png', revision: null },
    { url: '/gemini/assets/images/proton_pack.png', revision: null },
    // Assets de Modelo 3D
    { url: '/gemini/assets/models/ghost.glb', revision: null },
    // Assets de Áudio
    { url: '/gemini/assets/audio/inventory_full.mp3', revision: null },
    { url: '/gemini/assets/audio/outside_radius.mp3', revision: null },
    { url: '/gemini/assets/audio/proton-beam.mp3', revision: null }
  ]);

  // Estratégia de Runtime Caching para os tiles do mapa (OpenStreetMap)
  // Usa CacheFirst: se o tile estiver em cache, usa-o; senão, busca na rede e armazena.
  registerRoute(
    ({url}) => url.hostname.endsWith('tile.openstreetmap.org'),
    new CacheFirst({
      cacheName: 'map-tiles-cache',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200], // Cache respostas opacas e bem-sucedidas
        }),
      ],
    })
  );

} else {
  console.log(`Workbox não pôde ser carregado.`);
}