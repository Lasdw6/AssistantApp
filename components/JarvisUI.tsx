import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme';

interface JarvisUIProps {
  isListening: boolean;
  onPress: () => void;
  size?: number;
}

const JarvisUI: React.FC<JarvisUIProps> = ({ 
  isListening, 
  onPress, 
  size = 200 
}) => {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const quarterRotateAnim = useRef(new Animated.Value(0)).current;
  const threeFourthsRotateAnim = useRef(new Animated.Value(0)).current;
  const barsRotateAnim = useRef(new Animated.Value(0)).current;
  const barsOpacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Pulse animation for center
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotating circle animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    // Quarter circle animation (recording indicator)
    Animated.loop(
      Animated.timing(quarterRotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // 3/4 circle animation
    Animated.loop(
      Animated.timing(threeFourthsRotateAnim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    ).start();

    // Bars rotation animation
    Animated.loop(
      Animated.timing(barsRotateAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();

    // Bars opacity animation based on listening state
    Animated.timing(barsOpacityAnim, {
      toValue: isListening ? 1 : 0.3,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isListening]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const quarterRotateInterpolate = quarterRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const threeFourthsRotateInterpolate = threeFourthsRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const barsRotateInterpolate = barsRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, { width: size * 1.2, height: size * 1.2 }]}>
      
      {/* Layer 6: Final outer circle */}
      <View style={[styles.outerCircle, { 
        width: size, 
        height: size, 
        borderRadius: size * 0.5,
        borderWidth: 1,
      }]} />

      {/* Layer 5: Bars in a circle */}
      <Animated.View 
        style={[
          styles.barsContainer,
          {
            width: size * 0.9,
            height: size * 0.9,
            transform: [{ rotate: barsRotateInterpolate }],
            opacity: barsOpacityAnim,
          }
        ]}
      >
        {Array.from({ length: 16 }, (_, i) => (
          <View
            key={`bar-${i}`}
            style={[
              styles.bar,
              {
                transform: [{ rotate: `${i * 22.5}deg` }],
                top: 2,
                left: '50%',
                marginLeft: -1,
                transformOrigin: `1px ${size * 0.45 - 2}px`,
              }
            ]}
          />
        ))}
      </Animated.View>

            {/* Layer 4: 3/4 circle */}
      <Animated.View 
        style={[
          styles.threeFourthsCircle,
          {
            width: size * 0.75,
            height: size * 0.75,
            borderRadius: size * 0.375,
            transform: [{ rotate: threeFourthsRotateInterpolate }],
          }
        ]}
      />

      {/* Layer 2: Rotating circle */}
      <Animated.View 
        style={[
          styles.rotatingCircle,
          {
            width: size * 0.45,
            height: size * 0.45,
            borderRadius: size * 0.225,
            transform: [{ rotate: rotateInterpolate }]
          }
        ]}
      />

      {/* Layer 3: Yellow quarter circle (recording indicator) - moved to be on top */}
      <Animated.View 
        style={[
          styles.yellowQuarterCircle,
          {
            width: size * 0.65,
            height: size * 0.65,
            borderRadius: size * 0.325,
            transform: [{ rotate: quarterRotateInterpolate }],
            opacity: 1,
          }
        ]}
      />

      {/* Layer 1: Center circle with upside down triangle */}
      <Animated.View 
        style={[
          styles.centerCircle,
          {
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: size * 0.15,
            transform: [{ scale: pulseAnim }]
          }
        ]}
      >
        {/* Upside down triangle */}
        <View style={[styles.triangle, { 
          borderTopWidth: size * 0.12,
          borderLeftWidth: size * 0.09,
          borderRightWidth: size * 0.09,
        }]} />
      </Animated.View>

    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerCircle: {
    position: 'absolute',
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
    opacity: 0.6,
    borderWidth: 2,
  },
  barsContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    position: 'absolute',
    width: 4,
    height: 20,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  threeFourthsCircle: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
    borderRightColor: 'transparent', // This creates the 3/4 circle effect
    opacity: 0.8,
  },
  yellowQuarterCircle: {
    position: 'absolute',
    borderWidth: 12,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    borderTopColor: '#FFD700',
    borderRightColor: '#FFD700',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  rotatingCircle: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
    borderTopColor: COLORS.accent,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    opacity: 0.9,
  },
  centerCircle: {
    position: 'absolute',
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.95,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopColor: '#F0F0F0', // Almost white
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomWidth: 0,
  },
});

export default JarvisUI; 