import React, { useState, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Text 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme';

interface InteractiveGifButtonProps {
  isListening: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  size?: number;
  showLabel?: boolean;
  speechError?: boolean;
}

const InteractiveGifButton: React.FC<InteractiveGifButtonProps> = ({
  isListening,
  onPressIn,
  onPressOut,
  size = 200,
  showLabel = true,
  speechError = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    onPressIn();
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    onPressOut();
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glowEffect,
          speechError && styles.errorGlow,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: size * 0.6,
            opacity: glowAnim,
            transform: [{ scale: glowAnim }],
          },
        ]}
      />

      {/* Main button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            width: size,
            height: size,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size * 0.5,
            },
            isListening && styles.listeningButton,
            isPressed && styles.pressedButton,
            speechError && styles.errorHighlight,
          ]}
          activeOpacity={1}
        >
          <View style={[
            styles.innerCircle,
            {
              width: size * 0.9,
              height: size * 0.9,
              borderRadius: size * 0.45,
              backgroundColor: isListening ? COLORS.primary : COLORS.surfaceHighlight,
            }
          ]}>
            <MaterialIcons
              name={isListening ? "graphic-eq" : "mic"}
              size={size * 0.4}
              color={isListening ? COLORS.textInverse : COLORS.textPrimary}
            />
          </View>

          {/* Overlay for listening state */}
          {isListening && (
            <View style={[styles.listeningOverlay, {
              width: size,
              height: size,
              borderRadius: size * 0.5,
            }]}>
              <View style={styles.listeningIndicator} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Status label */}
      {showLabel && (
        <Animated.View
          style={[
            styles.labelContainer,
            {
              opacity: glowAnim,
              transform: [{ scale: glowAnim }],
            },
          ]}
        >
          <Text style={[
            styles.labelText,
            isListening && styles.listeningLabelText,
          ]}>
            {isListening ? 'Release to Send' : 'Hold to Talk'}
          </Text>
        </Animated.View>
      )}

      {/* Pulse effect when listening */}
      {isListening && (
        <Animated.View
          style={[
            styles.pulseEffect,
            {
              width: size * 1.1,
              height: size * 1.1,
              borderRadius: size * 0.55,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listeningButton: {
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pressedButton: {
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  labelContainer: {
    position: 'absolute',
    bottom: -40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  labelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  listeningLabelText: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  pulseEffect: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
    opacity: 0.3,
  },
  errorHighlight: {
    borderWidth: 4,
    borderColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  errorGlow: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 16,
  },
});

export default InteractiveGifButton; 