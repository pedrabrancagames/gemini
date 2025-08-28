# 👻 Ghostbusters AR

Um jogo de realidade aumentada inspirado em Ghostbusters (1984) onde você caça fantasmas em locais reais usando seu celular!

## 🎮 Sobre o Jogo

Ghostbusters AR é um jogo PWA (Progressive Web App) que utiliza tecnologias web modernas para criar uma experiência de realidade aumentada imersiva. Caçe fantasmas em locais pré-definidos, capture-os com sua Proton Pack virtual e deposite-os em Unidades de Contenção usando QR Codes.

### ✨ Funcionalidades Principais

- 📱 **Realidade Aumentada**: Veja e caçe fantasmas através da câmera do seu celular
- 🗺️ **Geolocalização**: Jogue em locais específicos do mundo real
- 🎯 **Sistema de Captura**: Mire e segure por 5 segundos para capturar fantasmas
- 📦 **Inventário**: Sistema de slots expansível com progressão
- 🔍 **QR Scanner**: Deposite fantasmas escaneando QR Codes das Unidades de Contenção
- 🏆 **Progressão**: Sistema de níveis e pontuação
- 👥 **Multiplayer**: Caça cooperativa (planejado para versões futuras)
- 🎁 **Easter Eggs**: Ecto-1 e Slimer aparecem como recompensas especiais
- 📴 **Suporte Offline**: Jogue sem internet com sincronização posterior

### 🎯 Local de Teste

**Florianópolis, SC**
- Coordenadas: -27.63979808217616, -48.66775914489331
- Raio: 100 metros
- Para testes e desenvolvimento inicial

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura da aplicação
- **CSS3** - Estilização responsiva com design temático
- **JavaScript ES6+** - Lógica do jogo e interações
- **A-Frame** - Framework para realidade aumentada
- **AR.js** - Biblioteca AR para web browsers

### Geolocalização e Mapas
- **Leaflet.js** - Mapas interativos
- **Geolocation API** - Posicionamento GPS
- **Haversine Formula** - Cálculos de distância geográfica

### Backend e Sincronização
- **Firebase Authentication** - Sistema de login
- **Firebase Realtime Database** - Dados em tempo real
- **IndexedDB** - Armazenamento local offline

### PWA e Performance
- **Service Workers** - Cache e funcionalidade offline
- **Web App Manifest** - Instalação como app nativo
- **Web Audio API** - Sons e efeitos sonoros

### Funcionalidades Específicas
- **ZXing.js** - Scanner de QR Codes
- **MediaDevices API** - Acesso à câmera
- **Web Share API** - Compartilhamento de fotos

## 🚀 Como Executar

### Pré-requisitos
- Navegador moderno com suporte a WebRTC e WebXR
- HTTPS (necessário para câmera e geolocalização)
- Dispositivo móvel Android recomendado

### Desenvolvimento Local

1. **Clone o repositório**
```bash
git clone https://github.com/pedrabrancagames/qoder.git
cd qoder
```

2. **Configure o Firebase**
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com)
   - Habilite Authentication (Google, Email/Password, Anonymous)
   - Habilite Realtime Database
   - Copie as configurações para `js/config.js`

3. **Serve com HTTPS local**
```bash
# Usando Python
python -m http.server 8000 --bind 127.0.0.1

# Ou usando Node.js
npx http-server -p 8000 -a 127.0.0.1 --ssl
```

4. **Acesse**: `https://127.0.0.1:8000` no seu celular

### Deploy no GitHub Pages

1. **Faça push para o repositório**
2. **Configure GitHub Pages** nas configurações do repositório
3. **Configure Firebase** para o domínio do GitHub Pages
4. **Acesse**: `https://pedrabrancagames.github.io/qoder/`

## 📁 Estrutura do Projeto

```
ghostbusters-ar/
├── 📄 index.html              # Página principal
├── 🎨 styles.css              # Estilos globais
├── 📱 manifest.json           # Configuração PWA
├── ⚙️ sw.js                   # Service Worker
├── 🖼️ favicon.ico             # Ícone do app
├── 
├── 📂 js/                     # Scripts JavaScript
│   ├── 🔧 config.js           # Configurações e Firebase
│   ├── 🔐 auth.js             # Sistema de autenticação
│   ├── 🗺️ location.js         # Geolocalização e mapas
│   ├── 🎮 game.js             # Lógica principal do jogo
│   ├── 🥽 ar.js               # Gerenciamento AR
│   ├── 📦 inventory.js        # Sistema de inventário
│   ├── 📱 qr-scanner.js       # Scanner QR
│   └── 📱 app.js              # Controlador principal
│
├── 📂 assets/                 # Recursos do jogo
│   ├── 🖼️ images/             # Imagens PNG
│   │   ├── logo.png
│   │   ├── proton_pack.png
│   │   ├── ghost_trap.png
│   │   └── pke_meter.png
│   ├── 🎵 audio/              # Sons e músicas
│   │   ├── proton-beam.mp3
│   │   ├── inventory_full.mp3
│   │   └── outside_radius.mp3
│   └── 🎭 models/             # Modelos 3D
│       └── ghost.glb
│
└── 📂 docs/                   # Documentação
    ├── requirements_document.markdown
    ├── design_document.markdown
    └── implementation_plan.markdown
```

## 🎯 Como Jogar

1. **Faça Login**: Use Google, email ou jogue anonimamente
2. **Escolha Local**: Selecione o local teste em Florianópolis
3. **Conceda Permissões**: Permita acesso à câmera e localização
4. **Caçe Fantasmas**: Mire com a câmera e segure o botão por 5 segundos
5. **Gerencie Inventário**: Verifique seus fantasmas capturados
6. **Deposite na Unidade**: Escaneie QR Codes quando o inventário estiver cheio

### 🎮 Controles
- **Botão de Fogo**: Segure para capturar fantasmas
- **Ícone da Ghost Trap**: Abrir inventário
- **Logo**: Configurações do jogo

### 🏆 Sistema de Progressão
- **Pontos**: Ganhe pontos capturando fantasmas
- **Níveis**: Suba de nível com base nos pontos
- **Inventário**: Expanda slots capturando mais fantasmas
- **Easter Eggs**: Desbloqueie Ecto-1 e Slimer

## 🔧 Configuração do Firebase

```javascript
// js/config.js
const firebaseConfig = {
    apiKey: "sua-api-key",
    authDomain: "seu-projeto.firebaseapp.com",
    databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com/",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "sua-app-id"
};
```

### Configurações Necessárias no Firebase:

1. **Authentication**: Habilitar Google, Email/Password e Anonymous
2. **Realtime Database**: Configurar regras de segurança
3. **Hosting** (opcional): Para deploy alternativo

## 🐛 Problemas Conhecidos

- **AR em iOS**: Suporte limitado, foque em dispositivos Android
- **Câmera em HTTP**: Funciona apenas em HTTPS
- **Performance**: Dispositivos antigos podem ter lag na renderização 3D
- **GPS Indoor**: Precisão reduzida em ambientes fechados

## 🔄 Roadmap

### MVP ✅
- [x] Estrutura básica HTML/CSS/JS
- [x] Sistema de autenticação
- [x] Mapas e geolocalização
- [x] Interface AR básica
- [x] Captura de fantasmas
- [x] Sistema de inventário
- [x] QR Scanner para contenção
- [x] Suporte offline (PWA)

### Versão 1.1 🚧
- [ ] Multiplayer em tempo real
- [ ] Chat entre jogadores
- [ ] Fantasmas fortes (cooperativo)
- [ ] Mais locais de jogo
- [ ] Ranking global

### Versão 1.2 📋
- [ ] Sistema de níveis com perks
- [ ] Desafios diários
- [ ] Eventos temporários
- [ ] Push notifications

### Versão 1.3 🎨
- [ ] Tutorial interativo
- [ ] Melhorias de performance
- [ ] Mais easter eggs
- [ ] Sistema de conquistas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- Inspirado no filme **Ghostbusters (1984)**
- Comunidade **A-Frame** e **AR.js**
- **Firebase** por serviços gratuitos
- **GitHub Pages** por hospedagem gratuita
- Todos os testadores e contribuidores

## 📞 Contato

- **Desenvolvedor**: Pedra Branca Games
- **GitHub**: [@pedrabrancagames](https://github.com/pedrabrancagames)
- **Issues**: [GitHub Issues](https://github.com/pedrabrancagames/qoder/issues)

---

**🎮 Divirta-se caçando fantasmas!** 👻⚡

*"Quem você vai chamar? Ghostbusters!"*