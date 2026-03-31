import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  //初始化
  const init = () => {
    const saved = localStorage.getItem('theme')
    if (saved) {
      isDark.value = saved === 'dark'

    }

  }
  //切换主题
  const toggle = () => {
    isDark.value = !isDark.value
  }
})
