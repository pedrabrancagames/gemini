# Documento de Requisitos - Ghostbusters AR

## 1. Visão Geral
**Nome do Projeto**: Ghostbusters AR (nome provisório, inspirado em *Ghostbusters* de 1984, evitando uso direto de propriedade intelectual).  
**Plataforma**: Navegador mobile Android (ex.: Chrome), utilizando realidade aumentada (AR) via câmera e geolocalização via GPS.  
**Objetivo**: Permitir que jogadores cacem fantasmas virtuais em locais reais delimitados (ex.: praças, parques), capturem-nos com uma Proton Pack virtual e depositem-nos em Unidades de Contenção via QR Code, com pontuação sincronizada em um ranking global.  
**Público-Alvo**: Fãs de *Ghostbusters*, jogadores de jogos AR (ex.: Pokémon GO) e entusiastas de jogos multiplayer casuais.  
**Modos de Jogo**:
- **Online Multiplayer**: Interação em tempo real, incluindo caça cooperativa para fantasmas fortes (2+ jogadores mirando por 5 segundos, dividindo pontos extras).  
- **Offline**: Continuar jogando sem internet após carregar assets, com sincronização de progresso ao reconectar.  
**Hospedagem**: GitHub Pages (arquivos estáticos, gratuito) + Firebase (plano gratuito para banco de dados e autenticação).

## 2. Requisitos Funcionais

### 2.1. Autenticação e Acesso
- **RF01**: O jogador acessa o jogo via site no navegador mobile Android.
- **RF02**: Suporte a login via Firebase Authentication com:
  - Google Auth (padrão).
  - Email/Password (para acessibilidade).
  - Anonymous (para testes rápidos).
- **RF03**: Após login, exibir lista de locais pré-definidos, iniciando com um local teste em Florianópolis, SC (-27.63979808217616, -48.66775914489331, raio de 100 metros), em um mapa interativo.

### 2.2. Escolha de Local e Carregamento
- **RF04**: Mapa interativo (usando Leaflet.js) para selecionar local de jogo, com o local teste inicial em -27.63979808217616, -48.66775914489331 (raio de 100 metros).
- **RF05**: Página de carregamento com barra de progresso para baixar assets (imagens PNG, áudios, arquivos 3D .glb).
- **RF06**: Solicitar permissões (câmera para AR, GPS para geolocalização) após carregamento.

### 2.3. Jogabilidade Principal
- **RF07**: Interface AR com câmera ativa, contendo:
  - Canto superior esquerdo: Logo (botão para configurações: som, logout, etc.).
  - Canto superior direito: Ícone da Ghost Trap (botão para inventário).
  - Inferior: Imagem PNG da Proton Pack com botão central no rodapé para animação PNG do feixe de prótons.
- **RF08**: Fantasmas (3D .glb) gerados aleatoriamente dentro do raio do local (ex.: 100 metros para o local teste).
- **RF09**: Captura de fantasmas: mirar no centro da tela, segurar botão por 5 segundos. Soltar ou perder mira faz o fantasma escapar.
- **RF10**: Fora do raio: Proton Pack desaparece; PNG do P.K.E. Meter exibe distância/direção para voltar ao raio. Reproduzir áudio de orientação (“Você está fora do raio, siga o medidor de distância”) e exibir texto na tela com a mesma mensagem.
- **RF11**: Inventário com limite inicial de 10 fantasmas, expansível (+5 slots após capturar 20 fantasmas). Após encher, reproduzir áudio (“Inventário cheio, vá até a Unidade de Contenção”) e exibir texto na tela com a mesma mensagem.
- **RF12**: Unidade de Contenção: Após inventário cheio, P.K.E. Meter guia ao QR Code mais próximo (dentro do raio, ex.: 100 metros no local teste). Escanear (via ZXing.js) deposita fantasmas e sincroniza pontos.
- **RF13**: Multiplayer: Jogadores no mesmo raio entram em “sala” via Firebase. Caça cooperativa para fantasmas fortes (2+ jogadores mirando por 5s, pontos extras divididos).
- **RF14**: Extras:
  - Botão para tirar fotos e compartilhar via Web Share API.
  - Easter eggs: Após 5 fantasmas depositados, Ecto-1 (3D .glb) aparece em local fixo dentro do raio; após 10, Slimer (3D .glb) aparece como aliado temporário (bônus de pontos).
- **RF15**: Sincronização de pontos com Firebase (online) e IndexedDB (offline, com sync ao reconectar).
- **RF16**: Ranking global (filtrável por local) com número de fantasmas capturados.
- **RF17**: Desafios diários (ex.: “Capture 3 fantasmas fortes”) notificados via Firebase Cloud Messaging.
- **RF18**: Chat simples via Firebase para mensagens rápidas (ex.: “Ajude aqui!”).

### 2.4. Progressão e Recompensas
- **RF19**: Níveis de jogador (ex.: “Caçador Iniciante” a “Ghostbuster Elite”) com perks (ex.: feixe mais rápido, raio maior).
- **RF20**: Eventos temporários (“Invasão de Fantasmas”) notificados via push.

## 3. Requisitos Não Funcionais
- **RNF01**: Interface minimalista otimizada para mobile.
- **RNF02**: Loading em etapas (essenciais primeiro, extras em background).
- **RNF03**: Tutorial AR interativo na primeira jogada.
- **RNF04**: Privacidade: Explicação clara de permissões (câmera, GPS); armazenamento mínimo de dados; anonimato opcional no multiplayer (nicknames gerados).
- **RNF05**: Escalabilidade: Iniciar com o local teste (-27.63979808217616, -48.66775914489331); coletar feedback via GitHub Issues.
- **RNF06**: Propriedade Intelectual: Evitar uso direto de assets/nomes protegidos, usando inspirações genéricas.
- **RNF07**: Monetização futura: Doações via GitHub Sponsors; itens cosméticos (ex.: skins PNG) sem pay-to-win.
- **RNF08**: Performance: Suporte a dispositivos Android variados, com testes de AR.

## 4. Tecnologias
- **AR e Renderização**: A-Frame (Three.js) com WebXR Polyfill. Assets: PNG (Proton Pack, feixe, Ghost Trap, P.K.E. Meter); .glb (fantasmas, Ecto-1, Slimer).
- **Geolocalização**: Leaflet.js; Haversine formula para raios.
- **Multiplayer**: Firebase Realtime Database; DeviceOrientation API para mira cooperativa.
- **Offline**: PWA com Service Workers (Workbox.js); IndexedDB para armazenamento local.
- **QR Code**: ZXing.js.
- **Áudio**: Web Audio API (sons temáticos, mensagens de orientação).
- **Hospedagem**: GitHub Pages (estático); Firebase (banco de dados, autenticação).