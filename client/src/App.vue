<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
// About.vue
import { useTheme } from '@/hooks/useTheme'

const { dark, toggleTheme } = useTheme()
// 只要引入，就自动生效
useThemeStore()
</script>

<template>
  <router-view />
</template>

<style scoped></style>
