import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Icon } from './icons'

const SUPABASE_URL = 'https://pctlqnityusjxlicreax.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdGxxbml0eXVzanhsaWNyZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODg2NDMsImV4cCI6MjA5NjY2NDY0M30.nlo0Pzn_KoaidWgDCp9pXbL7ILoQpd9SER1C_3p-9gw'
const HON_CONTRACT = '0x75Ba5C2D2166174af340B8466867A014b2D316AC'

const dbGet = async (t: string, f: string) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }); return r.json() }
const dbRpc = async (sql: string) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, { method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: sql }) }); const t = await r.text(); return t ? JSON.parse(t) : null }
const dbUpdate = async (t: string, b: any, f: string) => { await fetch(`${SUPABASE_URL}/rest/v1/${t}?${f}`, { method: 'PATCH', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }) }

const ERC20_ABI = [{"inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]

export default function AdminPanel() {
  const router = useRouter()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState<any[]>([])
  const [wallets, setWallets] = useState<any>({})
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [bridgeReqs, setBridgeReqs] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { loadUsers(); loadWithdrawals(); loadBridge() }, [])

  const loadUsers = async () => {
    const p = await dbGet('profiles', 'select=id,email,role,is_active,subadmin_id&order=created_at.desc')
    if (Array.isArray(p)) {
      setUsers(p)
      const w = await dbGet('wallets', 'select=user_id,balance')
      if (Array.isArray(w)) { const m: any = {}; w.forEach((x: any) => { m[x.user_id] = x.balance }); setWallets(m) }
    }
  }
  const loadWithdrawals = async () => { const w = await dbGet('withdrawals', 'select=*&order=created_at.desc'); if (Array.isArray(w)) setWithdrawals(w) }
  const loadBridge = async () => { const b = await dbGet('bridge_requests', 'select=*&order=created_at.desc'); if (Array.isArray(b)) setBridgeReqs(b) }

  const changeRole = async (id: string, role: string, email: string) => { await dbRpc(`UPDATE profiles SET role = '${role}' WHERE id = '${id}'`); setMessage('✅ ' + email + ' → ' + role); loadUsers() }
  const toggleActive = async (id: string, cur: boolean, email: string) => { await dbRpc(`UPDATE profiles SET is_active = ${!cur} WHERE id = '${id}'`); setMessage('✅ ' + email + (cur ? ' blocked' : ' unblocked')); loadUsers() }
  const assignSub = async (id: string, sid: string, email: string) => { await dbRpc(`UPDATE profiles SET subadmin_id = '${sid}' WHERE id = '${id}'`); setMessage('✅ Assigned'); loadUsers() }
  const removeSub = async (id: string, email: string) => { await dbRpc(`UPDATE profiles SET subadmin_id = NULL WHERE id = '${id}'`); setMessage('✅ Removed'); loadUsers() }

  const copyText = (text: string, label: string) => { navigator.clipboard.writeText(text); setMessage('✅ ' + label + ' copied!') }

  const sendHONToken = async (toAddress: string, amount: number, requestId: string) => {
    try {
      if (typeof (window as any).ethereum === 'undefined') { setMessage('❌ MetaMask install kara!'); return }
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
      const amountWei = '0x' + (BigInt(amount) * BigInt(10 ** 18)).toString(16)
      const transferData = '0xa9059cbb' +
        toAddress.replace('0x', '').padStart(64, '0') +
        amountWei.replace('0x', '').padStart(64, '0')
      const txHash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: HON_CONTRACT,
          data: transferData,
          gas: '0x186A0',
        }],
      })
      await dbUpdate('bridge_requests', { status: 'completed' }, `id=eq.${requestId}`)
      setMessage('✅ ' + amount + ' HON tokens sent! Tx: ' + txHash.substring(0, 12) + '...')
      loadBridge()
    } catch (e: any) {
      setMessage('❌ Transfer failed: ' + (e.message || 'Error'))
    }
  }

  const rejectBridge = async (id: string, uid: string, amt: number) => {
    await dbUpdate('bridge_requests', { status: 'rejected' }, `id=eq.${id}`)
    const w = await dbGet('wallets', `select=balance&user_id=eq.${uid}`)
    if (Array.isArray(w) && w.length > 0) await dbUpdate('wallets', { balance: Number(w[0].balance) + amt }, `user_id=eq.${uid}`)
    setMessage('✅ Rejected - balance refunded'); loadBridge(); loadUsers()
  }

  const approveWithdrawal = async (id: string, amt: number) => { await dbUpdate('withdrawals', { status: 'completed' }, `id=eq.${id}`); setMessage('✅ ₹' + amt + ' completed'); loadWithdrawals() }
  const rejectWithdrawal = async (id: string, uid: string, amt: number) => {
    await dbUpdate('withdrawals', { status: 'rejected' }, `id=eq.${id}`)
    const w = await dbGet('wallets', `select=balance&user_id=eq.${uid}`)
    if (Array.isArray(w) && w.length > 0) await dbUpdate('wallets', { balance: Number(w[0].balance) + amt }, `user_id=eq.${uid}`)
    setMessage('✅ Rejected - refunded'); loadWithdrawals(); loadUsers()
  }

  const filtered = users.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()))
  const subadmins = users.filter(u => u.role === 'subadmin')
  const pendingW = withdrawals.filter(w => w.status === 'pending')
  const pendingB = bridgeReqs.filter(b => b.status === 'pending')
  const getBadge = (r: string) => { if (r === 'owner') return { bg: '#FFD700', text: '#000' }; if (r === 'admin') return { bg: '#2196F3', text: '#fff' }; if (r === 'subadmin') return { bg: '#FF9800', text: '#000' }; return { bg: '#222', text: '#888' } }
  const getUserEmail = (uid: string) => { const u = users.find(x => x.id === uid); return u ? u.email : '...' }
  const getSubEmail = (sid: string) => { const s = users.find(u => u.id === sid); return s ? s.email.split('@')[0] : null }
  const getStatusColor = (s: string) => { if (s === 'completed') return '#00cc66'; if (s === 'rejected') return '#ff4444'; return '#FF9800' }

  return (
    <ScrollView style={st.container}>
      <TouchableOpacity onPress={() => router.back()} style={st.backBtn}><Icon name="arrow-back" size={24} color="#FFD700" /></TouchableOpacity>
      <Text style={st.title}>Admin Panel</Text>

      <View style={st.tabRow}>
        <TouchableOpacity style={[st.tabBtn, tab === 'users' && st.tabActive]} onPress={() => setTab('users')}>
          <Text style={[st.tabText, tab === 'users' && st.tabTextActive]}>Users ({users.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.tabBtn, tab === 'bridge' && st.tabActive]} onPress={() => setTab('bridge')}>
          <Text style={[st.tabText, tab === 'bridge' && st.tabTextActive]}>Bridge {pendingB.length > 0 ? '(' + pendingB.length + ')' : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.tabBtn, tab === 'withdrawals' && st.tabActive]} onPress={() => setTab('withdrawals')}>
          <Text style={[st.tabText, tab === 'withdrawals' && st.tabTextActive]}>INR {pendingW.length > 0 ? '(' + pendingW.length + ')' : ''}</Text>
        </TouchableOpacity>
      </View>

      {message ? <Text style={st.message}>{message}</Text> : null}

      {tab === 'users' && (
        <>
          <View style={st.searchBox}><Icon name="search-outline" size={18} color="#555" /><TextInput style={st.searchInput} placeholder="Search email..." placeholderTextColor="#444" value={search} onChangeText={setSearch} autoCapitalize="none" /></View>
          {filtered.map((u: any) => {
            const badge = getBadge(u.role)
            const assigned = u.subadmin_id ? getSubEmail(u.subadmin_id) : null
            return (
              <View key={u.id} style={st.userCard}>
                <View style={st.userHeader}>
                  <View style={st.userIconBox}><Icon name="person-outline" size={18} color="#FFD700" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.userEmail}>{u.email}</Text>
                    <Text style={st.userBalance}>{Number(wallets[u.id] || 0).toFixed(2)} HON</Text>
                    {assigned && <Text style={st.assignedText}>Group: {assigned}</Text>}
                    {!u.is_active && <Text style={st.blockedText}>Blocked</Text>}
                  </View>
                  <View style={[st.roleBadge, { backgroundColor: badge.bg }]}><Text style={[st.roleText, { color: badge.text }]}>{u.role}</Text></View>
                </View>
                {u.role !== 'owner' && (
                  <View style={st.actions}>
                    {u.role !== 'admin' && <TouchableOpacity style={st.actionBtn} onPress={() => changeRole(u.id, 'admin', u.email)}><Text style={st.actionText}>Admin</Text></TouchableOpacity>}
                    {u.role !== 'subadmin' && <TouchableOpacity style={st.actionBtn} onPress={() => changeRole(u.id, 'subadmin', u.email)}><Text style={st.actionText}>SubAdmin</Text></TouchableOpacity>}
                    {u.role !== 'user' && <TouchableOpacity style={st.actionBtn} onPress={() => changeRole(u.id, 'user', u.email)}><Text style={st.actionText}>User</Text></TouchableOpacity>}
                    <TouchableOpacity style={[st.actionBtn, { borderColor: u.is_active ? '#ff4444' : '#00cc66' }]} onPress={() => toggleActive(u.id, u.is_active, u.email)}>
                      <Text style={{ color: u.is_active ? '#ff4444' : '#00cc66', fontSize: 12, fontWeight: 'bold' }}>{u.is_active ? 'Block' : 'Unblock'}</Text>
                    </TouchableOpacity>
                    {u.role === 'user' && subadmins.map((sa: any) => (
                      <TouchableOpacity key={sa.id} style={[st.actionBtn, { borderColor: '#FF9800' }]} onPress={() => assignSub(u.id, sa.id, u.email)}>
                        <Text style={{ color: '#FF9800', fontSize: 12, fontWeight: 'bold' }}>→ {sa.email.split('@')[0]}</Text>
                      </TouchableOpacity>
                    ))}
                    {u.subadmin_id && <TouchableOpacity style={[st.actionBtn, { borderColor: '#ff4444' }]} onPress={() => removeSub(u.id, u.email)}><Text style={{ color: '#ff4444', fontSize: 12, fontWeight: 'bold' }}>Remove</Text></TouchableOpacity>}
                  </View>
                )}
              </View>
            )
          })}
        </>
      )}

      {tab === 'bridge' && (
        <>
          {bridgeReqs.length === 0 ? (
            <View style={st.emptyCard}><Text style={st.emptyText}>No bridge requests</Text></View>
          ) : (
            bridgeReqs.map((b: any) => (
              <View key={b.id} style={st.wCard}>
                <View style={st.wHeader}>
                  <View style={[st.wIconBox, { backgroundColor: '#1a1500' }]}><Text style={{ color: '#FFD700', fontSize: 18, fontWeight: 'bold' }}>H</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.wEmail}>{getUserEmail(b.user_id)}</Text>
                    <Text style={[st.wAmount, { color: '#FFD700' }]}>{Number(b.amount).toFixed(2)} HON</Text>
                    <TouchableOpacity onPress={() => copyText(b.hon_wallet_address, 'Address')}>
                      <Text style={st.wMethod}>To: {b.hon_wallet_address.substring(0, 20)}... (tap to copy)</Text>
                    </TouchableOpacity>
                    <Text style={st.wDate}>{new Date(b.created_at).toLocaleString()}</Text>
                  </View>
                  <View style={[st.statusBadge, { backgroundColor: getStatusColor(b.status) + '20' }]}>
                    <Text style={[st.statusText, { color: getStatusColor(b.status) }]}>{b.status}</Text>
                  </View>
                </View>
                {b.status === 'pending' && (
                  <View style={st.wActions}>
                    <TouchableOpacity style={st.sendTokenBtn} onPress={() => sendHONToken(b.hon_wallet_address, Number(b.amount), b.id)}>
                      <Text style={st.sendTokenBtnText}>🦊 Send HON Token</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={st.rejectBtn} onPress={() => rejectBridge(b.id, b.user_id, Number(b.amount))}>
                      <Text style={st.rejectBtnText}>✗</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </>
      )}

      {tab === 'withdrawals' && (
        <>
          {withdrawals.length === 0 ? (
            <View style={st.emptyCard}><Text style={st.emptyText}>No withdrawal requests</Text></View>
          ) : (
            withdrawals.map((w: any) => (
              <View key={w.id} style={st.wCard}>
                <View style={st.wHeader}>
                  <View style={st.wIconBox}><Text style={st.wIconText}>₹</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.wEmail}>{getUserEmail(w.user_id)}</Text>
                    <Text style={st.wAmount}>₹{Number(w.inr_amount).toFixed(2)}</Text>
                    <Text style={st.wMethod}>{w.method === 'upi' ? 'UPI: ' + w.upi_id : 'Bank: ' + w.bank_name}</Text>
                    {w.method === 'bank' && <><Text style={st.wDetail}>A/C: {w.account_number}</Text><Text style={st.wDetail}>IFSC: {w.ifsc_code}</Text><Text style={st.wDetail}>Name: {w.account_holder}</Text></>}
                    <Text style={st.wDate}>{new Date(w.created_at).toLocaleString()}</Text>
                  </View>
                  <View style={[st.statusBadge, { backgroundColor: getStatusColor(w.status) + '20' }]}>
                    <Text style={[st.statusText, { color: getStatusColor(w.status) }]}>{w.status}</Text>
                  </View>
                </View>
                {w.status === 'pending' && (
                  <View style={st.wActions}>
                    {w.method === 'upi' && (
                      <View style={st.upiBox}>
                        <Text style={st.upiTitle}>Pay to UPI:</Text>
                        <TouchableOpacity style={st.copyRow} onPress={() => copyText(w.upi_id, 'UPI ID')}><Text style={st.copyValue}>{w.upi_id}</Text><Text style={st.copyBtn}>Copy</Text></TouchableOpacity>
                        <TouchableOpacity style={st.copyRow} onPress={() => copyText(Number(w.inr_amount).toFixed(2), 'Amount')}><Text style={st.copyValue}>₹{Number(w.inr_amount).toFixed(2)}</Text><Text style={st.copyBtn}>Copy</Text></TouchableOpacity>
                      </View>
                    )}
                    <TouchableOpacity style={st.completeBtn} onPress={() => approveWithdrawal(w.id, Number(w.inr_amount))}><Text style={st.completeBtnText}>✓ Paid</Text></TouchableOpacity>
                    <TouchableOpacity style={st.rejectBtn} onPress={() => rejectWithdrawal(w.id, w.user_id, Number(w.amount))}><Text style={st.rejectBtnText}>✗</Text></TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  )
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, paddingTop: 52 },
  backBtn: { marginBottom: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFD700', fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: '#111', alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  tabActive: { backgroundColor: '#1a1500', borderColor: '#FFD700' },
  tabText: { color: '#666', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#FFD700' },
  message: { color: '#00cc66', textAlign: 'center', marginBottom: 12, fontSize: 13 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, paddingHorizontal: 14, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a', gap: 10 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 14, fontSize: 15 },
  userCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1a1a1a' },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1500', alignItems: 'center', justifyContent: 'center' },
  userEmail: { color: '#fff', fontSize: 14 },
  userBalance: { color: '#FFD700', fontSize: 12, marginTop: 2 },
  assignedText: { color: '#FF9800', fontSize: 11, marginTop: 2 },
  blockedText: { color: '#ff4444', fontSize: 11, marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 11, fontWeight: 'bold' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  actionBtn: { borderWidth: 1, borderColor: '#FFD700', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  actionText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
  emptyCard: { backgroundColor: '#111', borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  emptyText: { color: '#555', fontSize: 14 },
  wCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  wHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  wIconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0a1a0a', alignItems: 'center', justifyContent: 'center' },
  wIconText: { color: '#00cc66', fontSize: 20, fontWeight: 'bold' },
  wEmail: { color: '#fff', fontSize: 14, fontWeight: '600' },
  wAmount: { color: '#00cc66', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  wMethod: { color: '#888', fontSize: 12, marginTop: 4 },
  wDetail: { color: '#666', fontSize: 12, marginTop: 2 },
  wDate: { color: '#444', fontSize: 11, marginTop: 4 },
  wActions: { flexDirection: 'row', gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  sendTokenBtn: { flex: 3, backgroundColor: '#FF9800', padding: 14, borderRadius: 12, alignItems: 'center' },
  sendTokenBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  completeBtn: { flex: 1, backgroundColor: '#0a1a0a', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#00cc66' },
  completeBtnText: { color: '#00cc66', fontSize: 13, fontWeight: 'bold' },
  rejectBtn: { width: 48, backgroundColor: '#1a0a0a', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444' },
  rejectBtnText: { color: '#ff4444', fontSize: 16, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  upiBox: { flex: 3, backgroundColor: '#1a1500', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FFD700' },
  upiTitle: { color: '#FFD700', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  copyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0a0a', borderRadius: 8, padding: 10, marginBottom: 6 },
  copyValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  copyBtn: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
})
