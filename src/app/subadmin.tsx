import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Icon } from './icons'

const SUPABASE_URL = 'https://pctlqnityusjxlicreax.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdGxxbml0eXVzanhsaWNyZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODg2NDMsImV4cCI6MjA5NjY2NDY0M30.nlo0Pzn_KoaidWgDCp9pXbL7ILoQpd9SER1C_3p-9gw'

const dbGet = async (t: string, f: string) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }); return r.json() }

export default function SubAdminPanel() {
  const router = useRouter()
  const [myUsers, setMyUsers] = useState<any[]>([])
  const [wallets, setWallets] = useState<any>({})

  useEffect(() => { loadMyUsers() }, [])

  const loadMyUsers = async () => {
    const token = localStorage.getItem('hon_token')
    if (!token) { router.replace('/'); return }
    const decoded = JSON.parse(atob(token.split('.')[1]))
    const profiles = await dbGet('profiles', `select=id&email=eq.${decoded.email}`)
    if (!Array.isArray(profiles) || profiles.length === 0) return
    const uid = profiles[0].id
    const users = await dbGet('profiles', `select=id,email,role,is_active&subadmin_id=eq.${uid}`)
    if (Array.isArray(users)) {
      setMyUsers(users)
      const w = await dbGet('wallets', 'select=user_id,balance')
      if (Array.isArray(w)) { const m: any = {}; w.forEach((x: any) => { m[x.user_id] = x.balance }); setWallets(m) }
    }
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Icon name="arrow-back" size={24} color="#FFD700" />
      </TouchableOpacity>
      <Text style={styles.title}>SubAdmin Panel</Text>
      <Text style={styles.subtitle}>Your group: {myUsers.length} users</Text>
      {myUsers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="people-outline" size={40} color="#333" />
          <Text style={styles.emptyText}>No users in your group</Text>
          <Text style={styles.emptySubText}>Admin will assign users to you</Text>
        </View>
      ) : (
        myUsers.map((u: any) => (
          <View key={u.id} style={styles.userCard}>
            <View style={styles.userIconBox}><Icon name="person-outline" size={20} color="#FFD700" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userEmail}>{u.email}</Text>
              <Text style={styles.userBalance}>{Number(wallets[u.id] || 0).toFixed(2)} HON</Text>
            </View>
            <Text style={[styles.userStatus, { color: u.is_active ? '#00cc66' : '#ff4444' }]}>{u.is_active ? 'Active' : 'Blocked'}</Text>
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, paddingTop: 52 },
  backBtn: { marginBottom: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFD700', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#555', fontSize: 14, marginTop: 5, marginBottom: 30 },
  emptyCard: { backgroundColor: '#111', borderRadius: 20, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a', gap: 8 },
  emptyText: { color: '#555', fontSize: 16 },
  emptySubText: { color: '#333', fontSize: 12 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 8, gap: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  userIconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1a1500', alignItems: 'center', justifyContent: 'center' },
  userEmail: { color: '#fff', fontSize: 14 },
  userBalance: { color: '#FFD700', fontSize: 12, marginTop: 2 },
  userStatus: { fontSize: 12, fontWeight: 'bold' },
})
