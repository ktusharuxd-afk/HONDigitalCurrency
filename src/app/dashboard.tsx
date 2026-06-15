import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Icon } from './icons'

const SUPABASE_URL = 'https://pctlqnityusjxlicreax.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdGxxbml0eXVzanhsaWNyZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODg2NDMsImV4cCI6MjA5NjY2NDY0M30.nlo0Pzn_KoaidWgDCp9pXbL7ILoQpd9SER1C_3p-9gw'

const dbGet = async (table: string, filter: string) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  })
  return res.json()
}

export default function Dashboard() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [balance, setBalance] = useState('0.00')
  const [recentTx, setRecentTx] = useState<any[]>([])

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1))
      const token = params.get('access_token')
      if (token) {
        localStorage.setItem('hon_token', token)
        window.history.replaceState({}, '', '/dashboard')
        loadUser(token)
      }
    } else {
      const saved = localStorage.getItem('hon_token')
      if (!saved) router.replace('/')
      else loadUser(saved)
    }
  }, [])

  const loadUser = async (token: string) => {
    const decoded = JSON.parse(atob(token.split('.')[1]))
    const userEmail = decoded.email || ''
    setEmail(userEmail)
    const profiles = await dbGet('profiles', `select=id,role&email=eq.${userEmail}`)
    if (Array.isArray(profiles) && profiles.length > 0) {
      setRole(profiles[0].role)
      const uid = profiles[0].id
      const wallets = await dbGet('wallets', `select=balance&user_id=eq.${uid}`)
      if (Array.isArray(wallets) && wallets.length > 0)
        setBalance(Number(wallets[0].balance).toFixed(2))
      const txns = await dbGet('transactions', `select=*&or=(sender_id.eq.${uid},receiver_id.eq.${uid})&order=created_at.desc&limit=5`)
      if (Array.isArray(txns)) {
        const allProfiles = await dbGet('profiles', 'select=id,email')
        const map: any = {}
        if (Array.isArray(allProfiles)) allProfiles.forEach((p: any) => { map[p.id] = p.email })
        setRecentTx(txns.map((tx: any) => ({ ...tx, senderEmail: map[tx.sender_id] || 'System', receiverEmail: map[tx.receiver_id] || '...', isMe: tx.sender_id === uid })))
      }
    }
  }

  const getRoleLabel = () => {
    if (role === 'owner') return 'Owner'
    if (role === 'admin') return 'Admin'
    if (role === 'subadmin') return 'SubAdmin'
    return 'User'
  }

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{email.split('@')[0]}</Text>
          <Text style={s.email}>{email}</Text>
        </View>
        <View style={s.roleBadge}><Text style={s.roleText}>{getRoleLabel()}</Text></View>
      </View>

      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>Total Balance</Text>
        <Text style={s.balanceAmount}>{balance}</Text>
        <Text style={s.balanceCurrency}>HON</Text>
        <View style={s.quickActions}>
          <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/send')}>
            <View style={s.quickIcon}><Icon name="arrow-up-outline" size={26} color="#FFD700" /></View>
            <Text style={s.quickLabel}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/withdraw')}>
            <View style={s.quickIcon}><Text style={s.inrIcon}>₹</Text></View>
            <Text style={s.quickLabel}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/bridge')}>
            <View style={s.quickIcon}><Icon name="swap-horizontal-outline" size={26} color="#FFD700" /></View>
            <Text style={s.quickLabel}>Bridge</Text>
          </TouchableOpacity>
          {role === 'owner' && (
            <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/owner')}>
              <View style={s.quickIcon}><Icon name="add-outline" size={26} color="#FFD700" /></View>
              <Text style={s.quickLabel}>Mint</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {(role === 'owner' || role === 'admin') && (
        <TouchableOpacity style={s.panelBtn} onPress={() => router.push('/admin')}>
          <View style={s.panelIconBox}><Icon name="settings-outline" size={22} color="#FFD700" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.panelTitle}>Admin Panel</Text>
            <Text style={s.panelSub}>Manage users & roles</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#444" />
        </TouchableOpacity>
      )}

      {role === 'subadmin' && (
        <TouchableOpacity style={s.panelBtn} onPress={() => router.push('/subadmin')}>
          <View style={s.panelIconBox}><Icon name="people-outline" size={22} color="#FFD700" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.panelTitle}>SubAdmin Panel</Text>
            <Text style={s.panelSub}>Manage your group</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#444" />
        </TouchableOpacity>
      )}

      {recentTx.length > 0 && (
        <View style={s.txSection}>
          <View style={s.txHeader}>
            <Text style={s.txTitle}>Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/history')}><Text style={s.txViewAll}>View all ›</Text></TouchableOpacity>
          </View>
          {recentTx.map((tx: any) => (
            <View key={tx.id} style={s.txRow}>
              <View style={[s.txIconBox, { backgroundColor: tx.type === 'mint' ? '#1a1a00' : tx.isMe ? '#1a0a0a' : '#0a1a0a' }]}>
                <Icon name={tx.type === 'mint' ? 'add-circle-outline' : tx.isMe ? 'arrow-up-outline' : 'arrow-down-outline'} size={20} color={tx.type === 'mint' ? '#FFD700' : tx.isMe ? '#ff4444' : '#00cc66'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.txLabel}>{tx.type === 'mint' ? 'Minted' : tx.isMe ? 'Sent to ' + tx.receiverEmail.split('@')[0] : 'From ' + tx.senderEmail.split('@')[0]}</Text>
                <Text style={s.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={[s.txAmount, { color: tx.isMe && tx.type !== 'mint' ? '#ff4444' : '#00cc66' }]}>{tx.isMe && tx.type !== 'mint' ? '-' : '+'}{Number(tx.amount).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navItem}><Icon name="wallet" size={22} color="#FFD700" /><Text style={s.navLabelActive}>Home</Text></TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => router.push('/send')}><Icon name="swap-horizontal-outline" size={22} color="#555" /><Text style={s.navLabel}>Send</Text></TouchableOpacity>
        <TouchableOpacity style={s.navCenterBtn} onPress={() => router.push('/send')}><Icon name="arrow-up" size={28} color="#0a0a0a" /></TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => router.push('/history')}><Icon name="time-outline" size={22} color="#555" /><Text style={s.navLabel}>History</Text></TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => router.push('/profile')}><Icon name="person-outline" size={22} color="#555" /><Text style={s.navLabel}>Profile</Text></TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, paddingTop: 52 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  email: { color: '#555', fontSize: 12, marginTop: 2 },
  roleBadge: { backgroundColor: '#1a1500', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FFD700' },
  roleText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' },
  balanceCard: { backgroundColor: '#FFD700', borderRadius: 24, padding: 28, marginBottom: 20, alignItems: 'center' },
  balanceLabel: { color: '#5a4a00', fontSize: 13, fontWeight: '600' },
  balanceAmount: { color: '#0a0a0a', fontSize: 48, fontWeight: 'bold', marginTop: 8 },
  balanceCurrency: { color: '#5a4a00', fontSize: 14, fontWeight: '700', marginTop: 4 },
  quickActions: { flexDirection: 'row', marginTop: 24, gap: 20, justifyContent: 'center', width: '100%' },
  quickBtn: { alignItems: 'center', gap: 8 },
  quickIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: '#0a0a0a', fontSize: 12, fontWeight: '700' },
  inrIcon: { color: '#FFD700', fontSize: 24, fontWeight: 'bold' },
  panelBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1a1a1a' },
  panelIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a1500', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  panelTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  panelSub: { color: '#555', fontSize: 12, marginTop: 2 },
  txSection: { marginTop: 16 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  txTitle: { color: '#666', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  txViewAll: { color: '#FFD700', fontSize: 13 },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 8, gap: 14 },
  txIconBox: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  txLabel: { color: '#fff', fontSize: 14 },
  txDate: { color: '#444', fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#111', borderRadius: 24, padding: 12, marginTop: 24, marginBottom: 20, borderWidth: 1, borderColor: '#1a1a1a' },
  navItem: { alignItems: 'center', gap: 4 },
  navLabel: { color: '#555', fontSize: 10 },
  navLabelActive: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  navCenterBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', marginTop: -28 },
})
