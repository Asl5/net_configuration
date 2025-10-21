<script setup lang="ts">
const props = defineProps<{
  option: { id: number; label: string }
  modelValue: number[]
  exclusive?: boolean
  textClass?: string
  colorClass?: string
  noLabel?: boolean   // 👈 nuovo
}>()

const emit = defineEmits<{
  (e: "update:modelValue", v: number[]): void
}>()

function toggle() {
  if (props.exclusive) {
    emit("update:modelValue", [props.option.id])
  } else {
    const current = Array.isArray(props.modelValue) ? props.modelValue : []
    const exists = current.includes(props.option.id)
    if (exists) {
      emit("update:modelValue", current.filter(v => v !== props.option.id))
    } else {
      emit("update:modelValue", [...current, props.option.id])
    }
  }
}

const isChecked = () => Array.isArray(props.modelValue) && props.modelValue.includes(props.option.id)
</script>

<template>
  <label class="inline-flex items-center cursor-pointer select-none">
    <input
      type="checkbox"
      :checked="isChecked()"
      @change="toggle"
      class="accent-blue-600"
    />
    <span
      v-if="!noLabel"
      :class="[textClass ?? 'text-gray-700', isChecked() ? colorClass ?? '' : '']"
      class="ml-1"
    >
      {{ option.label }}
    </span>
  </label>
</template>
