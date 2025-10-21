<!-- src/components/base/BaseTextarea.vue -->
<template>
  <BaseInput
    v-bind="$attrs"
    :model-value="modelValue"
    as="textarea"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <template #label>
      <slot name="label" />
    </template>
    <template #leading>
      <slot name="leading" />
    </template>
    <template #trailing>
      <slot name="trailing" />
    </template>
    <template #error>
      <slot name="error" />
    </template>
    <template #help>
      <slot name="help" />
    </template>
  </BaseInput>
  
</template>

<script setup lang="ts">
// Re-export a textarea version identical to BaseInput but with `as="textarea"`.
// Keeps the same props/slots API via pass-through.
import BaseInput from './BaseInput.vue'

defineProps<{
  modelValue: string | number | null
}>()

defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()
</script>

