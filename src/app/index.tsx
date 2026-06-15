import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function LoginScreen() {
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('hon_token')
    if (saved) router.replace('/dashboard')
  }, [])

  const handleGoogleLogin = () => {
    const currentUrl = window.location.origin
    window.location.href =
      'https://pctlqnityusjxlicreax.supabase.co/auth/v1/authorize?provider=google&redirect_to=' + currentUrl + '/dashboard'
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>H</Text>
        </View>
        <Text style={styles.logoText}>HON</Text>
        <Text style={styles.logoSub}>DIGITAL CURRENCY</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome Back</Text>
        <Text style={styles.cardSub}>Sign in to access your wallet</Text>

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleBtnText}>Sign in with Google</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>By signing in, you agree to our Terms of Service</Text>
      </View>

      <Text style={styles.footer}>Powered by HON Network • v1.0</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoBox: { alignItems: 'center', marginBottom: 48 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' },
  logoLetter: { color: '#0a0a0a', fontSize: 40, fontWeight: 'bold' },
  logoText: { color: '#FFD700', fontSize: 42, fontWeight: 'bold', letterSpacing: 8, marginTop: 16 },
  logoSub: { color: '#5a4a1a', fontSize: 11, letterSpacing: 4, marginTop: 4 },
  card: { backgroundColor: '#111', borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#1a1a1a' },
  cardTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  cardSub: { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  googleBtn: { backgroundColor: '#FFD700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, gap: 12 },
  googleIcon: { color: '#0a0a0a', fontSize: 20, fontWeight: 'bold', backgroundColor: '#fff', width: 28, height: 28, borderRadius: 14, textAlign: 'center', lineHeight: 28 },
  googleBtnText: { color: '#0a0a0a', fontSize: 16, fontWeight: '700' },
  terms: { color: '#333', fontSize: 11, textAlign: 'center', marginTop: 20 },
  footer: { color: '#222', fontSize: 11, marginTop: 48 },
})
