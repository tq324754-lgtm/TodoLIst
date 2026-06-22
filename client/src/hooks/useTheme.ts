import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'

export function useTheme() {
  const themeStore = useThemeStore()
  const { isDark } = storeToRefs(themeStore)

  return {
    dark: isDark,
    toggleTheme: themeStore.toggle,
  }
}
