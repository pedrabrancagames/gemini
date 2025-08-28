// Importa a biblioteca Workbox a partir da CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Verifica se o Workbox foi carregado
if (workbox) {
  console.log(`Workbox carregado com sucesso!`);

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
    { url: '/', revision: null }, // Cache a raiz do site para GitHub Pages
    { url: 'index.html', revision: null }, // Mantém para acesso direto, se aplicável
    { url: 'style.css', revision: null },
    { url: 'main.js', revision: null },
    { url: 'firebase-config.js', revision: null },
    { url: 'favicon.ico', revision: null },
    // Assets de Imagem
    { url: 'assets/images/logo.png', revision: null },
    { url: 'assets/images/ghost_trap.png', revision: null },
    { url: 'assets/images/pke_meter.png', revision: null },
    { url: 'assets/images/proton_pack.png', revision: null },
    // Assets de Modelo 3D
    { url: 'assets/models/ghost.glb', revision: null },
    // Assets de Áudio
    { url: 'assets/audio/inventory_full.mp3', revision: null },
    { url: 'assets/audio/outside_radius.mp3', revision: null },
    { url: 'assets/audio/proton-beam.mp3', revision: null }
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
