# Documento de Design - Ghostbusters AR

## 1. Visão Geral
**Objetivo**: Criar uma experiência de realidade aumentada (AR) imersiva e divertida, inspirada em *Ghostbusters* (1984), onde jogadores caçam fantasmas em locais reais, interagem em multiplayer e exploram easter eggs temáticos.  
**Estilo Visual**: Interface minimalista com elementos visuais que remetem ao universo de *Ghostbusters* (cores escuras, neon verde para efeitos, assets estilizados).  
**Estilo de Áudio**: Sons icônicos (ex.: som do feixe de prótons, alerta do P.K.E. Meter) e mensagens de orientação claras.

## 2. Design da Interface

### 2.1. Fluxo de Telas
1. **Tela de Login**:
   - Design: Fundo escuro com logo estilizado no centro. Botões para Google Auth, Email/Password e Anonymous.
   - Elementos: Botões grandes, otimizados para toque; texto explicativo sobre privacidade.
2. **Tela de Seleção de Local**:
   - Design: Mapa interativo (Leaflet.js) com marcador inicial no local teste (-27.63979808217616, -48.66775914489331, Florianópolis, SC, raio de 100 metros). Cada marcador mostra nome e raio.
   - Elementos: Botão de confirmação; zoom no mapa para facilitar escolha.
3. **Tela de Carregamento**:
   - Design: Barra de progresso com tema neon verde; fundo com animação sutil de “ectoplasma”.
   - Elementos: Texto “Carregando assets...” e percentual.
4. **Tela de Jogo (AR)**:
   - Design: Câmera AR como fundo. Overlays:
     - **Topo Esquerdo**: Logo (botão para configurações).
     - **Topo Direito**: Ícone da Ghost Trap (botão para inventário).
     - **Inferior**: PNG da Proton Pack com botão central circular (toque para feixe).
     - **Fora do Raio**: PNG do P.K.E. Meter no centro, com medidor de distância (setas e metros). Texto: “Você está fora do raio, siga o medidor de distância”. Áudio correspondente.
     - **Inventário Cheio**: P.K.E. Meter guia ao QR Code. Texto: “Inventário cheio, vá até a Unidade de Contenção”. Áudio correspondente.
   - Elementos: Fantasmas (.glb) com animações (ex.: flutuação). Feixe de prótons (PNG animado).
5. **Tela de Inventário**:
   - Design: Lista de fantasmas capturados (.glb miniaturizados). Indicador de slots (ex.: 10/10).
   - Elementos: Botão para fechar; texto de status (ex.: “Inventário cheio”).
6. **Tela de Configurações**:
   - Design: Menu simples com fundo escuro.
   - Elementos: Controles de som, logout, alternar notificações push.
7. **Tela de Ranking**:
   - Design: Tabela com nomes (ou nicknames anônimos), número de fantasmas capturados e filtro por local.
   - Elementos: Botão para alternar entre global e local.

### 2.2. Assets Visuais
- **PNG**: Proton Pack, feixe de prótons (animação sprite), Ghost Trap, P.K.E. Meter.
- **3D (.glb)**: Fantasmas (variedade de modelos), Ecto-1 (easter egg fixo), Slimer (easter egg aliado).
- **Estilo**: Visual retro-futurista com cores escuras (preto, cinza) e destaques em verde neon.

### 2.3. Áudio
- **Sons Temáticos**: Som do feixe de prótons, alerta do P.K.E. Meter, captura de fantasma.
- **Mensagens de Orientação**:
  - Fora do raio: “Você está fora do raio, siga o medidor de distância”.
  - Inventário cheio: “Inventário cheio, vá até a Unidade de Contenção”.
- **Música**: Trilha de fundo suave, inspirada na trilha de *Ghostbusters*, sem violar direitos autorais.

## 3. Design de Jogabilidade
- **Caça a Fantasmas**: Fantasmas (.glb) aparecem em posições aleatórias no raio (ex.: 100 metros no local teste). Jogador mira com câmera e segura botão por 5 segundos. Fantasmas fortes requerem 2+ jogadores.
- **Progressão**: Níveis de jogador com perks (ex.: feixe 1s mais rápido após nível 5). Inventário expansível (10 slots iniciais, +5 após 20 fantasmas).
- **Easter Eggs**: Ecto-1 após 5 fantasmas depositados; Slimer após 10, com bônus de pontos.
- **Multiplayer**: “Salas” automáticas por proximidade (Firebase). Chat para coordenação.
- **Eventos**: “Invasão de Fantasmas” com mais fantasmas fortes em horários específicos.

## 4. Fluxo de Interação
- **Início**: Login → Escolha de local (iniciando com -27.63979808217616, -48.66775914489331) → Carregamento → Permissões → AR.
- **Jogabilidade**: Caça → Inventário cheio → QR Code → Depósito → Sincronização.
- **Offline**: Assets cached; progresso em IndexedDB; sync ao reconectar.
- **Social**: Fotos compartilháveis; ranking global/local; desafios diários.