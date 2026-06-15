import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Icon } from './icons'

const SUPABASE_URL = 'https://pctlqnityusjxlicreax.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdGxxbml0eXVzanhsaWNyZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODg2NDMsImV4cCI6MjA5NjY2NDY0M30.nlo0Pzn_KoaidWgDCp9pXbL7ILoQpd9SER1C_3p-9gw'

const dbGet = async (t: string, f: string) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }); return r.json() }

export default function Profile() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [balance, setBalance] = useState('0.00')
  const [totalSent, setTotalSent] = useState('0.00')
  const [totalReceived, setTotalReceived] = useState('0.00')

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    const token = localStorage.getItem('hon_token')
    if (!token) { router.replace('/'); return }
    const decoded = JSON.parse(atob(token.split('.')[1]))
    setEmail(decoded.email || '')
    const profiles = await dbGet('profiles', `select=id,role&email=eq.${decoded.email}`)
    if (!Array.isArray(profiles) || profiles.length === 0) return
    const uid = profiles[0].id; setRole(profiles[0].role)
    const wallets = await dbGet('wallets', `select=balance&user_id=eq.${uid}`)
    if (Array.isArray(wallets) && wallets.length > 0) setBalance(Number(wallets[0].balance).toFixed(2))
    const sent = await dbGet('transactions', `select=amount&sender_id=eq.${uid}&type=eq.transfer`)
    if (Array.isArray(sent)) setTotalSent(sent.reduce((s: number, t: any) => s + Number(t.amount), 0).toFixed(2))
    const received = await dbGet('transactions', `select=amount&receiver_id=eq.${uid}`)
    if (Array.isArray(received)) setTotalReceived(received.reduce((s: number, t: any) => s + Number(t.amount), 0).toFixed(2))
  }

  const handleLogout = () => { localStorage.removeItem('hon_token'); router.replace('/') }
  const getRoleLabel = () => { if (role === 'owner') return 'Owner'; if (role === 'admin') return 'Admin'; if (role === 'subadmin') return 'SubAdmin'; return 'User' }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Icon name="arrow-back" size={24} color="#FFD700" />
      </TouchableOpacity>
      <View style={styles.avatarBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{email.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.roleBadge}><Text style={styles.roleText}>{getRoleLabel()}</Text></View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{balance}</Text>
          <Text style={styles.statLabel}>Balance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#00cc66' }]}>{totalReceived}</Text>
          <Text style={styles.statLabel}>Received</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#ff4444' }]}>{totalSent}</Text>
          <Text style={styles.statLabel}>Sent</Text>
        </View>
      </View>
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Icon name="mail-outline" size={18} color="#555" />
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{email}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Icon name="shield-outline" size={18} color="#555" />
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{getRoleLabel()}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="log-out-outline" size={20} color="#ff4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, paddingTop: 52 },
  backBtn: { marginBottom: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  avatarBox: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { color: '#0a0a0a', fontSize: 36, fontWeight: 'bold' },
  email: { color: '#fff', fontSize: 16, fontWeight: '600' },
  roleBadge: { backgroundColor: '#1a1500', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FFD700', marginTop: 10 },
  roleText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#111', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  statValue: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#555', fontSize: 11, marginTop: 4 },
  infoSection: { backgroundColor: '#111', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  infoLabel: { color: '#555', fontSize: 14, flex: 1 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  infoDivider: { height: 1, backgroundColor: '#1a1a1a' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  logoutText: { color: '#ff4444', fontSize: 16, fontWeight: '600' },
})
