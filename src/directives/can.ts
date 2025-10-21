// src/directives/can.ts
import type { DirectiveBinding } from 'vue'
import { useRightsStore } from '@/stores/rights'

export const vCan = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const rights = useRightsStore()
    const arg = binding.arg // es. 'flow' per uso su flusso
    const val = binding.value
    let ok = false

    if (arg === 'flow' && val && typeof val === 'object') {
      ok = rights.hasOnFlow(val.flowId, val.code)
    } else if (typeof val === 'string') {
     ok = rights.has(Number(val))
    }
    if (!ok) el.style.display = 'none'
  }
}
