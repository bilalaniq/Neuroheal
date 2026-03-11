import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  color: string;
  bgColor: string;
}

const menuItems: MenuItem[] = [
  { icon: 'pulse', label: 'Log Migraine', route: '/migraine', color: '#a8d5c4', bgColor: '#d4e8e0' },
  { icon: 'trending-up', label: 'Patterns', route: '/patterns', color: '#a8d5c4', bgColor: '#d4e8e0' },
  { icon: 'document', label: 'Export', route: '/export', color: '#a8d5c4', bgColor: '#d4e8e0' },
  { icon: 'notifications', label: 'Notifications', route: '/notification-settings', color: '#a8d5c4', bgColor: '#d4e8e0' },
];

export default function FloatingMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.parallel([
      Animated.spring(animation, {
        toValue,
        useNativeDriver: true,
        friction: 6,
        tension: 40,
      }),
      Animated.timing(rotationAnim, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setIsOpen(!isOpen);
  };

  const handleMenuItemPress = (route: string) => {
    toggleMenu();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const menuIconOpacity = rotationAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const closeIconOpacity = rotationAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const menuIconRotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const closeIconRotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={toggleMenu} />
        </Animated.View>
      )}

      {/* Menu Items */}
      {menuItems.map((item, index) => {
        const itemAnimation = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(menuItems.length - index) * 74],
        });

        const itemOpacity = animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        });

        const itemScale = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        });

        return (
          <Animated.View
            key={item.route}
            style={[
              styles.menuItemContainer,
              {
                transform: [
                  { translateY: itemAnimation },
                  { scale: itemScale },
                ],
                opacity: itemOpacity,
              },
            ]}
            pointerEvents={isOpen ? 'auto' : 'none'}
          >
            <Pressable
              onPress={() => handleMenuItemPress(item.route)}
              style={({ pressed }) => [
                styles.menuItem,
                { backgroundColor: item.bgColor },
                pressed && styles.menuItemPressed,
              ]}
            >
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemText, { color: item.color }]}>{item.label}</Text>
                <View style={[styles.menuIconContainer, { backgroundColor: '#fff' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
              </View>
            </Pressable>
          </Animated.View>
        );
      })}

      {/* Main Menu Button */}
      <View style={styles.fabContainer}>
        <Pressable
          onPress={toggleMenu}
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
        >
          <View style={{ position: 'relative', width: 32, height: 32 }}>
            <Animated.View
              style={{
                opacity: menuIconOpacity,
                position: 'absolute',
                transform: [{ rotate: menuIconRotation }],
              }}
            >
              <Ionicons name="menu" size={32} color="#fff" />
            </Animated.View>
            <Animated.View
              style={{
                opacity: closeIconOpacity,
                transform: [{ rotate: closeIconRotation }],
              }}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </Animated.View>
          </View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 1,
  },
  menuItemContainer: {
    position: 'absolute',
    bottom: 60,
    right: 24,
    zIndex: 2,
  },
  menuItem: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  menuItemPressed: {
    transform: [{ scale: 0.96 }],
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 3,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#a8d5c4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#a8d5c4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  fabPressed: {
    transform: [{ scale: 0.9 }],
  },
});
