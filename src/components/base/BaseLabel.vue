<!-- src/components/form/BaseLabel.vue -->
<template>
  <!-- Wrapper -->
  <component
    :is="as"
    v-bind="rootAttrs"
    :for="as === 'label' ? forId : undefined"
    :class="[rootClass, marginClass]"
  >
    <!-- Leading icon/slot -->
    <span v-if="$slots.leading" class="mr-2 inline-flex items-center">
      <slot name="leading" />
    </span>

    <!-- Testo label -->
    <span
      :class="[
        sizeClass,
        weightClass,
        casingClass,
        alignClass,
        computedTextColor,
        srOnly ? 'sr-only' : ''
      ]"
      :title="tooltip || undefined"
    >
      <slot>{{ text }}</slot><span v-if="colon" aria-hidden="true">:</span>
    </span>

    <!-- Badge richiesto/opzionale -->
    <span v-if="required" :class="['ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[11px] leading-none', requiredBadgeClass]">
      <slot name="requiredBadge">obbligatorio</slot>
    </span>
    <span v-else-if="showOptional" :class="['ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[11px] leading-none', optionalBadgeClass]">
      <slot name="optionalBadge">{{ optionalText }}</slot>
    </span>

    <!-- Trailing icon/slot -->
    <span v-if="$slots.trailing" class="ml-2 inline-flex items-center">
      <slot name="trailing" />
    </span>
  </component>

  <!-- Caption (help/subtitle) -->
  <p v-if="caption || $slots.caption"
     :id="captionId"
     :class="['mt-1 text-xs', computedCaptionColor]">
    <slot name="caption">{{ caption }}</slot>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Size = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
type Align = 'left' | 'center' | 'right'

const props = withDefaults(defineProps<{
  /** testo della label se non usi lo slot default */
  text?: string
  /** id del controllo target (input/select/textarea) */
  forId?: string
  /** renderizza come <label> (default) o come <div>/<span> ecc. */
  as?: keyof HTMLElementTagNameMap
  /** mostra i due punti dopo il testo */
  colon?: boolean
  /** campo richiesto ’ mostra badge rosso e aria-required */
  required?: boolean
  /** mostra badge opzionale quando non richiesto */
  showOptional?: boolean
  optionalText?: string

  /** stati */
  invalid?: boolean
  disabled?: boolean
  srOnly?: boolean

  /** stile/spacing */
  size?: Size
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  uppercase?: boolean
  align?: Align
  marginClass?: string
  rootClass?: string

  /** colori (Tailwind class names) */
  textColor?: string               // default
  textColorInvalid?: string        // se invalid
  textColorDisabled?: string       // se disabled
  caption?: string
  captionColor?: string
  captionColorInvalid?: string
  captionColorDisabled?: string

  requiredBadgeClass?: string      // stile badge "obbligatorio"
  optionalBadgeClass?: string      // stile badge "opzionale"

  /** tooltip sul testo label */
  tooltip?: string

  /** id per la caption (utile a collegare aria-describedby dal controllo) */
  captionId?: string
}>(), {
  as: 'label',
  colon: false,
  required: false,
  showOptional: false,
  optionalText: '(opzionale)',

  invalid: false,
  disabled: false,
  srOnly: false,

  size: 'sm',
  weight: 'medium',
  uppercase: false,
  align: 'left',
  marginClass: 'mb-1',
  rootClass: '',

  // default grigi, rosso se invalid
  textColor: '[color:var(--color-text)]',
  textColorInvalid: '[color:var(--color-danger)]',
  textColorDisabled: '[color:var(--color-muted)]',

  caption: '',
  captionColor: '[color:var(--color-muted)]',
  captionColorInvalid: '[color:var(--color-danger)]',
  captionColorDisabled: '[color:var(--color-muted)]',

  requiredBadgeClass: '[background-color:color-mix(in_oklab,var(--color-danger),#ffffff_85%)] [color:var(--color-danger)]',
  optionalBadgeClass: '[background-color:var(--color-surface)] [color:var(--color-muted)]',

  tooltip: '',
  captionId: undefined,
})

/* ----- computed di stile ----- */
const sizeClass = computed(() => {
  switch (props.size) {
    case '2xs': return 'text-[10px]'
    case 'xs': return 'text-xs'
    case 'sm': return 'text-sm'
    case 'md': return 'text-base'
    case 'lg': return 'text-lg'
    case 'xl': return 'text-xl'
    case '2xl': return 'text-2xl'
    case '3xl': return 'text-3xl'
    case '4xl': return 'text-4xl'
    default: return 'text-sm'
  }
})
const weightClass = computed(() => {
  switch (props.weight) {
    case 'normal': return 'font-normal'
    case 'medium': return 'font-medium'
    case 'semibold': return 'font-semibold'
    case 'bold': return 'font-bold'
    default: return 'font-medium'
  }
})
const casingClass = computed(() => props.uppercase ? 'uppercase tracking-wide' : '')
const alignClass = computed(() => (
  props.align === 'center' ? 'text-center' :
  props.align === 'right' ? 'text-right' : 'text-left'
))

const computedTextColor = computed(() => {
  if (props.disabled) return props.textColorDisabled
  if (props.invalid) return props.textColorInvalid
  return props.textColor
})
const computedCaptionColor = computed(() => {
  if (props.disabled) return props.captionColorDisabled
  if (props.invalid) return props.captionColorInvalid
  return props.captionColor
})

/* attributi/ARIA root */
const rootAttrs = computed(() => ({
  'aria-required': props.required || undefined,
  'aria-disabled': props.disabled || undefined,
  'aria-invalid': props.invalid || undefined,
}))
</script>




