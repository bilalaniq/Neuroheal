import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions,
  Modal, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface NavigationBarProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  userButtonPosition?: 'left' | 'right';
  menuRoute?: string;
  onMenuPress?: () => void;
}

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width, 448);
const DRAWER_WIDTH = width * 0.72;

// ── All nav items ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: 'home', label: 'Home', route: '/(tabs)', accent: '#c084fc' },
  { icon: 'pulse', label: 'Log Migraine', route: '/migraine', accent: '#a78bfa' },
  { icon: 'trending-up', label: 'Patterns', route: '/patterns', accent: '#818cf8' },
  { icon: 'chatbubble-ellipses', label: 'AI Chat', route: '/ai-chat', accent: '#60a5fa' },
  { icon: 'calendar', label: 'Calendar', route: '/neuro-record', accent: '#34d399' },
  { icon: 'cloud-outline', label: 'Weather Forecast', route: '/weather-forecast', accent: '#38bdf8' },
  { icon: 'medical', label: 'Emergency', route: '/emergency', accent: '#f87171' },
  { icon: 'document-text', label: 'Export', route: '/export', accent: '#fbbf24' },
  { icon: 'notifications', label: 'Notifications', route: '/notification-settings', accent: '#fb923c' },
  { icon: 'people', label: 'Community', route: '/community', accent: '#2E8B57' },
] as const;

export function NavigationBar({
  title,
  showBackButton = true,
  onBackPress,
  userButtonPosition = 'right',
  menuRoute,
  onMenuPress,
}: NavigationBarProps) {
  const router = useRouter();
  const { userData, clearUserData } = useUser();
  const insets = useSafeAreaInsets();

  const [showProfile, setShowProfile] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // ── Drawer open/close ──────────────────────────────────────────────────
  const openDrawer = () => {
    setShowDrawer(true);
    Animated.parallel([
      Animated.spring(drawerAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 60,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(drawerAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDrawer(false);
      cb?.();
    });
  };

  const handleNavPress = (route: string) => {
    closeDrawer(() => {
      router.push(route as any);
    });
  };

  // ── Back / Logout ──────────────────────────────────────────────────────
  const handleBackPress = () => {
    if (onBackPress) onBackPress();
    else router.back();
  };

  const handleLogout = () => {
    clearUserData();
    setShowProfile(false);
    router.replace('/');
  };

  const initials = userData?.name
    ? userData.name.trim().charAt(0).toUpperCase()
    : '?';

  return (
    <>
      {/* ── HEADER BAR ── */}
      <LinearGradient
        colors={['#1a0b2e', '#2d1a44']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={[styles.headerContent, { maxWidth }]}>
          <View style={styles.headerRow}>

            {/* User pill */}
            <Pressable
              onPress={() => setShowProfile(true)}
              style={({ pressed }) => [styles.userPill, pressed && styles.pressed]}
            >
              <View style={styles.avatarSm}>
                <Text style={styles.avatarSmText}>{initials}</Text>
              </View>
              <Text style={styles.pillName} numberOfLines={1}>
                {userData?.name?.split(' ')[0] ?? 'You'}
              </Text>
              <Ionicons name="chevron-down" size={13} color="rgba(233,213,255,0.55)" />
            </Pressable>

            {/* Centered title */}
            {title
              ? <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
              : <View style={styles.spacer} />
            }

            {/* Menu button — opens drawer */}
            <Pressable
              onPress={() => {
                if (typeof onMenuPress === 'function') {
                  onMenuPress();
                } else {
                  openDrawer();
                }
              }}
              style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="menu" size={22} color="#e9d5ff" />
            </Pressable>

          </View>
        </View>
      </LinearGradient>

      {/* ── SIDE DRAWER ── */}
      {showDrawer && (
        <Modal visible transparent animationType="none" onRequestClose={() => closeDrawer()}>

          {/* Backdrop */}
          <Animated.View
            style={[styles.drawerBackdrop, { opacity: backdropAnim }]}
            pointerEvents="auto"
          >
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => closeDrawer()} />
          </Animated.View>

          {/* Drawer panel */}
          <Animated.View
            style={[
              styles.drawer,
              { width: DRAWER_WIDTH, transform: [{ translateX: drawerAnim }] },
            ]}
          >
            <LinearGradient
              colors={['#1a0b2e', '#2a1040', '#1e0d38']}
              style={[styles.drawerInner, { paddingTop: insets.top + 16 }]}
            >
              {/* Drawer header */}
              <View style={styles.drawerHeader}>
                <LinearGradient colors={['#9333ea', '#6d28d9']} style={styles.drawerAvatar}>
                  <Text style={styles.drawerAvatarText}>{initials}</Text>
                </LinearGradient>
                <View style={styles.drawerUserInfo}>
                  <Text style={styles.drawerUserName} numberOfLines={1}>
                    {userData?.name || 'User'}
                  </Text>
                  <Text style={styles.drawerUserSub}>View profile</Text>
                </View>
                <Pressable
                  onPress={() => closeDrawer()}
                  style={({ pressed }) => [styles.drawerClose, pressed && { opacity: 0.6 }]}
                >
                  <Ionicons name="close" size={20} color="rgba(233,213,255,0.5)" />
                </Pressable>
              </View>

              {/* Divider */}
              <View style={styles.drawerDivider} />

              {/* Nav items */}
              <View style={styles.navList}>
                {NAV_ITEMS.map((item, i) => (
                  <Pressable
                    key={item.route}
                    onPress={() => handleNavPress(item.route)}
                    style={({ pressed }) => [
                      styles.navItem,
                      pressed && styles.navItemPressed,
                    ]}
                  >
                    {/* Colored icon box */}
                    <View style={[styles.navIconBox, { borderColor: item.accent + '44' }]}>
                      <Ionicons name={item.icon as any} size={18} color={item.accent} />
                    </View>
                    <Text style={styles.navLabel}>{item.label}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color="rgba(233,213,255,0.25)"
                      style={styles.navChevron}
                    />
                  </Pressable>
                ))}
              </View>

              {/* Divider */}
              <View style={styles.drawerDivider} />

              {/* Logout at bottom */}
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [styles.drawerLogout, pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={['rgba(220,38,38,0.15)', 'rgba(185,28,28,0.15)']}
                  style={styles.drawerLogoutInner}
                >
                  <Ionicons name="log-out-outline" size={18} color="#f87171" />
                  <Text style={styles.drawerLogoutText}>Logout</Text>
                </LinearGradient>
              </Pressable>

            </LinearGradient>
          </Animated.View>

        </Modal>
      )}

      {/* ── USER PROFILE BOTTOM SHEET ── */}
      <Modal
        visible={showProfile}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProfile(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowProfile(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>

            <View style={styles.dragHandle} />

            <View style={styles.profileTop}>
              <LinearGradient colors={['#9333ea', '#6d28d9']} style={styles.bigAvatar}>
                <Text style={styles.bigAvatarText}>{initials}</Text>
              </LinearGradient>
              <Pressable
                onPress={() => setShowProfile(false)}
                style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>

            <Text style={styles.profileName}>{userData?.name || 'User'}</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Ionicons name="transgender" size={16} color="#c084fc" />
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{userData?.gender || 'Not set'}</Text>
              </View>
              <View style={styles.infoCard}>
                <Ionicons name="calendar" size={16} color="#a78bfa" />
                <Text style={styles.infoLabel}>Age Bracket</Text>
                <Text style={styles.infoValue}>{userData?.ageBracket || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.infoCardFull}>
              <Ionicons name="hardware-chip" size={16} color="#60a5fa" />
              <Text style={styles.infoLabel}>Integrations</Text>
              <Text style={styles.infoValue}>
                {userData?.integrations?.length
                  ? userData.integrations.join(', ')
                  : 'None connected'}
              </Text>
            </View>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
            >
              <LinearGradient
                colors={['#dc2626', '#b91c1c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.logoutGradient}
              >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.logoutText}>Logout</Text>
              </LinearGradient>
            </Pressable>

          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── HEADER ──
  header: { width: '100%' },
  headerContent: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(147,51,234,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.25)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    maxWidth: 140,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  avatarSm: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#9333ea',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSmText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  pillName: { color: '#e9d5ff', fontSize: 14, fontWeight: '600', flex: 1 },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 16, fontWeight: '700',
    color: '#f3e8ff', letterSpacing: 0.2,
  },
  spacer: { flex: 1 },
  menuBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(147,51,234,0.25)',
    borderWidth: 1, borderColor: 'rgba(192,132,252,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── DRAWER ──
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,5,20,0.75)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    zIndex: 11,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  drawerInner: {
    flex: 1,
    paddingHorizontal: 0,
    borderRightWidth: 1,
    borderRightColor: 'rgba(192,132,252,0.15)',
  },

  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  drawerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  drawerAvatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  drawerUserInfo: { flex: 1 },
  drawerUserName: { color: '#f3e8ff', fontSize: 16, fontWeight: '700' },
  drawerUserSub: { color: 'rgba(233,213,255,0.4)', fontSize: 12, marginTop: 2 },
  drawerClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },

  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(192,132,252,0.1)',
    marginHorizontal: 20,
    marginVertical: 8,
  },

  navList: { paddingHorizontal: 12, paddingVertical: 4, gap: 2 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  navItemPressed: {
    backgroundColor: 'rgba(147,51,234,0.18)',
  },
  navIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  navLabel: {
    color: '#e9d5ff',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  navChevron: { marginLeft: 'auto' },

  drawerLogout: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  drawerLogoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  drawerLogoutText: { color: '#f87171', fontSize: 15, fontWeight: '600' },

  // ── PROFILE SHEET ──
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,5,20,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1a0b2e',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    borderTopWidth: 1, borderColor: 'rgba(192,132,252,0.2)',
  },
  dragHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 20,
  },
  profileTop: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'flex-start', marginBottom: 14, position: 'relative',
  },
  bigAvatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  bigAvatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  closeBtn: {
    position: 'absolute', right: 0, top: 0,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: {
    fontSize: 22, fontWeight: '800', color: '#f3e8ff',
    textAlign: 'center', marginBottom: 20, letterSpacing: -0.3,
  },
  infoGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(147,51,234,0.12)',
    borderWidth: 1, borderColor: 'rgba(192,132,252,0.15)',
    borderRadius: 16, padding: 14, gap: 4,
  },
  infoCardFull: {
    backgroundColor: 'rgba(147,51,234,0.12)',
    borderWidth: 1, borderColor: 'rgba(192,132,252,0.15)',
    borderRadius: 16, padding: 14, marginBottom: 20, gap: 4,
  },
  infoLabel: {
    fontSize: 11, fontWeight: '600',
    color: 'rgba(233,213,255,0.45)',
    textTransform: 'uppercase', letterSpacing: 0.06,
  },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#e9d5ff' },
  logoutBtn: { borderRadius: 16, overflow: 'hidden' },
  logoutGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    paddingVertical: 15, borderRadius: 16,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});