# NimbusWave 🚀
![image](https://github.com/user-attachments/assets/d5e4edf1-9f1a-4ec3-b519-6129ccf5bc29)
[![License](https://img.shields.io/badge/license-GPL3.0-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)

NimbusWave is an AI-powered edge deployment platform that helps developers seamlessly deploy and scale their JavaScript web applications using Cloudflare Workers. Simply upload your build folder, and our AI assistant will guide you through the deployment process.

## 🌟 Features

- **AI-Guided Deployments**: Intelligent assistant helps you through the entire deployment process
- **Edge-First Architecture**: Built on Cloudflare Workers for optimal performance
- **Zero Configuration**: Upload your build folder and we handle the rest
- **Instant Deployments**: No cold starts, lightning-fast deployments
- **Global Scale**: Leverage Cloudflare's global network
- **Framework Agnostic**: Deploy any JavaScript/TypeScript web application

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Mayuresh-22/nimbuswave.git

# Navigate to the project directory
cd NimbusWave

# Install dependencies
npm install

# Start development server for app & server
npm run dev
```

## 🏗️ Project Structure

```
NimbusWave/
├── app/                    # Frontend application (Vite + React)
│   ├── src/               # Source files
│   └── package.json       # Frontend dependencies
├── server/                # Backend application (Hono.js)
│   ├── src/              # API source files
│   └── package.json      # Backend dependencies
└── package.json          # Root package.json
```

## 🛠️ How It Works

1. **Upload**: Users upload their web application's build folder (as a ZIP file)
2. **Process**: NimbusWave processes the files and uploads them to Cloudinary
3. **Deploy**: The application is deployed to Cloudflare's edge network
4. **Access**: Users receive a unique URL to access their deployed application

### Technical Implementation

- **Edge Network**: Utilizes Cloudflare Workers for serverless deployment
- **File Storage**: Cloudinary for static asset management
- **Frontend**: Built with Vite and React for optimal development experience
- **Backend**: Powered by Hono.js for efficient API handling
- **Zero Cold Starts**: Leverages Cloudflare's always-hot edge network

## 🧪 Development

```bash
# Run frontend
cd app
npm run dev

# Run backend
cd server
npm run dev
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ✨ Contributors

<a href="https://github.com/Mayuresh-22/nimbuswave/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Mayuresh-22/nimbuswave" />
</a>

## 🌐 Links

- Coming soon...

## 🙏 Acknowledgments

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Cloudinary](https://cloudinary.com/)
- [Hono.js](https://hono.dev/)
- [Vite](https://vitejs.dev/)

---

<p align="center">Made with ❤️ by the NimbusWave team</p>
