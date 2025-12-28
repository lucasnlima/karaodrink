# KaraDrink 🎤🍺

Um jogo de karaoke interativo e divertido para brincadeiras com amigos! A versão 1.0 traz uma experiência completa de karaoke com vídeos do YouTube e sistema de penalidades com bebidas.

## 🎯 Sobre o Projeto

O KaraDrink é uma aplicação web desenvolvida em React que combina karaoke com um drink game. Os participantes cantam músicas utilizando vídeos do YouTube como base e recebem pontuações aleatórias acompanhadas de penalidades relacionadas a bebidas. Perfeito para festas e reuniões descontraídas!

### ✨ Funcionalidades Principais

- **🎵 Biblioteca de Músicas**: Lista pré-definida com músicas populares de diversos gêneros
- **🔍 Busca Personalizada**: Permite inserir códigos/ID de vídeos do YouTube
- **🎥 Player Integrado**: Reprodução automática de vídeos do YouTube otimizada para karaoke
- **🎯 Sistema de Pontuação**: Geração aleatória de notas após cada performance
- **🍺 Penalidades Divertidas**: Mais de 15 tipos diferentes de prendas relacionadas a bebidas
- **🎮 Interface Intuitiva**: Design responsivo e fácil de usar
- **🔊 Efeitos Sonoros**: Sons especiais para tornar a experiência mais imersiva

## 🛠️ Tecnologias Utilizadas

- **React 17** - Framework principal
- **Material-UI** - Biblioteca de componentes
- **React Router DOM** - Navegação entre páginas
- **React YouTube** - Integração com YouTube
- **Create React App** - Ferramenta de build

## 📦 Instalação

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

### Passos para Instalação

1. **Clone o repositório:**

   ```bash
   git clone <url-do-repositorio>
   cd karaodrink
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Execute o projeto:**

   ```bash
   npm start
   ```

4. **Acesse no navegador:**
   ```
   http://localhost:3000
   ```

## 🎮 Como Jogar

1. **Página Inicial**: Clique em "PLAY!" para começar
2. **Seleção de Música**: Escolha uma música da lista ou insira um código/ID do YouTube
3. **Karaoke**: Assista e cante junto com o vídeo (controles ocultos para foco total na música)
4. **Pontuação**: Receba uma nota aleatória (79-98 pontos) após a música
5. **Penalidade**: Veja qual prenda você ganhou e execute a punição!
6. **Continuar**: Volte ao menu para escolher a próxima música

## 📁 Estrutura do Projeto

```
karaodrink/
├── public/                    # Arquivos públicos e estáticos
│   ├── index.html
│   ├── manifest.json
│   └── assets/
├── src/
│   ├── App.jsx               # Componente principal
│   ├── routes.jsx            # Configuração de rotas
│   ├── index.js              # Ponto de entrada
│   ├── data/
│   │   ├── songs.json        # Lista de músicas
│   │   └── prendas.json      # Lista de penalidades
│   ├── pages/                # Páginas da aplicação
│   │   ├── StartPage/        # Tela inicial
│   │   ├── MenuPage/         # Seleção de músicas
│   │   ├── VideoPage/        # Player de vídeo
│   │   └── ScorePage/        # Pontuação e penalidades
│   └── assets/               # Imagens e recursos
├── package.json
└── README.md
```

## 🎵 Músicas Disponíveis

A aplicação vem com uma seleção pré-carregada de músicas populares, incluindo:

- **Rock/Classics**: Pearl Jam, Red Hot Chili Peppers, Audioslave
- **Pop**: Bruno Mars, The Weeknd, Arctic Monkeys
- **MPB**: Chitãozinho & Xororó, Skank, NX Zero
- **Funk**: MC G15, MC Livinho, Dennis
- **Internacionais**: Versões variadas para públicos diversos

### Adicionando Novas Músicas

Para adicionar músicas, edite o arquivo `src/data/songs.json`:

```json
{
  "name": "Nome da Música - Artista",
  "id": "VIDEO_ID_DO_YOUTUBE"
}
```

## 🍻 Sistema de Penalidades

O jogo inclui 19 tipos diferentes de penalidades, incluindo:

- **Beber shots** de vodka ou outras bebidas
- **Escolher alguém** para beber
- **Preparar drinks** para outros jogadores
- **Cantar com sotaque** ou em outro idioma
- **Dançar** a próxima música
- **Todos bebem** (raras ocasiões especiais)

## 🚀 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm test` - Executa testes
- `npm run eject` - Eject do Create React App

## 🎨 Personalização

### Estilos

Os estilos estão organizados por página em arquivos CSS separados:

- `src/pages/StartPage/style.css`
- `src/pages/MenuPage/style.css`
- `src/pages/VideoPage/style.css`
- `src/pages/ScorePage/style.css`

### Assets

Imagens e recursos visuais estão em:

- `src/assets/` - Backgrounds e headers
- `public/` - Ícones e logos

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## ⚠️ Avisos Importantes

- **Responsabilidade**: Beba com moderação e responsabilidade
- **Idade**: Destinado a maiores de 18 anos
- **Conteúdo**: Alguns vídeos podem conter linguagem imprópria
- **Direitos Autorais**: Respeite os direitos autorais das músicas e vídeos

**Divirta-se cantando e bebendo com responsabilidade! 🎉**
