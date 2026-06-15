import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Icon } from './icons'

const SUPABASE_URL = 'https://pctlqnityusjxlicreax.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdGxxbml0eXVzanhsaWNyZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODg2NDMsImV4cCI6MjA5NjY2NDY0M30.nlo0Pzn_KoaidWgDCp9pXbL7ILoQpd9SER1C_3p-9gw'

const dbGet = async (t: string, f: string) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }); return r.json() }
const dbInsert = async (t: string, b: any) => { await fetch(`${SUPABASE_URL}/rest/v1/${t}`, { method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }) }
const dbUpdate = async (t: string, b: any, f: string) => { await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { method: 'PATCH', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }) }

export default function Withdraw() {
  const router = useRouter()
  const [method, setMethod] = useState('')
  const [amount, setAmount] = useState('')
  const [upiId, setUpiId] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState(0)
  const [userId, setUserId] = useState('')
  const [history, setHistory] = useState<any[]>([])

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
    const w = await dbGet('withdrawals', `select=*&user_id=eq.${uid}&order=created_at.desc`)
    if (Array.isArray(w)) setHistory(w)
  }

  const handleWithdraw = async () => {
    if (!amount || !method) { setMessage('❌ Amount aani method select kara!'); return }
    if (Number(amount) <= 0) { setMessage('❌ Amount 0 peksha jast pahije!'); return }
    if (Number(amount) > balance) { setMessage('❌ Balance kami! Available: ' + balance.toFixed(2) + ' HON'); return }
    if (method === 'upi' && !upiId) { setMessage('❌ UPI ID bhara!'); return }
    if (method === 'bank' && (!bankName || !accountNumber || !ifscCode || !accountHolder)) { setMessage('❌ Sagla bank details bhara!'); return }
    setLoading(true); setMessage('')
    try {
      const amt = Number(amount)
      await dbUpdate('wallets', { balance: balance - amt }, `user_id=eq.${userId}`)
      await dbInsert('withdrawals', { user_id: userId, amount: amt, inr_amount: amt, method, upi_id: method === 'upi' ? upiId : null, bank_name: method === 'bank' ? bankName : null, account_number: method === 'bank' ? accountNumber : null, ifsc_code: method === 'bank' ? ifscCode : null, account_holder: method === 'bank' ? accountHolder : null, status: 'pending' })
      await dbInsert('transactions', { sender_id: userId, amount: amt, type: 'bridge', status: 'completed', note: 'INR Withdrawal ₹' + amt + ' via ' + method.toUpperCase() })
      setMessage('✅ Withdrawal request submitted! ₹' + amt)
      setAmount(''); setUpiId(''); setBankName(''); setAccountNumber(''); setIfscCode(''); setAccountHolder(''); setMethod('')
      setBalance(balance - amt); loadData()
    } catch (e) { setMessage('❌ Error!') }
    setLoading(false)
  }

  const getStatusColor = (s: string) => { if (s === 'completed') return '#00cc66'; if (s === 'approved') return '#2196F3'; if (s === 'rejected') return '#ff4444'; return '#FF9800' }

  return (
    <ScrollView style={st.container}>
      <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
        <Icon name="arrow-back" size={24} color="#FFD700" />
      </TouchableOpacity>
      <Text style={st.title}>Withdraw to INR</Text>
      <Text style={st.subtitle}>1 HON = ₹1</Text>

      <View style={st.balanceBox}>
        <Icon name="wallet-outline" size={20} color="#FFD700" />
        <Text style={st.balanceText}>Available: {balance.toFixed(2)} HON (₹{balance.toFixed(2)})</Text>
      </View>

      <View style={st.card}>
        <Text style={st.cardTitle}>Select Method</Text>
        <TouchableOpacity style={[st.methodBtn, method === 'upi' && st.methodActive]} onPress={() => setMethod('upi')}>
          <Text style={st.methodIcon}>₹</Text>
          <View>
            <Text style={[st.methodText, method === 'upi' && st.methodTextActive]}>UPI</Text>
            <Text style={st.methodSub}>PhonePe, GPay, Paytm</Text>
          </View>
          <View style={[st.radio, method === 'upi' && st.radioActive]} />
        </TouchableOpacity>

        <TouchableOpacity style={[st.methodBtn, method === 'bank' && st.methodActive]} onPress={() => setMethod('bank')}>
          <Text style={st.methodIcon}>🏦</Text>
          <View>
            <Text style={[st.methodText, method === 'bank' && st.methodTextActive]}>Bank Account</Text>
            <Text style={st.methodSub}>NEFT / IMPS Transfer</Text>
          </View>
          <View style={[st.radio, method === 'bank' && st.radioActive]} />
        </TouchableOpacity>
      </View>

      {method === 'upi' && (
        <View style={st.card2}>
          <Text style={st.cardTitle}>UPI Details</Text>
          <TextInput style={st.input} placeholder="UPI ID (ex: name@upi)" placeholderTextColor="#555" value={upiId} onChangeText={setUpiId} autoCapitalize="none" />
          <TextInput style={st.input} placeholder="Amount (HON)" placeholderTextColor="#555" value={amount} onChangeText={setAmount} keyboardType="numeric" />
          {amount ? <Text style={st.convertText}>You will receive: ₹{Number(amount || 0).toFixed(2)}</Text> : null}
          <TouchableOpacity style={[st.withdrawBtn, loading && { opacity: 0.5 }]} onPress={handleWithdraw} disabled={loading}>
            <Text style={st.withdrawBtnText}>{loading ? 'Processing...' : 'Withdraw ₹' + Number(amount || 0).toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {method === 'bank' && (
        <View style={st.card2}>
          <Text style={st.cardTitle}>Bank Details</Text>
          <TextInput style={st.input} placeholder="Account Holder Name" placeholderTextColor="#555" value={accountHolder} onChangeText={setAccountHolder} />
          <TextInput style={st.input} placeholder="Bank Name" placeholderTextColor="#555" value={bankName} onChangeText={setBankName} />
          <TextInput style={st.input} placeholder="Account Number" placeholderTextColor="#555" value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" />
          <TextInput style={st.input} placeholder="IFSC Code" placeholderTextColor="#555" value={ifscCode} onChangeText={setIfscCode} autoCapitalize="characters" />
          <TextInput style={st.input} placeholder="Amount (HON)" placeholderTextColor="#555" value={amount} onChangeText={setAmount} keyboardType="numeric" />
          {amount ? <Text style={st.convertText}>You will receive: ₹{Number(amount || 0).toFixed(2)}</Text> : null}
          <TouchableOpacity style={[st.withdrawBtn, loading && { opacity: 0.5 }]} onPress={handleWithdraw} disabled={loading}>
            <Text style={st.withdrawBtnText}>{loading ? 'Processing...' : 'Withdraw ₹' + Number(amount || 0).toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {message ? <Text style={st.message}>{message}</Text> : null}

      {history.length > 0 && (
        <View style={st.historySection}>
          <Text style={st.historyTitle}>Withdrawal History</Text>
          {history.map((w: any) => (
            <View key={w.id} style={st.historyRow}>
              <View style={st.historyIconBox}><Text style={st.historyIconText}>₹</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={st.historyAmount}>₹{Number(w.inr_amount).toFixed(2)}</Text>
                <Text style={st.historyMethod}>{w.method === 'upi' ? 'UPI: ' + w.upi_id : 'Bank: ' + w.bank_name}</Text>
                <Text style={st.historyDate}>{new Date(w.created_at).toLocaleString()}</Text>
              </View>
              <View style={[st.statusBadge, { backgroundColor: getStatusColor(w.status) + '20' }]}>
                <Text style={[st.statusText, { color: getStatusColor(w.status) }]}>{w.status}</Text>
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
  card: { backgroundColor: '#111', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 16 },
  card2: { backgroundColor: '#111', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 16 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  methodBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#222', marginBottom: 10 },
  methodActive: { borderColor: '#FFD700', backgroundColor: '#1a1500' },
  methodIcon: { fontSize: 24 },
  methodText: { color: '#aaa', fontSize: 15, fontWeight: '600' },
  methodTextActive: { color: '#FFD700' },
  methodSub: { color: '#555', fontSize: 11, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#333', marginLeft: 'auto' },
  radioActive: { borderColor: '#FFD700', backgroundColor: '#FFD700' },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, fontSize: 15, borderWidth: 1, borderColor: '#222' },
  convertText: { color: '#00cc66', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  withdrawBtn: { backgroundColor: '#FFD700', padding: 16, borderRadius: 14, alignItems: 'center' },
  withdrawBtnText: { color: '#0a0a0a', fontSize: 16, fontWeight: 'bold' },
  message: { color: '#888', marginTop: 12, textAlign: 'center', fontSize: 13 },
  historySection: { marginTop: 12 },
  historyTitle: { color: '#666', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 8, gap: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  historyIconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0a1a0a', alignItems: 'center', justifyContent: 'center' },
  historyIconText: { color: '#00cc66', fontSize: 20, fontWeight: 'bold' },
  historyAmount: { color: '#fff', fontSize: 15, fontWeight: '600' },
  historyMethod: { color: '#555', fontSize: 11, marginTop: 2 },
  historyDate: { color: '#333', fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
})
