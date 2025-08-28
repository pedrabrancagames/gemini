# Plano de Implementação - Ghostbusters AR

## 1. Visão Geral
**Objetivo**: Desenvolver um jogo de realidade aumentada (AR) para navegador mobile Android, inspirado em *Ghostbusters* (1984), com MVP inicial focado em funcionalidades básicas e iterações posteriores para recursos avançados.  
**Estratégia**: Começar com um local teste em Florianópolis, SC (-27.63979808217616, -48.66775914489331, raio de 100 metros), implementar jogabilidade central, e expandir com base em feedback.  
**Tecnologias**: A-Frame (AR), Leaflet.js (mapa), Firebase (banco de dados, autenticação), Workbox.js (PWA), ZXing.js (QR Code), Web Audio API (áudio).

## 2. Fases de Implementação

### 2.1. MVP (Minimum Viable Product)
**Duração Estimada**: 4-6 semanas.  
**Escopo**: Local teste (-27.63979808217616, -48.66775914489331, raio de 100 metros), jogabilidade básica, suporte offline, sem multiplayer.  
**Tarefas**:
1. **Configuração do Projeto** (1 semana):
   - Criar repositório no GitHub; configurar GitHub Pages.
   - Estruturar projeto: HTML (index.html), JS (lógica), assets (PNG, .glb, áudio).
   - Integrar Firebase (plano gratuito) para autenticação (Google, Email/Password, Anonymous).
2. **Tela de Login e Seleção de Local** (1 semana):
   - Implementar tela de login com Firebase Authentication.
   - Criar tela de seleção de local com Leaflet.js, exibindo o local teste (-27.63979808217616, -48.66775914489331, raio de 100 metros).
3. **Carregamento e Permissões** (1 semana):
   - Desenvolver página de carregamento com barra de progresso.
   - Configurar Service Workers (Workbox.js) para caching de assets (PNG: Proton Pack, feixe, Ghost Trap, P.K.E. Meter; .glb: 1 modelo de fantasma).
   - Solicitar permissões (câmera, GPS).
4. **Jogabilidade Básica** (2 semanas):
   - Configurar AR com A-Frame e WebXR Polyfill.
   - Implementar interface: logo (configurações), Ghost Trap (inventário), Proton Pack (botão de feixe).
   - Gerar 1 fantasma (.glb) em posição aleatória no raio de 100 metros (Haversine formula).
   - Captura: Segurar botão por 5s; falha se perder mira.
   - Fora do raio: Exibir P.K.E. Meter (PNG), áudio e texto de orientação (“Você está fora do raio, siga o medidor de distância”).
   - Inventário (IndexedDB): Limite de 10 fantasmas; áudio e texto ao encher (“Inventário cheio, vá até a Unidade de Contenção”).
   - Unidade de Contenção: Escanear QR Code com ZXing.js para depósito (QR Code posicionado no raio do local teste).
5. **Sincronização e Testes** (1 semana):
   - Salvar pontos em IndexedDB (offline) e sincronizar com Firebase (online).
   - Testar em Androids variados (Chrome) no local teste; coletar feedback via GitHub Issues.

**Entregáveis do MVP**:
- Jogo funcional no local teste (-27.63979808217616, -48.66775914489331), com caça de fantasmas, inventário, depósito via QR Code, suporte offline e sincronização básica.
- Interface AR com assets PNG e 1 fantasma .glb.

### 2.2. Iteração 1: Multiplayer e Easter Eggs
**Duração Estimada**: 3-4 semanas.  
**Escopo**: Adicionar multiplayer, easter eggs e mais locais.  
**Tarefas**:
1. Implementar “salas” multiplayer com Firebase Realtime Database (jogadores no raio de 100 metros do local teste).
2. Adicionar caça cooperativa (2+ jogadores mirando por 5s em fantasmas fortes).
3. Integrar chat simples (Firebase).
4. Adicionar easter eggs: Ecto-1 (.glb) após 5 fantasmas; Slimer (.glb) após 10.
5. Expandir para 2-3 locais adicionais com raios variados.
6. Implementar ranking global/local (Firebase).
7. Adicionar botão de fotos (Web Share API).

### 2.3. Iteração 2: Progressão e Eventos
**Duração Estimada**: 2-3 semanas.  
**Escopo**: Progressão de jogador, desafios diários, eventos.  
**Tarefas**:
1. Implementar níveis de jogador com perks (ex.: feixe mais rápido).
2. Adicionar desafios diários (ex.: “Capture 3 fantasmas fortes”) com Firebase Cloud Messaging.
3. Criar eventos temporários (“Invasão de Fantasmas”).
4. Expandir inventário (+5 slots após 20 fantasmas).

### 2.4. Iteração 3: Polimento e Escalabilidade
**Duração Estimada**: 2 semanas.  
**Escopo**: Melhorias de usabilidade, testes amplos, preparação para mais locais.  
**Tarefas**:
1. Implementar tutorial AR interativo.
2. Otimizar loading (essenciais primeiro).
3. Monitorar limites do Firebase; explorar Supabase como alternativa.
4. Testar em mais dispositivos Android; coletar feedback.

## 3. Cronograma
- **Semana 1-6**: MVP.
- **Semana 7-10**: Iteração 1 (multiplayer, easter eggs).
- **Semana 11-13**: Iteração 2 (progressão, eventos).
- **Semana 14-15**: Iteração 3 (polimento, escalabilidade).

## 4. Recursos Necessários
- **Equipe**: Desenvolvedor front-end (HTML/JS/A-Frame), designer de assets (PNG, .glb), testador mobile.
- **Ferramentas**: GitHub (hospedagem/código), Firebase (banco de dados/autenticação), Blender (modelos .glb).
- **Assets**: PNG (Proton Pack, feixe, Ghost Trap, P.K.E. Meter); .glb (fantasmas, Ecto-1, Slimer); áudios (temáticos, mensagens de orientação).

## 5. Riscos e Mitigações
- **Risco 1**: Performance AR em Androids antigos.
  - Mitigação: Testar em dispositivos variados no local teste; otimizar assets .glb.
- **Risco 2**: Limites do Firebase gratuito.
  - Mitigação: Monitorar leituras/escritas; planejar migração para Supabase.
- **Risco 3**: Problemas com direitos autorais.
  - Mitigação: Usar nomes e assets genéricos (ex.: “feixe de energia”).