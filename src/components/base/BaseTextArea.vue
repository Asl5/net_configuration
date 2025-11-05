<!-- src/components/base/BaseTextarea.vue -->
<template>
  <BaseInput
    v-bind="forwardedAttrs"
    :model-value="modelValue"
    as="textarea"
    :root-class="rootClass"
    :input-class="componentClass"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <template #label><slot name="label" /></template>
    <template #leading><slot name="leading" /></template>
    <template #trailing><slot name="trailing" /></template>
    <template #error><slot name="error" /></template>
    <template #help><slot name="help" /></template>
  </BaseInput>
</template>

<script setup lang="ts">
import { useAttrs, computed } from 'vue'
import BaseInput from './BaseInput.vue'

defineOptions({ inheritAttrs: false })

defineProps<{ modelValue: string | number | null }>()
defineEmits<{ (e: 'update:modelValue', value: string | number | null): void }>()

const attrs = useAttrs()

// class → input-class
const componentClass = computed(() => (attrs as any).class ?? '')

// eventuale class del wrapper (solo se ti serve tenerla)
const rootClass = computed(() => (attrs as any)['data-root-class'] ?? '')

// passa avanti tutto il resto tranne class/style
const forwardedAttrs = computed(() => {
  const {  ...rest } = attrs as any
  return rest
})
</script>
