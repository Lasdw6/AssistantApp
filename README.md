# Personal Assistant React Native App

A React Native mobile application built with Expo that provides a chat interface for interacting with the Personal Assistant API.

## Features

- 🔥 **Real-time Chat Interface**: Clean, modern chat UI with message bubbles
- 🔄 **API Integration**: Full integration with the Personal Assistant API
- 📱 **Cross-platform**: Works on both iOS and Android
- 🎯 **TypeScript**: Type-safe development experience
- 📡 **Connection Status**: Visual indicator for API connectivity
- 📄 **Source Citations**: Displays sources used by the assistant when available
- ⚡ **Fast Response**: Optimized for quick interactions

## Prerequisites

- Node.js (>= 16)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Personal Assistant API running (default: http://localhost:8000)

## Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure API URL:**

   Update the `.env` file with your API URL:

   ```
   API_URL=http://localhost:8000
   ```

   For development on a physical device, use your computer's IP address:

   ```
   API_URL=http://192.168.1.100:8000
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

## Running the App

### Development

- **iOS Simulator:** Press `i` in the terminal or scan QR code with Camera app
- **Android Emulator:** Press `a` in the terminal or scan QR code with Expo Go app
- **Physical Device:** Install Expo Go app and scan the QR code
- **Web:** Press `w` in the terminal to run in web browser

### Production Build

For production builds, use:

```bash
# iOS
npm run build:ios

# Android
npm run build:android
```

## API Configuration

The app connects to the Personal Assistant API using environment variables. Make sure your API is running and accessible.

### Environment Variables

- `API_URL`: The base URL of your Assistant API (default: http://localhost:8000)

### API Endpoints Used

- `POST /query`: Send chat messages to the assistant
- `GET /health`: Check API connectivity
- `POST /ingest`: Upload documents (future feature)

## Project Structure

```
app/
├── components/
│   └── ChatScreen.tsx      # Main chat interface
├── services/
│   └── api.ts             # API service layer
├── types/
│   └── env.d.ts           # TypeScript environment declarations
├── .env                   # Environment configuration
├── App.tsx               # Main app component
└── package.json          # Dependencies and scripts
```

## Features in Detail

### Chat Interface

- Real-time messaging with the assistant
- Auto-scrolling to latest messages
- Loading indicators during API calls
- Error handling with user-friendly messages

### API Integration

- Type-safe API calls using TypeScript interfaces
- Automatic retry logic for failed requests
- Connection status monitoring
- Request/response logging for debugging

### UI/UX

- Modern, iOS-style design
- Responsive layout for different screen sizes
- Keyboard-aware input handling
- Source citations display

## Troubleshooting

### Common Issues

1. **API Connection Failed**

   - Ensure the Assistant API is running
   - Check the API_URL in `.env` file
   - For physical devices, use your computer's IP address

2. **Environment Variables Not Loading**

   - Restart the Expo development server
   - Clear Metro cache: `npm start -- --clear`

3. **TypeScript Errors**
   - Run `npm run type-check` to see all type errors
   - Ensure all dependencies are properly installed

### Development Tips

- Use `console.log` statements for debugging (visible in terminal)
- Use React Native Debugger for advanced debugging
- Test on both platforms during development
- Keep the API server running while developing

## Future Enhancements

- [ ] Voice input/output support
- [ ] Document upload interface
- [ ] Chat history persistence
- [ ] Push notifications
- [ ] Dark mode support
- [ ] Offline message queuing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on both platforms
5. Submit a pull request

## License

This project is part of the Personal Assistant system. See the main project LICENSE file for details.
