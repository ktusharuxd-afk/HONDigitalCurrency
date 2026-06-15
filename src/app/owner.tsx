import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Icon } from './icons'

const SUPABASE_URL = 'https://pctlqnityusjxlicreax.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdGxxbml0eXVzanhsaWNyZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODg2NDMsImV4cCI6MjA5NjY2NDY0M30.nlo0Pzn_KoaidWgDCp9pXbL7ILoQpd9SER1C_3p-9gw'

const db = async (table: string, method = 'GET', body?: any, filter?: string) => {
  const url = `${SUPABASE_URL}/rest/v1/${table}${filter ? '?' + filter : ''}`
  const res = await fetch(url, {
    method,
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export default function OwnerPanel() {
  const router = useRouter()
  const [mintAmount, setMintAmount] = useState('')
  const [mintTo, setMintTo] = useState('')
  const [message, setMessage] = useState('')
  const [totalSupply, setTotalSupply] = useState('0.00')

  useEffect(() => { fetchTotalSupply() }, [])

  const fetchTotalSupply = async () => {
    const data = await db('wallets', 'GET', undefined, 'select=balance')
    if (Array.isArray(data)) {
      const total = data.reduce((sum: number, w: any) => sum + Number(w.balance), 0)
      setTotalSupply(total.toFixed(2))
    }
  }

  const handleMint = async () => {
    if (!mintAmount || !mintTo) { setMessage('❌ Amount aani email bhara!'); return }
    const email = mintTo.trim().toLowerCase()
    const profiles = await db('profiles', 'GET', undefined, `select=id&email=eq.${email}`)
    if (!Array.isArray(profiles) || profiles.length === 0) { setMessage('❌ User sapadla nahi!'); return }
    const userId = profiles[0].id
    const wallets = await db('wallets', 'GET', undefined, `select=id,balance&user_id=eq.${userId}`)
    if (!Array.isArray(wallets) || wallets.length === 0) { setMessage('❌ Wallet sapadla nahi!'); return }
    const newBalance = Number(wallets[0].balance) + Number(mintAmount)
    await db('wallets', 'PATCH', { balance: newBalance }, `user_id=eq.${userId}`)
    await db('transactions', 'POST', { receiver_id: userId, amount: Number(mintAmount), type: 'mint', status: 'completed', note: 'Minted by Owner' })
    setMessage('✅ ' + mintAmount + ' HON minted to ' + email)
    setMintAmount(''); setMintTo(''); fetchTotalSupply()
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Icon name="arrow-back" size={24} color="#FFD700" />
      </TouchableOpacity>
      <Text style={styles.title}>Owner Panel</Text>
      <Text style={styles.subtitle}>HON Digital Currency Control</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Supply</Text>
        <Text style={styles.cardValue}>{totalSupply} HON</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mint HON</Text>
        <TextInput style={styles.input} placeholder="User Email" placeholderTextColor="#666" value={mintTo} onChangeText={setMintTo} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Amount" placeholderTextColor="#666" value={mintAmount} onChangeText={setMintAmount} keyboardType="numeric" />
        <TouchableOpacity style={styles.mintBtn} onPress={handleMint}>
          <Text style={styles.mintBtnText}>Mint HON</Text>
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
  card: { backgroundColor: '#111', borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  cardTitle: { color: '#888', fontSize: 14, marginBottom: 8 },
  cardValue: { color: '#FFD700', fontSize: 32, fontWeight: 'bold' },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#222' },
  mintBtn: { backgroundColor: '#FFD700', padding: 16, borderRadius: 14, alignItems: 'center' },
  mintBtnText: { color: '#0a0a0a', fontSize: 16, fontWeight: 'bold' },
  message: { color: '#888', marginTop: 12, textAlign: 'center' },
})
