import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 1. 初始化时直接读取本地，不再靠后面赋值！
  const isDark = ref(localStorage.getItem('theme') === 'dark')

  // 应用主题到 html 标签
  const applyTheme = () => {
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  }

  // 初始化主题（一上来就执行！）
  applyTheme()

  // 切换
  const toggle = () => {
    isDark.value = !isDark.value
  }

  // 监听变化 → 保存 + 应用
  watch(
    isDark,
    (val) => {
      applyTheme()
      localStorage.setItem('theme', val ? 'dark' : 'light')
    },
    {
      // 关键：初始化就自动执行一次！！！
      immediate: true,
    },
  )

  return {
    isDark,
    toggle,
    applyTheme,
  }
})
