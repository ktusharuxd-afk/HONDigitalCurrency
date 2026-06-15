import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Icon } from './icons'

const SUPABASE_URL = 'https://pctlqnityusjxlicreax.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdGxxbml0eXVzanhsaWNyZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODg2NDMsImV4cCI6MjA5NjY2NDY0M30.nlo0Pzn_KoaidWgDCp9pXbL7ILoQpd9SER1C_3p-9gw'

const dbGet = async (t: string, f: string) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }); return r.json() }

export default function History() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [emails, setEmails] = useState<any>({})

  useEffect(() => { loadHistory() }, [])

  const loadHistory = async () => {
    const token = localStorage.getItem('hon_token')
    if (!token) { router.replace('/'); return }
    const decoded = JSON.parse(atob(token.split('.')[1]))
    const profiles = await dbGet('profiles', `select=id&email=eq.${decoded.email}`)
    if (!Array.isArray(profiles) || profiles.length === 0) return
    const uid = profiles[0].id
    setUserId(uid)
    const txns = await dbGet('transactions', `select=*&or=(sender_id.eq.${uid},receiver_id.eq.${uid})&order=created_at.desc`)
    if (Array.isArray(txns)) {
      setTransactions(txns)
      const allProfiles = await dbGet('profiles', 'select=id,email')
      if (Array.isArray(allProfiles)) {
        const map: any = {}
        allProfiles.forEach((p: any) => { map[p.id] = p.email })
        setEmails(map)
      }
    }
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Icon name="arrow-back" size={24} color="#FFD700" />
      </TouchableOpacity>
      <Text style={styles.title}>Transaction History</Text>
      <Text style={styles.subtitle}>All transactions</Text>
      {transactions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="receipt-outline" size={40} color="#333" />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        transactions.map((tx: any) => {
          const isMint = tx.type === 'mint'
          const isBridge = tx.type === 'bridge'
          const isMe = tx.sender_id === userId
          return (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIconBox, { backgroundColor: isMint ? '#1a1a00' : isBridge ? '#0a0a1a' : isMe ? '#1a0a0a' : '#0a1a0a' }]}>
                <Icon
                  name={isMint ? 'add-circle-outline' : isBridge ? 'swap-horizontal-outline' : isMe ? 'arrow-up-outline' : 'arrow-down-outline'}
                  size={20}
                  color={isMint ? '#FFD700' : isBridge ? '#2196F3' : isMe ? '#ff4444' : '#00cc66'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txLabel}>
                  {isMint ? 'Minted' : isBridge ? 'Bridge Withdrawal' : isMe ? 'Sent to ' + (emails[tx.receiver_id] || '...').split('@')[0] : 'From ' + (emails[tx.sender_id] || 'System').split('@')[0]}
                </Text>
                <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleString()}</Text>
              </View>
              <Text style={[styles.txAmount, { color: (isMe && !isMint) || isBridge ? '#ff4444' : '#00cc66' }]}>
                {(isMe && !isMint) || isBridge ? '-' : '+'}{Number(tx.amount).toFixed(2)}
              </Text>
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, paddingTop: 52 },
  backBtn: { marginBottom: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFD700', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#555', fontSize: 14, marginTop: 5, marginBottom: 30 },
  emptyCard: { backgroundColor: '#111', borderRadius: 20, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a', gap: 12 },
  emptyText: { color: '#555', fontSize: 16 },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 8, gap: 14 },
  txIconBox: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  txLabel: { color: '#fff', fontSize: 14 },
  txDate: { color: '#444', fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: 'bold' },
})
