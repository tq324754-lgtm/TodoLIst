import { ref, watch } from 'vue'

export function useTheme() {
  const dark = ref(localStorage.getItem('theme') === 'dark')

  watch(
    dark,
    (val) => {
      document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light')
      localStorage.setItem('theme', val ? 'dark' : 'light')
    },
    { immediate: true }, // 初始化立即执行，保证刷新不丢主题
  )

  const toggleTheme = () => {
    dark.value = !dark.value
  }

  return { dark, toggleTheme }
}
