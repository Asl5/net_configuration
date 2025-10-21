<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- src/components/form/BaseInput.vue -->
<template>
  <div :class="[ rootClass, marginClass]">
    <!-- Label -->
    <label
      v-if="showLabel"
      :for="cid"
      class="block text-sm font-medium "
      :class="computedLabelColor"
    >
      <slot name="label">{{ label }}</slot>
    </label>

    <div class="relative">
      <!-- Leading slot (icona/addon) -->
      <div
        v-if="$slots.leading"
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <slot name="leading" />
      </div>

      <!-- Input / Textarea / Select -->
      <component
        :is="resolvedTag"
        :id="cid"
        v-bind="inputAttrs"
        :value="innerValue"
        :class="computedInputClass"
        @input="onInput"
        @focus="(e: FocusEvent) => emit('focus', e)"
        @keydown="onKeydown"
        @keyup="(e: KeyboardEvent) => emit('keyup', e)"
        @change="onChange"
        @blur="onBlur"
      >
        <template v-if="as === 'select'">
          <slot />
        </template>
      </component>

          <!-- Trailing (icona/addon) -->
      <div
        v-if="$slots.trailing || loading || (type === 'password' && showPasswordToggle)"
        class="absolute inset-y-0 right-0 pr-3 flex items-center gap-2"
      >
        <!-- Toggle password integrato -->
        <button
          v-if="type === 'password' && showPasswordToggle"
          type="button"
          class="p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
          :aria-pressed="reveal"
          :aria-label="reveal ? 'Nascondi password' : 'Mostra password'"
          @click="reveal = !reveal"
        >
          <!-- usa qualunque icona: FontAwesome o un SVG inline -->
          <slot name="password-eye">
          <font-awesome-icon :icon="reveal ? 'eye-slash' : 'eye'" />.
          </slot>
        </button>

        <!-- Trailing custom utente -->
        <slot name="trailing" />

        <!-- Spinner -->
        <svg v-if="loading" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4" />
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4" />
        </svg>
      </div>
    </div>

    <!-- Help / Error -->
    <p v-if="errorMessage || $slots.error" :class="['mt-1 text-sm', errorColor]">
      <slot name="error">{{ errorMessage }}</slot>
    </p>
    <p v-else-if="help || $slots.help" :class="['mt-1 text-sm', helpColor]">
      <slot name="help">{{ help }}</slot>
    </p>
  </div>
</template>

<script setup lang="ts">

import { computed, ref, useAttrs, useSlots } from "vue";
const slots = useSlots()


 const reveal = ref(false)       // NEW: stato mostra/nascondi
const selfInvalid = ref(false); // NEW

type Size = "sm" | "md" | "lg";
type AsTag = "input" | "textarea" | "select";
type InputType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "search"
  | "tel"
  | "url"
  | "date"
  | "time"
  | "datetime-local"
  | "month"
  | "week"
  | "color";

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null;
    id?: string;
    label?: string;
    showLabel?: boolean;
    placeholder?: string;
    type?: InputType;
    as?: AsTag;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    valid?: boolean;
    loading?: boolean;
showPasswordToggle?: boolean;
    /* ---- Color & style tokens (tailwind class names) ---- */
    rootClass?: string;
    marginClass?: string;

    /* testo / placeholder / label / help */
    textColor?: string; // es: 'text-gray-900'
    placeholderColor?: string; // es: 'placeholder-gray-400'
    labelColor?: string; // es: 'text-gray-700'
    helpColor?: string; // es: 'text-gray-500'
    errorColor?: string; // es: 'text-red-600'

    /* background e bordo base */
    bgColor?: string; // es: 'bg-white'
    borderColor?: string; // es: 'border-gray-300'
    rounding?: string; // es: 'rounded-lg'
    transitionClass?: string; // es: 'transition'

    /* disabled state */
    disabledTextColor?: string; // es: 'text-gray-500'
    disabledBgColor?: string; // es: 'bg-gray-100'
    disabledBorderColor?: string; // es: 'border-gray-300'
    disabledCursor?: string; // es: 'cursor-not-allowed'

    /* valid/invalid border */
    borderColorInvalid?: string; // es: 'border-red-500'
    borderColorValid?: string; // es: 'border-green-500'

    /* focus ring/border */
    focusClass?: string; // es: 'focus:ring-2 focus:ring-brand-green focus:border-transparent'
    focusClassValid?: string; // es: 'focus:ring-2 focus:ring-green-500 focus:border-transparent'
    focusClassInvalid?: string; // es: 'focus:ring-2 focus:ring-red-500 focus:border-transparent'

    /* dimensioni */
    size?: Size;

    /* padding per icone */
    hasLeading?: boolean;
    hasTrailing?: boolean;

    /* attributi HTML extra */
    minlength?: number;
    maxlength?: number;
    pattern?: string | RegExp;
    step?: string | number;
    min?: string | number;
    max?: string | number;
    autocomplete?: string;
    inputmode?: string;
    emailPattern?: string | RegExp; // NEW
    validateOn?: "input" | "blur" | "change"; // NEW
    help?: string;
  }>(),
  {
    modelValue: null,
    type: "text",
    as: "input",
    showLabel: true,
    size: "md",
    loading: false,
    help: "",
 showPasswordToggle: false,
    /* default neutrali (grigi) */
    textColor: "text-gray-900",
    placeholderColor: "placeholder-gray-400",
    labelColor: "text-gray-700",
    helpColor: "text-gray-500",
    errorColor: "text-red-600",

    bgColor: "bg-white",
    borderColor: "border-gray-300",
    rounding: "rounded-lg",
    transitionClass: "transition",

    disabledTextColor: "text-gray-500",
    disabledBgColor: "bg-gray-100",
    disabledBorderColor: "border-gray-300",
    disabledCursor: "cursor-not-allowed",
   rootClass: "flex-1 min-w-0",
    marginClass: "",
    borderColorInvalid: "border-red-500",
    borderColorValid: "border-green-500",
    emailPattern: "/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/", // NEW - semplice e robusta
    validateOn: "blur",
    focusClass: "focus:ring-2 focus:ring-brand-green focus:border-transparent",
    focusClassValid: "focus:ring-2 focus:ring-green-500 focus:border-transparent",
    focusClassInvalid: "focus:ring-2 focus:ring-red-500 focus:border-transparent",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string | number | null): void;
  (e: "focus", ev: FocusEvent): void;
  (e: "blur", ev: FocusEvent): void;
  (e: "input", ev: Event): void;
  (e: "change", ev: Event): void;
  (e: "keydown", ev: KeyboardEvent): void;
  (e: "keyup", ev: KeyboardEvent): void;
  (e: "enter", ev: KeyboardEvent): void;
}>();

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

function validateEmail(val: string) {
  // NEW
  const pattern =
    props.emailPattern instanceof RegExp
      ? props.emailPattern
      : new RegExp(props.emailPattern as string);
  selfInvalid.value = !!val && !pattern.test(val);
}

const isInvalid = computed(
  () => props.invalid ?? (props.type === "email" ? selfInvalid.value : false)
); // NEW

const isValid = computed(
  () => props.valid ?? (props.type === "email" ? !selfInvalid.value && !!innerValue.value : false)
); // NEW

const cid = computed(() => props.id ?? `in_${Math.random().toString(36).slice(2, 8)}`);
const resolvedTag = computed(() => props.as);
const innerValue = computed(() => props.modelValue ?? "");

const baseRing = computed(() =>
  isInvalid.value
    ? props.focusClassInvalid
    : isValid.value
    ? props.focusClassValid
    : props.focusClass
); // MOD


// Tipo effettivo dell'input (gestisce reveal per password)
const currentType = computed(() => {
 if (props.type === 'password' && props.showPasswordToggle) {
   return reveal.value ? 'text' : 'password'
     }
 return props.type
})

const computedBorderColor = computed(() =>
  isInvalid.value
    ? props.borderColorInvalid
    : isValid.value
    ? props.borderColorValid
    : props.borderColor
); // MOD



const hasTrailingEffective = computed(() => {
  // se l'utente ha messo slot trailing, oppure loading, oppure il toggle password
  return !!slots.trailing || props.loading || (props.type === 'password' && props.showPasswordToggle)
})

const sizeClass = computed(() => {
 const leftPad = props.hasLeading ? "pl-10" : "pl-3";
  const rightPad = hasTrailingEffective.value ? "pr-10" : "pr-3";

  switch (props.size) {
    case "sm":
      return `text-sm ${leftPad} ${rightPad} py-1.5`;
    case "lg":
      return `text-base ${leftPad} ${rightPad} py-3`;
    default:
      return `text-sm ${leftPad} ${rightPad} py-2`;
  }
});

const computedBg = computed(() => (props.disabled ? props.disabledBgColor : props.bgColor));

const computedText = computed(() => (props.disabled ? props.disabledTextColor : props.textColor));

const computedDisabledBorder = computed(() =>
  props.disabled ? props.disabledBorderColor : undefined
);
const computedLabelColor = computed(() => props.labelColor);

const computedInputClass = computed(() =>
  [
    "w-full border px-0 focus:outline-none",
    props.rounding,
    props.transitionClass,
    sizeClass.value,
    computedBg.value,
    computedText.value,
    props.placeholderColor,
    computedBorderColor.value,
    baseRing.value,
    props.disabled && props.disabledCursor,
    props.disabled && computedDisabledBorder.value,
  ]
    .filter(Boolean)
    .join(" ")
);

const inputAttrs = computed(() => {
  const pattern = props.pattern instanceof RegExp ? props.pattern.source : props.pattern;

  const common = {
    placeholder: props.placeholder,
    required: props.required,
    disabled: props.disabled,
    readonly: props.readonly,
    autocomplete: props.autocomplete,
    inputmode: props.inputmode,
    minlength: props.minlength,
    maxlength: props.maxlength,
    step: props.step as any,
    min: props.min as any,
    max: props.max as any,
    pattern,
    "aria-invalid": isInvalid.value || undefined,
    "aria-describedby": undefined as string | undefined,
    ...attrs, // extra attributi
  };

  if (props.as === "textarea") {
    return { rows: (attrs as any).rows ?? 3, ...common };
  }
  if (props.as === "select") {
    return { ...common };
  }
return { type: currentType.value, ...common };
});

function onInput(e: Event) {
  emit("input", e);
  const target = e.target as HTMLInputElement | HTMLTextAreaElement;
  const val = target?.value ?? "";
  emit("update:modelValue", val);
  if (props.type === "email" && props.validateOn === "input") validateEmail(val); // NEW
}

function onKeydown(e: KeyboardEvent) {
  emit("keydown", e);
  if (e.key === "Enter") emit("enter", e);
}

// aggiungi questi due wrapper leggeri sotto ai listeners del <component>:
function onChange(e: Event) {
  // NEW
  emit("change", e);
  if (props.type === "email" && props.validateOn === "change") {
    const val = (e.target as HTMLInputElement)?.value ?? "";
    validateEmail(val);
  }
}

function onBlur(e: FocusEvent) {
  // NEW
  emit("blur", e);
  if (props.type === "email" && props.validateOn === "blur") {
    const val = (e.target as HTMLInputElement)?.value ?? "";
    validateEmail(val);
  }
}

const errorMessage = computed(() => {
  if (!isInvalid.value) return undefined;
  return (attrs["data-error"] as string | undefined) ?? "Email non valida"; // MOD
});
</script>
