import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Icon } from './icons'

const SUPABASE_URL = 'https://pctlqnityusjxlicreax.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdGxxbml0eXVzanhsaWNyZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODg2NDMsImV4cCI6MjA5NjY2NDY0M30.nlo0Pzn_KoaidWgDCp9pXbL7ILoQpd9SER1C_3p-9gw'
const HON_CONTRACT = '0xC1cA071903EE42D9a6f5F5d541D80fb695dAE88e'

const dbGet = async (t: string, f: string) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }); return r.json() }
const dbInsert = async (t: string, b: any) => { await fetch(`${SUPABASE_URL}/rest/v1/${t}`, { method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }) }
const dbUpdate = async (t: string, b: any, f: string) => { await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { method: 'PATCH', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }) }

export default function Bridge() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState(0)
  const [userId, setUserId] = useState('')
  const [requests, setRequests] = useState<any[]>([])
  const [walletConnected, setWalletConnected] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const token = localStorage.getItem('hon_token')
    if (!token) { router.replace('/'); return }
    const decoded = JSON.parse(atob(token.split('.')[1]))
    const profiles = await dbGet('profiles', `select=id&email=eq.${decoded.email}`)
    if (!Array.isArray(profiles) || profiles.length === 0) return
    const uid = profiles[0].id; setUserId(uid)
    const wallets = await dbGet('wallets', `select=balance&user_id=eq.${uid}`)
    if (Array.isArray(wallets) && wallets.length > 0) setBalance(Number(wallets[0].balance))
    const reqs = await dbGet('bridge_requests', `select=*&user_id=eq.${uid}&order=created_at.desc`)
    if (Array.isArray(reqs)) setRequests(reqs)
  }

  const connectMetaMask = async () => {
    try {
      if (typeof (window as any).ethereum === 'undefined') {
        setMessage('❌ MetaMask install kara! metamask.io var ja')
        return
      }
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0])
        setWalletConnected(true)
        setMessage('✅ Wallet connected!')
      }
    } catch (e) {
      setMessage('❌ MetaMask connect failed!')
    }
  }

  const handleBridge = async () => {
    if (!amount || !walletAddress) { setMessage('❌ Amount aani wallet address bhara!'); return }
    if (Number(amount) <= 0) { setMessage('❌ Amount 0 peksha jast pahije!'); return }
    if (Number(amount) > balance) { setMessage('❌ Balance kami! Available: ' + balance.toFixed(2) + ' HON'); return }
    setLoading(true); setMessage('')
    try {
      const newBal = balance - Number(amount)
      await dbUpdate('wallets', { balance: newBal }, `user_id=eq.${userId}`)
      await dbInsert('bridge_requests', { user_id: userId, amount: Number(amount), hon_wallet_address: walletAddress.trim(), status: 'pending' })
      await dbInsert('transactions', { sender_id: userId, amount: Number(amount), type: 'bridge', status: 'completed', note: 'Bridge to ' + walletAddress.trim().substring(0, 10) + '...' })
      setMessage('✅ Bridge request submitted! ' + amount + ' HON → Polygon')
      setAmount(''); setBalance(newBal); loadData()
    } catch (e) { setMessage('❌ Error!') }
    setLoading(false)
  }

  const getStatusColor = (s: string) => { if (s === 'completed') return '#00cc66'; if (s === 'approved') return '#2196F3'; if (s === 'rejected') return '#ff4444'; return '#FF9800' }

  return (
    <ScrollView style={st.container}>
      <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
        <Icon name="arrow-back" size={24} color="#FFD700" />
      </TouchableOpacity>
      <Text style={st.title}>HON Bridge</Text>
      <Text style={st.subtitle}>Digital HON → Polygon HON Token</Text>

      <View style={st.balanceBox}>
        <Icon name="wallet-outline" size={20} color="#FFD700" />
        <Text style={st.balanceText}>Available: {balance.toFixed(2)} HON</Text>
      </View>

      <View style={st.card}>
        <Text style={st.cardTitle}>Connect Wallet</Text>

        {!walletConnected ? (
          <TouchableOpacity style={st.connectBtn} onPress={connectMetaMask}>
            <Text style={st.connectBtnText}>🦊 Connect MetaMask</Text>
          </TouchableOpacity>
        ) : (
          <View style={st.connectedBox}>
            <Text style={st.connectedLabel}>Connected:</Text>
            <Text style={st.connectedAddr}>{walletAddress.substring(0, 8)}...{walletAddress.substring(36)}</Text>
          </View>
        )}

        <Text style={st.orText}>OR</Text>

        <TextInput
          style={st.input}
          placeholder="Paste Polygon Wallet Address"
          placeholderTextColor="#444"
          value={walletAddress}
          onChangeText={(t) => { setWalletAddress(t); setWalletConnected(false) }}
          autoCapitalize="none"
        />
      </View>

      <View style={st.card}>
        <Text style={st.cardTitle}>Bridge Amount</Text>
        <TextInput style={st.input} placeholder="Amount (HON)" placeholderTextColor="#444" value={amount} onChangeText={setAmount} keyboardType="numeric" />

        <View style={st.infoBox}>
          <Text style={st.infoText}>Token: HON (ERC-20)</Text>
          <Text style={st.infoText}>Network: Polygon</Text>
          <Text style={st.infoText}>Contract: {HON_CONTRACT.substring(0, 10)}...{HON_CONTRACT.substring(36)}</Text>
          <Text style={st.infoText}>Processing: 1-24 hours</Text>
        </View>

        <TouchableOpacity style={[st.bridgeBtn, loading && { opacity: 0.5 }]} onPress={handleBridge} disabled={loading || !walletAddress}>
          <Text style={st.bridgeBtnText}>{loading ? 'Processing...' : 'Bridge ' + (amount || '0') + ' HON → Polygon'}</Text>
        </TouchableOpacity>
      </View>

      {message ? <Text style={st.message}>{message}</Text> : null}

      {requests.length > 0 && (
        <View style={st.historySection}>
          <Text style={st.historyTitle}>Bridge History</Text>
          {requests.map((req: any) => (
            <View key={req.id} style={st.historyRow}>
              <View style={st.historyIconBox}><Icon name="swap-horizontal-outline" size={18} color="#FFD700" /></View>
              <View style={{ flex: 1 }}>
                <Text style={st.historyAmount}>{Number(req.amount).toFixed(2)} HON</Text>
                <Text style={st.historyAddr}>{req.hon_wallet_address.substring(0, 16)}...</Text>
                <Text style={st.historyDate}>{new Date(req.created_at).toLocaleString()}</Text>
              </View>
              <View style={[st.statusBadge, { backgroundColor: getStatusColor(req.status) + '20' }]}>
                <Text style={[st.statusText, { color: getStatusColor(req.status) }]}>{req.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, paddingTop: 52 },
  backBtn: { marginBottom: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFD700', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#555', fontSize: 14, marginTop: 5, marginBottom: 20 },
  balanceBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#1a1a1a' },
  balanceText: { color: '#FFD700', fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: '#111', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 16 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  connectBtn: { backgroundColor: '#FF9800', padding: 16, borderRadius: 14, alignItems: 'center' },
  connectBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  connectedBox: { backgroundColor: '#0a1a0a', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#00cc66' },
  connectedLabel: { color: '#00cc66', fontSize: 12, fontWeight: '600' },
  connectedAddr: { color: '#fff', fontSize: 14, marginTop: 4, fontFamily: 'monospace' },
  orText: { color: '#444', textAlign: 'center', marginVertical: 12, fontSize: 13 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, fontSize: 15, borderWidth: 1, borderColor: '#222' },
  infoBox: { backgroundColor: '#0a0a0a', borderRadius: 12, padding: 14, marginBottom: 16, gap: 6 },
  infoText: { color: '#555', fontSize: 12 },
  bridgeBtn: { backgroundColor: '#FFD700', padding: 16, borderRadius: 14, alignItems: 'center' },
  bridgeBtnText: { color: '#0a0a0a', fontSize: 16, fontWeight: 'bold' },
  message: { color: '#888', marginTop: 12, textAlign: 'center', fontSize: 13 },
  historySection: { marginTop: 12 },
  historyTitle: { color: '#666', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 8, gap: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  historyIconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1a1500', alignItems: 'center', justifyContent: 'center' },
  historyAmount: { color: '#fff', fontSize: 15, fontWeight: '600' },
  historyAddr: { color: '#555', fontSize: 11, marginTop: 2 },
  historyDate: { color: '#333', fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
})
