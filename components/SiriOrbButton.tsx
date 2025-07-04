import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme';

interface SiriOrbButtonProps {
  isListening: boolean;
  onPress: () => void;
  size?: number;
}

const SiriOrbButton: React.FC<SiriOrbButtonProps> = ({ 
  isListening, 
  onPress, 
  size = 64 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const glowOpacityAnim = useRef(new Animated.Value(0.3)).current;
  
  // Create more particles for fuller 3D effect
  const particleAnimations = useRef(
    Array.from({ length: 48 }, () => ({
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
      opacity: new Animated.Value(0.4 + Math.random() * 0.6),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Continuous breathing animation (always active)
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0.98,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Continuous slow rotation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );

    // Continuous glow pulse
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacityAnim, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacityAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    breatheAnimation.start();
    rotateAnimation.start();
    glowAnimation.start();

    if (isListening) {
      // More intense pulsing when listening
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

      // Organic particle movements
      const particleAnimationSequences = particleAnimations.map((particle, index) => {
        const moveDistance = 8 + Math.random() * 12;
        const angle = (index / particleAnimations.length) * 2 * Math.PI + Math.random() * 0.5;
        
        return Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(particle.scale, {
                toValue: 0.2 + Math.random() * 1.2,
                duration: 800 + Math.random() * 600,
                useNativeDriver: true,
              }),
                             Animated.timing(particle.opacity, {
                 toValue: (0.1 + Math.random() * 0.9) * (particles[index]?.baseOpacity || 0.6),
                 duration: 600 + Math.random() * 800,
                 useNativeDriver: true,
               }),
              Animated.timing(particle.translateX, {
                toValue: Math.cos(angle) * moveDistance * (0.5 + Math.random()),
                duration: 1000 + Math.random() * 1000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.translateY, {
                toValue: Math.sin(angle) * moveDistance * (0.5 + Math.random()),
                duration: 1000 + Math.random() * 1000,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(particle.scale, {
                toValue: 0.3 + Math.random() * 0.8,
                duration: 600 + Math.random() * 800,
                useNativeDriver: true,
              }),
                             Animated.timing(particle.opacity, {
                 toValue: (0.2 + Math.random() * 0.8) * (particles[index]?.baseOpacity || 0.6),
                 duration: 800 + Math.random() * 600,
                 useNativeDriver: true,
               }),
              Animated.timing(particle.translateX, {
                toValue: 0,
                duration: 1200 + Math.random() * 800,
                useNativeDriver: true,
              }),
              Animated.timing(particle.translateY, {
                toValue: 0,
                duration: 1200 + Math.random() * 800,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
      });

      pulseAnimation.start();
      particleAnimationSequences.forEach(anim => anim.start());

      return () => {
        pulseAnimation.stop();
        particleAnimationSequences.forEach(anim => anim.stop());
        breatheAnimation.stop();
        rotateAnimation.stop();
        glowAnimation.stop();
      };
    } else {
      // Reset listening-specific animations
      scaleAnim.setValue(1);
      particleAnimations.forEach(particle => {
        particle.scale.setValue(0.5 + Math.random() * 0.5);
        const particleIndex = particleAnimations.indexOf(particle);
        const particleData = particles.find(p => p.index === particleIndex);
        particle.opacity.setValue((0.4 + Math.random() * 0.6) * (particleData?.baseOpacity || 0.6));
        particle.translateX.setValue(0);
        particle.translateY.setValue(0);
      });
    }

    return () => {
      breatheAnimation.stop();
      rotateAnimation.stop();
      glowAnimation.stop();
    };
  }, [isListening]);

  const generateParticlePositions = () => {
    const particles = [];
    const radius = size / 2 - 6;
    
    // Create particles in multiple 3D layers for depth
    const layers = [
      { count: 12, radiusMultiplier: 0.4, zIndex: 20, type: 'core' },
      { count: 16, radiusMultiplier: 0.65, zIndex: 15, type: 'mid' },
      { count: 12, radiusMultiplier: 0.85, zIndex: 10, type: 'outer' },
      { count: 8, radiusMultiplier: 0.25, zIndex: 25, type: 'inner' },
    ];
    
    let particleIndex = 0;
    layers.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        // Create more organic, spiral-like positioning
        const angle = (i / layer.count) * 2 * Math.PI + (Math.random() - 0.5) * 0.8;
        const spiralOffset = (i / layer.count) * Math.PI * 0.5;
        const radiusVariation = 0.8 + Math.random() * 0.4;
        
        const x = Math.cos(angle + spiralOffset) * radius * layer.radiusMultiplier * radiusVariation;
        const y = Math.sin(angle + spiralOffset) * radius * layer.radiusMultiplier * radiusVariation;
        
        particles.push({ 
          x, 
          y, 
          layer: layer.type, 
          zIndex: layer.zIndex,
          index: particleIndex,
          size: layer.type === 'core' ? 3 : layer.type === 'inner' ? 2.5 : 2,
          baseOpacity: layer.type === 'core' ? 0.9 : layer.type === 'inner' ? 0.8 : 0.6
        });
        particleIndex++;
      }
    });
    
    return particles;
  };

  const particles = generateParticlePositions();

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow effect */}
      <Animated.View 
        style={[
          styles.outerGlow,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
            opacity: glowOpacityAnim,
            transform: [{ scale: breatheAnim }]
          }
        ]}
      />
      
      {/* Main orb with 3D effect */}
      <Animated.View 
        style={[
          styles.orb, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            transform: [
              { scale: scaleAnim },
              { rotate: rotateInterpolate }
            ]
          }
        ]}
      >
        {/* Inner gradient layer for 3D depth */}
        <View style={[styles.innerOrb, { width: size * 0.85, height: size * 0.85, borderRadius: size * 0.425 }]} />
        
        {/* Core glow */}
        <Animated.View 
          style={[
            styles.coreGlow,
            {
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: size * 0.3,
              opacity: glowOpacityAnim,
            }
          ]}
        />
        
        {/* Render particles in z-order */}
        {particles
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((particle, index) => {
            const particleAnim = particleAnimations[particle.index];
            return (
              <Animated.View
                key={`particle-${particle.index}`}
                style={[
                  styles.particle,
                  {
                    left: size / 2 + particle.x - particle.size / 2,
                    top: size / 2 + particle.y - particle.size / 2,
                    width: particle.size,
                    height: particle.size,
                    borderRadius: particle.size / 2,
                    zIndex: particle.zIndex,
                    backgroundColor: particle.layer === 'core' ? COLORS.accent : 
                                   particle.layer === 'inner' ? '#ffffff' :
                                   particle.layer === 'mid' ? COLORS.primaryVariant : 
                                   COLORS.onPrimary,
                    opacity: particleAnim.opacity,
                    transform: [
                      { scale: particleAnim.scale },
                      { translateX: particleAnim.translateX },
                      { translateY: particleAnim.translateY }
                    ]
                  }
                ]}
              />
            );
          })}
        
        {/* Microphone icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons 
            name="mic" 
            size={size * 0.35} 
            color={COLORS.onPrimary} 
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerGlow: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    opacity: 0.2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  orb: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    // Add gradient-like effect through border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  innerOrb: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '7.5%',
    left: '7.5%',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  coreGlow: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
    opacity: 0.6,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  iconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 20,
  },
  particle: {
    position: 'absolute',
    shadowColor: 'rgba(255, 255, 255, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 12,
  },
});

export default SiriOrbButton; 