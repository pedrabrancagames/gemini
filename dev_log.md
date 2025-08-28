# Registro de Desenvolvimento do Projeto Ghostbusters

Este documento resume os problemas encontrados e as soluções aplicadas durante o desenvolvimento do projeto Ghostbusters, servindo como referência para futuros projetos de jogos.

## Histórico de Commits (Problemas e Soluções)

### `1b59384` - feat: Move geographic utility functions
- **Problema:** `ReferenceError` devido a funções de utilidade geográfica (`haversineDistance`, `getBearing`, `calculateDestinationPoint`) serem chamadas antes de sua definição. A função `calculateDestinationPoint` estava completamente ausente.
- **Solução:** A função `calculateDestinationPoint` foi implementada e todas as três funções de utilidade geográfica foram movidas para o início do arquivo `main.js`, logo após as declarações das variáveis globais, garantindo que estejam disponíveis quando chamadas.

### `bb1d760` - feat: Update test location coordinates
- **Problema:** Necessidade de ajustar as coordenadas de localização de teste para fins de desenvolvimento e testes.
- **Solução:** As coordenadas da variável `testLocation` foram atualizadas em `main.js`.

### `a39e6cc` - feat: Improve ghost spawning for testing and add distance indicator
- **Problema:** A lógica de spawn de fantasmas precisava de refinamento para testes e o jogador necessitava de feedback visual sobre a distância do fantasma.
- **Solução:** A lógica de spawn de fantasmas foi aprimorada e um indicador de distância foi adicionado em `main.js`.

### `7142406` - Nova localização
- **Problema:** Necessidade de alterar a localização da área de caça no jogo.
- **Solução:** A localização da área de caça foi atualizada em `main.js`.

### `abdb864` - feat: Implement WebXR ghost spawning based on GPS
- **Problema:** Necessidade de implementar uma lógica de spawn de fantasmas que utilizasse GPS e WebXR para posicionamento.
- **Solução:** A função `spawnGhost` foi implementada em `main.js` para usar coordenadas GPS e WebXR para o posicionamento do fantasma.

### `311745b` - feat: Migrate to WebXR for AR functionality
- **Problema:** Transição de uma solução AR anterior (provavelmente AR.js) para WebXR para melhor compatibilidade e recursos.
- **Solução:** A funcionalidade AR foi migrada para WebXR, impactando `index.html` e `main.js`. Um novo arquivo `modelo.html` foi adicionado.

### `52fb469` & `d9c2b70` - debug: Force video element visibility for AR.js camera debugging
- **Problema:** Dificuldade em depurar problemas da câmera AR.js, especificamente a visibilidade do elemento de vídeo.
- **Solução:** A visibilidade do elemento de vídeo foi forçada em `style.css` para auxiliar na depuração.

### `eca7ca7` - fix: Simplify A-Frame camera to isolate AR.js video issue
- **Problema:** Problema de vídeo com AR.js, possivelmente relacionado à configuração da câmera A-Frame.
- **Solução:** A configuração da câmera A-Frame foi simplificada em `index.html` para isolar o problema de vídeo do AR.js.

### `7e2689a` - fix: Simplify AR.js camera source configuration
- **Problema:** Configuração da fonte da câmera AR.js complexa ou incorreta.
- **Solução:** A configuração da fonte da câmera AR.js foi simplificada em `index.html`.

### `d5747a0` - fix: Update AR.js script to a more comprehensive build
- **Problema:** O script AR.js existente pode estar incompleto ou desatualizado.
- **Solução:** O script AR.js em `index.html` foi atualizado para uma construção mais abrangente.

### `3444a8dd` - fix: Correct AR.js video source configuration
- **Problema:** Configuração incorreta da fonte de vídeo AR.js.
- **Solução:** A configuração da fonte de vídeo AR.js foi corrigida em `index.html`.

### `62f932f` - fix: Implement robust camera setup for AR.js
- **Problema:** A configuração da câmera para AR.js não era robusta, levando a possíveis falhas ou inconsistências.
- **Solução:** Uma configuração de câmera mais robusta para AR.js foi implementada em `index.html`.

### `561a757` - fix: Finalize AR camera setup and Service Worker configuration
- **Problema:** A configuração da câmera AR e do Service Worker precisava de finalização para garantir o funcionamento correto.
- **Solução:** A configuração da câmera AR foi finalizada em `index.html` e a configuração do Service Worker em `sw.js`.

### `089d106` - fix: Resolve camera and Service Worker precaching issues
- **Problema:** Problemas com a câmera e o precaching do Service Worker.
- **Solução:** Problemas da câmera em `main.js` e problemas de precaching do Service Worker em `sw.js` foram resolvidos.

### `9760ec7` - fix: Refine permission handling and Service Worker precaching
- **Problema:** O tratamento de permissões e o precaching do Service Worker precisavam de refinamento.
- **Solução:** O tratamento de permissões em `main.js` e o precaching do Service Worker em `sw.js` foram refinados.

### `0f6ce2b` - fix: Enable AR camera and correct Service Worker precaching
- **Problema:** A câmera AR não estava habilitada ou o precaching do Service Worker estava incorreto.
- **Solução:** A câmera AR foi habilitada em `index.html` e o precaching do Service Worker foi corrigido em `sw.js`.

### `f2a2f27` - fix: Resolve 'Identifier has already been declared' error
- **Problema:** Erro `'Identifier has already been declared'` (Identificador já foi declarado).
- **Solução:** O erro foi resolvido em `main.js`.

### `6ceda9e` - fix: Correct map initialization and Service Worker path
- **Problema:** A inicialização do mapa e o caminho do Service Worker estavam incorretos.
- **Solução:** A inicialização do mapa e o caminho do Service Worker foram corrigidos em `main.js`.

### `7ff883f` - feat: Implement core AR gameplay and UI adjustments
- **Problema:** Necessidade de implementar a jogabilidade central de AR e fazer ajustes na interface do usuário.
- **Solução:** A jogabilidade central de AR e os ajustes de UI foram implementados em `index.html`, `main.js` e `style.css`.

### `20aa620` - feat: Implement Camera and GPS permission requests
- **Problema:** Necessidade de solicitar permissões de câmera e GPS para o funcionamento do jogo.
- **Solução:** As solicitações de permissão de câmera e GPS foram implementadas em `main.js`.

### `1fce52a` - feat: Implement offline support with Service Worker
- **Problema:** Necessidade de implementar suporte offline para o aplicativo.
- **Solução:** O suporte offline foi implementado usando Service Worker em `main.js` e o arquivo `sw.js` foi adicionado.

### `2401310` - feat: Initial project setup and Firebase authentication
- **Problema:** Configuração inicial do projeto e integração da autenticação Firebase.
- **Solução:** Configuração inicial do projeto, incluindo `firebase-config.js`, `index.html`, `main.js`, `style.css`, e autenticação Firebase.

### `f8461e2` - novo
- **Problema:** A estrutura ou arquivos de projeto anteriores não eram adequados, indicando a necessidade de uma reestruturação ou recomeço.
- **Solução:** Muitos arquivos e diretórios antigos foram excluídos, marcando um novo começo ou uma grande reestruturação do projeto.

### `0ba73ca` - Feat: Ativa UI de depuração do AR.js para diagnosticar problema de câmera
- **Problema:** Problema na câmera com AR.js que precisava ser diagnosticado.
- **Solução:** A UI de depuração do AR.js foi ativada em `index.html` para auxiliar no diagnóstico do problema da câmera.

### `b70d647` - Fix: Corrige erro de cache do Service Worker
- **Problema:** Erro de cache no Service Worker.
- **Solução:** O erro de cache do Service Worker foi corrigido em `sw.js`.

### `a2dbd62` - Fix: Torna o fundo da tela do jogo transparente para exibir a câmera
- **Problema:** O fundo da tela do jogo não era transparente, impedindo a exibição da câmera.
- **Solução:** O fundo da tela do jogo foi tornado transparente em `styles.css` para permitir a exibição da câmera.

### `a515e67` - Fix: Corrige conflito na inicialização da câmera e erro no mapa
- **Problema:** Conflito na inicialização da câmera e um erro relacionado ao mapa.
- **Solução:** O conflito na inicialização da câmera foi corrigido em `js/ar.js` e o erro do mapa em `js/location.js`.

### `91aac6d` - Commit inicial
- **Problema:** Início do projeto.
- **Solução:** Configuração inicial do projeto com vários arquivos e ativos.