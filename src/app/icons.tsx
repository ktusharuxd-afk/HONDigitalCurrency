import { Text } from 'react-native'

const iconMap: any = {
  'arrow-back': '←',
  'arrow-up-outline': '↑',
  'arrow-up': '↑',
  'arrow-down-outline': '↓',
  'time-outline': '◷',
  'swap-horizontal-outline': '⇄',
  'swap-horizontal': '⇄',
  'add-outline': '+',
  'add-circle-outline': '⊕',
  'settings-outline': '⚙',
  'people-outline': '⊡',
  'person-outline': '○',
  'chevron-forward': '›',
  'wallet': '◈',
  'wallet-outline': '◇',
  'log-out-outline': '⊳',
  'mail-outline': '✉',
  'shield-outline': '⛨',
  'receipt-outline': '☰',
  'search-outline': '⌕',
  'information-circle-outline': 'ⓘ',
  'home': '⌂',
}

export function Icon({ name, size = 20, color = '#fff' }: { name: string, size?: number, color?: string }) {
  return <Text style={{ fontSize: size, color, fontWeight: 'bold', textAlign: 'center', lineHeight: size + 4 }}>{iconMap[name] || '•'}</Text>
}
