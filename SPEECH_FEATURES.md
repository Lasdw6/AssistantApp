# Speech Features Documentation

This app now includes comprehensive Text-to-Speech (TTS) and Speech-to-Text (STT) functionality using **free** libraries.

## 🎙️ Speech-to-Text (STT) Features

### Library Used: `@react-native-voice/voice`

- **Cost**: Completely FREE
- **Works**: Offline on device
- **Languages**: Supports multiple languages (default: English)

### How to Use:

1. Tap the microphone button (🎙️) next to the text input
2. When the button turns red (🎤), start speaking clearly
3. Your speech will be automatically converted to text
4. Edit the text if needed, then send your message

## 🔊 Text-to-Speech (TTS) Features

### Library Used: `react-native-tts`

- **Cost**: Completely FREE
- **Works**: Offline on device
- **Voices**: Uses system voices

### How it Works:

1. **Auto-speak responses**: Assistant responses are automatically spoken when speech is enabled
2. **Tap to replay**: Tap any assistant message to hear it again
3. **Speech control**: Use the speaker icon (🔊/🔇) in the header to toggle speech on/off
4. **Stop speaking**: Tap "Stop" to interrupt speech playback

## 🎛️ Controls

| Button   | Function                    |
| -------- | --------------------------- |
| ❓       | Open speech features guide  |
| 🔊/🔇    | Toggle speech output on/off |
| 🎙️       | Start voice recording       |
| 🎤 (red) | Currently listening         |
| Stop     | Interrupt speech playback   |

## 💡 Tips for Best Experience

1. **Quiet Environment**: Speak in a quiet environment for better speech recognition
2. **Clear Speech**: Speak clearly and at normal pace
3. **Edit Text**: You can edit the recognized text before sending
4. **Toggle Speech**: Turn off speech if you prefer silent mode
5. **Tap Messages**: Tap assistant messages to hear them again

## 🔧 Technical Details

### Dependencies Added:

```json
{
  "react-native-tts": "^4.1.0",
  "@react-native-voice/voice": "^3.2.4"
}
```

### Key Components:

- `SpeechManager.tsx`: Core speech functionality
- `SpeechGuide.tsx`: User guide modal
- `ChatScreen.tsx`: Integrated speech controls

### Permissions Required:

- **Android**: `RECORD_AUDIO` permission
- **iOS**: Microphone usage permission

## 🆓 Free Alternatives Considered

### For TTS:

1. ✅ **react-native-tts** (chosen) - Completely free, offline
2. **Expo Speech** - Free but had dependency conflicts
3. **Google Cloud TTS** - 1M characters/month free tier
4. **Web Speech API** - Free for web version

### For STT:

1. ✅ **@react-native-voice/voice** (chosen) - Completely free, offline
2. **Expo Speech Recognition** - Free but limited platform support
3. **Google Cloud Speech-to-Text** - 60 minutes/month free tier
4. **Web Speech API** - Free for web version

## 🚀 Future Enhancements

- [ ] Language selection for STT
- [ ] Voice selection for TTS
- [ ] Speech rate/pitch controls
- [ ] Continuous conversation mode
- [ ] Voice commands for app navigation

## 🐛 Troubleshooting

### Speech Recognition Not Working:

1. Check microphone permissions
2. Ensure device has speech recognition capability
3. Try speaking more clearly or in a quieter environment

### Text-to-Speech Not Working:

1. Check device volume
2. Ensure TTS engine is installed on device
3. Try toggling speech off and on again

### Performance Issues:

1. Speech processing happens on-device (offline)
2. No internet required for basic functionality
3. Restart app if speech features become unresponsive
