// src/composables/useCan.ts
import { computed } from 'vue'
import { useRightsStore } from '@/stores/rights'

export function useCan() {
  const rights = useRightsStore()
  const can = (code: string | number) => rights.has(Number(code))
  return { can, rights: computed(() => rights) }
}
