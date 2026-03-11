import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavigationBarProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  userButtonPosition?: 'left' | 'right';
}

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width, 448);

export function NavigationBar({
  title,
  subtitle,
  showBackButton = true,
  onBackPress,
  userButtonPosition = 'right',
}: NavigationBarProps) {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useTheme();
  const { userData, clearUserData } = useUser();
  const insets = useSafeAreaInsets();
  const [showUserProfile, setShowUserProfile] = useState(false);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleLogout = () => {
    clearUserData();
    setShowUserProfile(false);
  };

  return (
    <>
      <View style={[styles.header, darkMode && styles.headerDark, { paddingTop: insets.top }]}>
        <View style={[styles.headerContent, { maxWidth }]}>
          <View style={styles.headerTop}>
            {userButtonPosition === 'left' ? (
              // Left side: user button when positioned left
              <View style={styles.headerActionsLeft}>
                <Pressable
                  onPress={() => setShowUserProfile(true)}
                  style={({ pressed }) => [
                    styles.userButton,
                    darkMode && styles.userButtonDark,
                    pressed && styles.userButtonPressed,
                  ]}
                >
                  <Ionicons name="person-circle" size={20} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
                  {userData?.name && (
                    <Text style={[styles.userButtonText, darkMode && styles.textDark]} numberOfLines={1}>
                      {userData.name.split(' ')[0]}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              // Left side: back button or placeholder
              <>
                {showBackButton ? (
                  <Pressable
                    onPress={handleBackPress}
                    style={({ pressed }) => [
                      styles.backButton,
                      darkMode && styles.backButtonDark,
                      pressed && styles.backButtonPressed,
                    ]}
                  >
                    <Ionicons name="arrow-back" size={20} color={darkMode ? '#e2e8f0' : '#1e293b'} />
                    <Text style={[styles.backText, darkMode && styles.textDark]}>Back</Text>
                  </Pressable>
                ) : (
                  <View style={styles.placeholder} />
                )}
              </>
            )}

            <View style={styles.headerActions}>
              {userButtonPosition === 'right' && (
                <Pressable
                  onPress={() => setShowUserProfile(true)}
                  style={({ pressed }) => [
                    styles.userButton,
                    darkMode && styles.userButtonDark,
                    pressed && styles.userButtonPressed,
                  ]}
                >
                  <Ionicons name="person-circle" size={20} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
                  {userData?.name && (
                    <Text style={[styles.userButtonText, darkMode && styles.textDark]} numberOfLines={1}>
                      {userData.name.split(' ')[0]}
                    </Text>
                  )}
                </Pressable>
              )}

              <Pressable
                onPress={toggleDarkMode}
                style={({ pressed }) => [
                  styles.darkModeButton,
                  darkMode && styles.darkModeButtonDark,
                  pressed && styles.darkModeButtonPressed,
                ]}
              >
                <Ionicons
                  name={darkMode ? 'sunny' : 'moon'}
                  size={20}
                  color={darkMode ? '#fbbf24' : '#475569'}
                />
                <Text style={[styles.darkModeText, darkMode && styles.textDark]}>
                  {darkMode ? 'Light' : 'Dark'}
                </Text>
              </Pressable>
            </View>
          </View>

          {title && (
            <>
              <Text style={[styles.headerTitle, darkMode && styles.textDark]}>{title}</Text>
              {subtitle && (
                <Text style={[styles.headerSubtitle, darkMode && styles.headerSubtitleDark]}>{subtitle}</Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* User Profile Modal */}
      <Modal
        visible={showUserProfile}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUserProfile(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: darkMode ? 'rgba(26, 38, 34, 0.8)' : 'rgba(0, 0, 0, 0.3)' }]}
          onPress={() => setShowUserProfile(false)}
        >
          <View style={[styles.userProfileCard, darkMode && styles.userProfileCardDark]}>
            <View style={styles.profileHeader}>
              <Ionicons name="person-circle" size={60} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
              <Pressable
                onPress={() => setShowUserProfile(false)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              >
                <Ionicons name="close" size={24} color={darkMode ? '#d4e8e0' : '#2d4a42'} />
              </Pressable>
            </View>

            <View style={styles.profileContent}>
              <Text style={[styles.profileName, darkMode && styles.profileNameDark]}>
                {userData?.name || 'User'}
              </Text>

              <View style={[styles.profileInfoSection, darkMode && styles.profileInfoSectionDark]}>
                <Text style={[styles.profileLabel, darkMode && styles.profileLabelDark]}>Gender</Text>
                <Text style={[styles.profileValue, darkMode && styles.profileValueDark]}>
                  {userData?.gender || 'Not set'}
                </Text>
              </View>

              <View style={[styles.profileInfoSection, darkMode && styles.profileInfoSectionDark]}>
                <Text style={[styles.profileLabel, darkMode && styles.profileLabelDark]}>Age Bracket</Text>
                <Text style={[styles.profileValue, darkMode && styles.profileValueDark]}>
                  {userData?.ageBracket || 'Not set'}
                </Text>
              </View>

              <View style={[styles.profileInfoSection, darkMode && styles.profileInfoSectionDark]}>
                <Text style={[styles.profileLabel, darkMode && styles.profileLabelDark]}>Integrations</Text>
                <Text style={[styles.profileValue, darkMode && styles.profileValueDark]}>
                  {userData?.integrations && userData.integrations.length > 0
                    ? userData.integrations.join(', ')
                    : 'None'}
                </Text>
              </View>

              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.logoutButtonPressed,
                ]}
              >
                <Ionicons name="log-out" size={20} color="#fff" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#f5f8f7',
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8e0',
  },
  headerDark: {
    backgroundColor: '#1a2622',
    borderBottomColor: '#5a8f7f',
  },
  headerContent: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholder: {
    width: 70,
    height: 36,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#d4e8e0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#a8d5c4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButtonDark: {
    backgroundColor: '#5a8f7f',
    borderColor: '#7a9f94',
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2d4a42',
  },
  darkModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#d4e8e0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#a8d5c4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  darkModeButtonDark: {
    backgroundColor: '#5a8f7f',
    borderColor: '#7a9f94',
  },
  darkModeButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  darkModeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2d4a42',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d4a42',
    marginBottom: 2,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7a9f94',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  headerSubtitleDark: {
    color: '#c4dbd2',
  },
  textDark: {
    color: '#d4e8e0',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#d4e8e0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#a8d5c4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userButtonDark: {
    backgroundColor: '#5a8f7f',
    borderColor: '#7a9f94',
  },
  userButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  userButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2d4a42',
    maxWidth: 80,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  userProfileCard: {
    backgroundColor: '#f5f8f7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 400,
  },
  userProfileCardDark: {
    backgroundColor: '#1a2622',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
    borderRadius: 20,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  profileContent: {
    gap: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d4a42',
    textAlign: 'center',
    marginBottom: 8,
  },
  profileNameDark: {
    color: '#d4e8e0',
  },
  profileInfoSection: {
    backgroundColor: '#d4e8e0',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#a8d5c4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  profileInfoSectionDark: {
    backgroundColor: '#2d4a42',
    borderColor: '#5a8f7f',
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7a9f94',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  profileLabelDark: {
    color: '#c4dbd2',
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d4a42',
  },
  profileValueDark: {
    color: '#d4e8e0',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 8,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  logoutButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
