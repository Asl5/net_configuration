// src/directives/can.ts
import type { DirectiveBinding } from 'vue'
import { useRightsStore } from '@/stores/rights'

export const vCan = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const rights = useRightsStore()
    const val = binding.value
    const ok = typeof val !== 'undefined' ? rights.has(Number(val)) : false
    if (!ok) el.style.display = 'none'
  }
}
