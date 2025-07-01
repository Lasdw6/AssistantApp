import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  recognizedText?: string;
}

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.7, 300);

// Use native driver only on mobile platforms
const useNativeDriver = Platform.OS !== 'web';

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isListening,
  isSpeaking,
  isSupported,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  recognizedText,
}) => {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Create multiple wave rings
  const waveRings = [wave1, wave2, wave3];
  const [waveHeights, setWaveHeights] = useState([0, 0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    if (isListening) {
      startListeningAnimation();
    } else if (isSpeaking) {
      startSpeakingAnimation();
    } else {
      stopAllAnimations();
    }
  }, [isListening, isSpeaking]);

  useEffect(() => {
    // Simulate sound wave data when listening or speaking
    if (isListening || isSpeaking) {
      const interval = setInterval(() => {
        setWaveHeights(prev => 
          prev.map(() => Math.random() * 0.8 + 0.2)
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setWaveHeights([0, 0, 0, 0, 0, 0, 0, 0]);
    }
  }, [isListening, isSpeaking]);

  const startListeningAnimation = () => {
    // Pulse animation for listening
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
      ])
    ).start();

    // Wave rings animation
    waveRings.forEach((wave, index) => {
      Animated.loop(
        Animated.timing(wave, {
          toValue: 1,
          duration: 2000 + index * 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver,
        })
      ).start();
    });

    // Glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver,
        }),
      ])
    ).start();
  };

  const startSpeakingAnimation = () => {
    // Rotation animation for speaking
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver,
      })
    ).start();

    // Gentle pulse for speaking
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
      ])
    ).start();
  };

  const stopAllAnimations = () => {
    pulseAnim.stopAnimation();
    wave1.stopAnimation();
    wave2.stopAnimation();
    wave3.stopAnimation();
    rotateAnim.stopAnimation();
    glowAnim.stopAnimation();

    // Reset to default values
    Animated.parallel([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver,
      }),
      Animated.timing(wave1, {
        toValue: 0,
        duration: 300,
        useNativeDriver,
      }),
      Animated.timing(wave2, {
        toValue: 0,
        duration: 300,
        useNativeDriver,
      }),
      Animated.timing(wave3, {
        toValue: 0,
        duration: 300,
        useNativeDriver,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!isSupported) return;
    
    if (isListening) {
      onStopListening();
    } else if (isSpeaking) {
      onStopSpeaking();
    } else {
      onStartListening();
    }
  };

  const getStatusText = () => {
    if (!isSupported) return 'Speech not supported';
    if (isListening) return 'Listening...';
    if (isSpeaking) return 'Speaking...';
    return 'Tap to speak';
  };

  const getStatusIcon = () => {
    if (!isSupported) return '🚫';
    if (isListening) return '🎤';
    if (isSpeaking) return '🔊';
    return '🎙️';
  };

  // Rotation interpolation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Glow opacity interpolation
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      <View style={styles.visualizerContainer}>
        
        {/* Outer glow effect */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: glowOpacity,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Wave rings */}
        {waveRings.map((wave, index) => {
          const scale = wave.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 2.5 + index * 0.5],
          });
          const opacity = wave.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.6, 0.3, 0],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.waveRing,
                {
                  transform: [{ scale }],
                  opacity,
                  borderColor: isListening ? '#FF3B30' : '#007AFF',
                },
              ]}
            />
          );
        })}

        {/* Sound wave bars */}
        <View style={styles.soundWaveContainer}>
          {waveHeights.map((height, index) => (
            <Animated.View
              key={index}
              style={[
                styles.soundWaveBar,
                {
                  height: height * 40 + 10,
                  backgroundColor: isListening ? '#FF3B30' : isSpeaking ? '#007AFF' : '#ccc',
                  opacity: height,
                },
              ]}
            />
          ))}
        </View>

        {/* Main circle */}
        <Animated.View
          style={[
            styles.mainCircle,
            {
              transform: [
                { scale: pulseAnim },
                { rotate: isSpeaking ? spin : '0deg' },
              ],
              backgroundColor: isListening ? '#FF3B30' : isSpeaking ? '#007AFF' : isSupported ? '#4CAF50' : '#999',
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.circleButton, { pointerEvents: isSupported ? 'auto' : 'none' }]}
            onPress={handlePress}
            disabled={!isSupported}
            activeOpacity={0.8}
          >
            <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Center ripple effect */}
        {(isListening || isSpeaking) && (
          <Animated.View
            style={[
              styles.centerRipple,
              {
                transform: [{ scale: pulseAnim }],
                opacity: glowOpacity,
              },
            ]}
          />
        )}
      </View>

      {/* Status text */}
      <Text style={[
        styles.statusText,
        { color: isListening ? '#FF3B30' : isSpeaking ? '#007AFF' : '#333' }
      ]}>
        {getStatusText()}
      </Text>

      {/* Recognized text */}
      {typeof recognizedText === 'string' && recognizedText.trim() !== '' && (
        <View style={styles.recognizedTextContainer}>
          <Text style={styles.recognizedText}>{`"${recognizedText}"`}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  visualizerContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: CIRCLE_SIZE * 1.2,
    height: CIRCLE_SIZE * 1.2,
    borderRadius: CIRCLE_SIZE * 0.6,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  waveRing: {
    position: 'absolute',
    width: CIRCLE_SIZE * 0.8,
    height: CIRCLE_SIZE * 0.8,
    borderRadius: CIRCLE_SIZE * 0.4,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  soundWaveContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: CIRCLE_SIZE * 0.6,
    height: 60,
  },
  soundWaveBar: {
    width: 3,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  mainCircle: {
    width: CIRCLE_SIZE * 0.5,
    height: CIRCLE_SIZE * 0.5,
    borderRadius: CIRCLE_SIZE * 0.25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  circleButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CIRCLE_SIZE * 0.25,
  },
  centerRipple: {
    position: 'absolute',
    width: CIRCLE_SIZE * 0.3,
    height: CIRCLE_SIZE * 0.3,
    borderRadius: CIRCLE_SIZE * 0.15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 5,
  },
  statusIcon: {
    fontSize: 48,
    color: 'white',
  },
  statusText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  recognizedTextContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    maxWidth: width * 0.8,
  },
  recognizedText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default VoiceVisualizer; 