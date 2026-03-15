import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, StatusBar, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function IndexScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<'splash' | 'login'>('splash');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  // ── SPLASH ────────────────────────────────────────────────────────────────
  if (screen === 'splash') {
    return (
      <LinearGradient
        colors={['#1a0b2e', '#2d1a44', '#3f275a']}
        locations={[0, 0.5, 1]}
        style={s.container}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Animated background elements */}
        <View style={s.bgCircle1} />
        <View style={s.bgCircle2} />
        <View style={s.bgCircle3} />

        <View style={s.splashContainer}>
          {/* Dark top area with glass effect */}
          <View style={s.splashTop}>
            <BlurView intensity={20} tint="dark" style={s.glassRing}>
              {/* Outer ring */}
              <View style={s.outerRing}>
                {/* Inner ring */}
                <View style={s.innerRing}>
                  <BlurView intensity={40} tint="dark" style={s.innerBlur}>
                    {/* Brain image */}
                    <View style={s.brainWrap}>
                      <Image 
                        source={require('../assets/images/brain.jpg')} 
                        style={s.brainImage}
                        resizeMode="cover"
                      />
                    </View>
                  </BlurView>
                </View>
              </View>
            </BlurView>

            <Text style={s.splashTitle}>NeuroHeal</Text>
            <Text style={s.splashSub}>
              Welcome to NeuroHeal—a user-friendly gateway to your healthier
              lifestyle journey!
            </Text>
          </View>

          {/* Glass bottom sheet */}
          <BlurView intensity={30} tint="dark" style={s.splashSheet}>
            <Pressable
              style={({ pressed }) => [s.getStartedBtn, pressed && s.btnPressed]}
              onPress={() => setScreen('login')}
            >
              <LinearGradient
                colors={['#9f7aea', '#805ad5', '#6b46c1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.gradientBtn}
              >
                <Text style={s.getStartedText}>Get Started</Text>
              </LinearGradient>
            </Pressable>

            <View style={s.sheetFooter}>
              <Text style={s.sheetFooterMuted}>Don't have an account?</Text>
              <Pressable onPress={() => setScreen('login')}>
                <Text style={s.sheetFooterLink}>  Sign Up</Text>
              </Pressable>
            </View>
          </BlurView>
        </View>
      </LinearGradient>
    );
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={['#1a0b2e', '#2d1a44', '#3f275a']}
      locations={[0, 0.5, 1]}
      style={s.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Animated background elements */}
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />
      <View style={s.bgCircle3} />

      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.loginWrapper}>
          {/* Logo with glass effect */}
          <BlurView intensity={20} tint="dark" style={s.loginLogoWrap}>
            <View style={s.loginOuterRing}>
              <View style={s.loginInnerRing}>
                <BlurView intensity={40} tint="dark" style={s.loginInnerBlur}>
                  <Image 
                    source={require('../assets/images/brain.jpg')} 
                    style={s.loginBrainImage}
                    resizeMode="cover"
                  />
                </BlurView>
              </View>
            </View>
            <Text style={s.loginTitle}>NeuroHeal</Text>
          </BlurView>

          {/* Form with glass effect */}
          <BlurView intensity={15} tint="dark" style={s.glassForm}>
            <View style={s.form}>
              <View style={s.fieldBlock}>
                <Text style={s.label}>Email Address</Text>
                <BlurView intensity={10} tint="dark" style={s.inputBlur}>
                  <TextInput
                    style={s.input}
                    placeholder="john@gmail.com"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </BlurView>
              </View>

              <View style={s.fieldBlock}>
                <Text style={s.label}>Password</Text>
                <BlurView intensity={10} tint="dark" style={s.inputBlur}>
                  <TextInput
                    style={s.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </BlurView>
              </View>

              <Pressable style={s.forgotWrap}>
                <Text style={s.forgot}>Forget Password</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [s.loginBtn, pressed && s.btnPressed]}
                onPress={handleLogin}
              >
                <LinearGradient
                  colors={['#ffffff', '#f0f0f0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.googleGradient}
                >
                  <Text style={s.loginBtnText}>Login with Google </Text>
                  <View style={s.gBadge}>
                    <Text style={s.gText}>G</Text>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Divider */}
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <BlurView intensity={30} tint="dark" style={s.dividerBlur}>
                  <Text style={s.dividerLabel}>or</Text>
                </BlurView>
                <View style={s.dividerLine} />
              </View>

              {/* Plain login */}
              <Pressable
                style={({ pressed }) => [s.plainLoginBtn, pressed && s.btnPressed]}
                onPress={handleLogin}
              >
                <LinearGradient
                  colors={['#9f7aea', '#805ad5', '#6b46c1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.plainGradient}
                >
                  <Text style={s.plainLoginText}>Login</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </BlurView>

          <BlurView intensity={10} tint="dark" style={s.needHelpBlur}>
            <Pressable style={s.needHelpWrap}>
              <Text style={s.needHelpText}>Need Help?</Text>
            </Pressable>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Background elements
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(159, 122, 234, 0.2)',
    top: -100,
    right: -100,
    transform: [{ scale: 1.2 }],
  },
  bgCircle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(128, 90, 213, 0.15)',
    bottom: 50,
    left: -80,
  },
  bgCircle3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(107, 70, 193, 0.1)',
    top: '30%',
    left: '20%',
  },

  // ─────────────── SPLASH ───────────────
  splashContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  splashTop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 20,
  },

  // Glass ring effect
  glassRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  outerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerBlur: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brainWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainImage: {
    width: '100%',
    height: '100%',
  },

  splashTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(159, 122, 234, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  splashSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },

  // Glass bottom sheet
  splashSheet: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 34,
    gap: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  getStartedBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingVertical: 17,
    alignItems: 'center',
  },
  getStartedText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetFooterMuted: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  sheetFooterLink: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // ─────────────── LOGIN ───────────────
  loginWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 20,
  },

  loginLogoWrap: {
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    padding: 20,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  loginOuterRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginInnerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loginInnerBlur: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loginBrainImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  loginTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(159, 122, 234, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  glassForm: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },

  form: {
    width: '100%',
    gap: 12,
  },
  fieldBlock: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginLeft: 4,
  },
  inputBlur: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
    backgroundColor: 'transparent',
  },

  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgot: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },

  loginBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  googleGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loginBtnText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '700',
  },
  gBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4285F4',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerBlur: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  dividerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },

  plainLoginBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  plainGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  plainLoginText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  needHelpBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  needHelpWrap: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  needHelpText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },

  // shared
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});