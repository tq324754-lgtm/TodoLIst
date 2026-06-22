<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'

useThemeStore()
</script>

<template>
  <router-view />
</template>

<style scoped></style>
