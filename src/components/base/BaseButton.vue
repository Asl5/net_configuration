<template>
  <component
    :is="isLink ? 'a' : as"
    :href="isLink ? href : undefined"
    :type="!isLink ? type : undefined"
    :disabled="!isLink ? computedDisabled : undefined"
    @click="onClick"
    :class="[
      baseClass,
      sizeClass,
      variantClass,
      roundedClass,
      block ? 'w-full' : '',
      shadow ? 'shadow' : '',
      computedDisabled ? disabledClass : '',
    ]"
  >
    <!-- spinner left -->
    <svg
      v-if="loading && spinnerPlacement === 'left'"
      class="animate-spin h-5 w-5 mr-2"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4" />
    </svg>

    <slot>{{ label }}</slot>

    <!-- spinner right -->
    <svg
      v-if="loading && spinnerPlacement === 'right'"
      class="animate-spin h-5 w-5 ml-2"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4" />
    </svg>
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";

type Variant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "link"
  | "third"
  | "success"
  | "warning"
  | "info";
type Size = "xs" | "sm" | "md" | "lg";
type Rounded = "none" | "sm" | "md" | "lg" | "full";

const props = withDefaults(
  defineProps<{
    as?: keyof HTMLElementTagNameMap;
    href?: string;
    type?: "button" | "submit" | "reset";
    label?: string;

    /* state */
    loading?: boolean;
    disabled?: boolean;

    /* style */
    variant?: Variant;
    size?: Size;
    rounded?: Rounded;
    block?: boolean;
    shadow?: boolean;

    /* spinner */
    spinnerPlacement?: "left" | "right";

    /* class override */
    baseClass?: string;
    disabledClass?: string;
  }>(),
  {
    as: "button",
    type: "button",
    label: "Button",
    loading: false,
    disabled: false,
    variant: "primary",
    size: "md",
    rounded: "md",
    block: false,
    shadow: false,
    spinnerPlacement: "left",
    baseClass:
      "inline-flex items-center justify-center font-semibold focus:outline-none transition",
    disabledClass: "opacity-60 cursor-not-allowed",
  }
);

const isLink = computed(() => !!props.href);
const computedDisabled = computed(() => props.disabled || props.loading);

/* sizes */
const sizeClass = computed(() => {
  switch (props.size) {
    case "xs":
      return "text-xs px-2 py-1";
    case "sm":
      return "text-sm px-3 py-1.5";
    case "lg":
      return "text-base px-5 py-3";
    default:
      return "text-sm px-4 py-2"; // md
  }
});

/* rounded */
const roundedClass = computed(() => {
  switch (props.rounded) {
    case "none":
      return "rounded-none";
    case "sm":
      return "rounded";
    case "lg":
      return "rounded-lg";
    case "full":
      return "rounded-full";
    default:
      return "rounded-md"; // md
  }
});

/* variants */
const variantClass = computed(() => {
  switch (props.variant) {
    case "secondary":
      return "bg-gray-300 text-gray-700 hover:bg-gray-200";
    case "danger":
      return "bg-red-300 text-red-700 hover:bg-red-200";
    case "success":
      return "bg-green-300 text-green-700 hover:bg-green-200";
    case "warning":
      return "bg-yellow-300 text-yellow-700 hover:bg-yellow-200";
    case "info":
      return "bg-blue-300 text-blue-700 hover:bg-blue-200";
    case "ghost":
      return "bg-transparent text-gray-700 hover:bg-gray-200";
    case "link":
      return "bg-transparent text-blue-600 underline underline-offset-2 hover:opacity-90";
    case "third":
      return "bg-blue-600 text-white hover:bg-blue-700";
    default:
      return "bg-green-300 text-green-700 hover:bg-green-200"; // primary
  }
});

function onClick(e: MouseEvent) {
  if (computedDisabled.value) {
    e.preventDefault();
    e.stopPropagation();
  }
}
</script>
