import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Icon } from './icons'

const SUPABASE_URL = 'https://pctlqnityusjxlicreax.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdGxxbml0eXVzanhsaWNyZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODg2NDMsImV4cCI6MjA5NjY2NDY0M30.nlo0Pzn_KoaidWgDCp9pXbL7ILoQpd9SER1C_3p-9gw'

const dbGet = async (t: string, f: string) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }); return r.json() }
const dbUpdate = async (t: string, b: any, f: string) => { await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { method: 'PATCH', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }) }
const dbInsert = async (t: string, b: any) => { await fetch(`${SUPABASE_URL}/rest/v1/${t}`, { method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }) }

export default function SendHON() {
  const router = useRouter()
  const [toEmail, setToEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!toEmail || !amount) { setMessage('❌ Email aani amount bhara!'); return }
    setLoading(true); setMessage('')
    try {
      const token = localStorage.getItem('hon_token')
      if (!token) { router.replace('/'); return }
      const decoded = JSON.parse(atob(token.split('.')[1]))
      const senderEmail = decoded.email
      if (senderEmail === toEmail.trim().toLowerCase()) { setMessage('❌ Swatahla pathavu shakat nahi!'); setLoading(false); return }
      const sp = await dbGet('profiles', `select=id&email=eq.${senderEmail}`)
      if (!Array.isArray(sp) || sp.length === 0) { setMessage('❌ Sender sapadla nahi!'); setLoading(false); return }
      const sid = sp[0].id
      const sw = await dbGet('wallets', `select=balance&user_id=eq.${sid}`)
      if (!Array.isArray(sw) || sw.length === 0) { setMessage('❌ Wallet sapadla nahi!'); setLoading(false); return }
      const sb = Number(sw[0].balance)
      if (sb < Number(amount)) { setMessage('❌ Balance kami! Available: ' + sb.toFixed(2) + ' HON'); setLoading(false); return }
      const re = toEmail.trim().toLowerCase()
      const rp = await dbGet('profiles', `select=id&email=eq.${re}`)
      if (!Array.isArray(rp) || rp.length === 0) { setMessage('❌ Receiver sapadla nahi!'); setLoading(false); return }
      const rid = rp[0].id
      const rw = await dbGet('wallets', `select=balance&user_id=eq.${rid}`)
      if (!Array.isArray(rw) || rw.length === 0) { setMessage('❌ Receiver wallet nahi!'); setLoading(false); return }
      const amt = Number(amount)
      await dbUpdate('wallets', { balance: sb - amt }, `user_id=eq.${sid}`)
      await dbUpdate('wallets', { balance: Number(rw[0].balance) + amt }, `user_id=eq.${rid}`)
      await dbInsert('transactions', { sender_id: sid, receiver_id: rid, amount: amt, type: 'transfer', status: 'completed', note: 'Transfer to ' + re })
      setMessage('✅ ' + amount + ' HON sent to ' + re); setAmount(''); setToEmail('')
    } catch (e) { setMessage('❌ Error!') }
    setLoading(false)
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Icon name="arrow-back" size={24} color="#FFD700" />
      </TouchableOpacity>
      <Text style={styles.title}>Send HON</Text>
      <Text style={styles.subtitle}>Transfer HON to another user</Text>
      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Receiver Email" placeholderTextColor="#666" value={toEmail} onChangeText={setToEmail} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Amount" placeholderTextColor="#666" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <TouchableOpacity style={[styles.sendBtn, loading && { opacity: 0.5 }]} onPress={handleSend} disabled={loading}>
          <Text style={styles.sendBtnText}>{loading ? 'Sending...' : 'Send HON'}</Text>
        </TouchableOpacity>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, paddingTop: 52 },
  backBtn: { marginBottom: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFD700', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#555', fontSize: 14, marginTop: 5, marginBottom: 30 },
  card: { backgroundColor: '#111', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1a1a1a' },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#222' },
  sendBtn: { backgroundColor: '#FFD700', padding: 16, borderRadius: 14, alignItems: 'center' },
  sendBtnText: { color: '#0a0a0a', fontSize: 16, fontWeight: 'bold' },
  message: { color: '#888', marginTop: 12, textAlign: 'center' },
})
