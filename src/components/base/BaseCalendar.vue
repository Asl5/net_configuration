<template>
  <div ref="rootEl" :class="[rootClass, wrapperClass]" class="relative">
    <BaseLabel v-if="label" :text="label" as="label" size="sm" text-color="text-gray-700" />

    <div class=" ">
<div class="relative">
  <input
    :name="name"
    :autocomplete="autocomplete"
    :required="required"
    class="block w-full rounded-md border border-gray-300 pl-3 pr-10 py-2 text-sm text-black placeholder-gray-400
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 bg-white"
    :class="inputClass"
    :placeholder="placeholder || (format || 'DD/MM/YYYY')"
    :value="displayValue"
    :disabled="disabled"
    @input="onManualInput"
    @click="openPopup"
    @keydown.down.prevent="openPopup"
    @keydown.enter.prevent="confirmTyped"
    @keydown.esc.prevent="closePopup"
  />

  <!-- icona calendario -->
  <span
    v-if="showIcon"
    class="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
    @click="togglePopup"
  >
    <i class="fa-solid fa-calendar"></i>
  </span>

  <!-- icona clear -->
  <span
    v-if="clearable && internalValue"
    class="absolute inset-y-0 right-9 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
    @click="clear"
  >
    <i class="fa-solid fa-xmark"></i>
  </span>
</div>


    </div>

    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>

    <transition name="fade">
      <div
        v-if="popupOpen"
        ref="popupEl"
        class="absolute z-50 w-72 rounded-md border border-gray-200 bg-white shadow-lg p-3"
        :class="[popupClass, popupPosition === 'down' ? 'mt-1 top-full' : 'mb-1 bottom-full']"
      >
        <!-- header -->
        <div class="flex items-center justify-between mb-2 select-none text-gray-900">
          <div class="flex items-center gap-1">
            <button type="button" class="px-2 py-1 hover:bg-gray-100 rounded text-gray-900" @mousedown.prevent @click="prevYear">«</button>
            <button type="button" class="px-2 py-1 hover:bg-gray-100 rounded text-gray-900" @mousedown.prevent @click="prevMonth">‹</button>
          </div>
          <div class="text-sm font-medium text-gray-900">{{ monthLabel }} {{ viewYear }}</div>
          <div class="flex items-center gap-1">
            <button type="button" class="px-2 py-1 hover:bg-gray-100 rounded text-gray-900" @mousedown.prevent @click="nextMonth">›</button>
            <button type="button" class="px-2 py-1 hover:bg-gray-100 rounded text-gray-900" @mousedown.prevent @click="nextYear">»</button>
          </div>
        </div>

        <!-- giorni -->
        <div class="grid grid-cols-7 gap-1 text-center text-xs text-gray-600 mb-1 select-none">
          <div v-for="d in weekDays" :key="d">{{ d }}</div>
        </div>

        <div class="grid grid-cols-7 gap-1 text-center select-none">
          <button
            v-for="cell in calendarCells"
            :key="cell.key"
            type="button"
            class="px-0.5 py-1 rounded text-sm"
            :class="[
              cell.currentMonth ? 'text-gray-900' : 'text-gray-400',
              cell.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-50',
              isSelected(cell.date) ? 'bg-blue-600 text-white hover:bg-blue-600' : '',
              isToday(cell.date) ? 'ring-1 ring-blue-400' : ''
            ]"
            :disabled="cell.disabled"
            @mousedown.prevent
            @click="pickDate(cell.date)"
          >
            {{ cell.day }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import BaseLabel from '@/components/base/BaseLabel.vue';

/* props */
const props = defineProps<{
  modelValue: string | null;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  rootClass?: string;
  inputClass?: string;
  popupClass?: string;
  name?: string;
  required?: boolean;
  wrapperClass?: string;
  autocomplete?: string;
  format?: string;
  min?: string | Date;
  max?: string | Date;
  clearable?: boolean;
  showIcon?: boolean;
  firstDayOfWeek?: 1 | 0;
  locale?: string;
  closeOnSelect?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | null): void
  (e: 'change', v: string | null): void
  (e: 'open'): void
  (e: 'close'): void
}>();

/* stato */
const popupOpen = ref(false);
const popupPosition = ref<'up'|'down'>('down');
const internalValue = ref<string | null>(props.modelValue ?? null);
watch(() => props.modelValue, v => { internalValue.value = v ?? null; });

/* refs */
const rootEl = ref<HTMLElement|null>(null);
const popupEl = ref<HTMLElement|null>(null);

/* helpers */
const displayValue = computed(() => internalValue.value || '');
const today = startOfDay(new Date());
const viewDate = ref<Date>(parseItToDate(internalValue.value || '') || today);
const viewYear = computed(() => viewDate.value.getFullYear());
const viewMonth = computed(() => viewDate.value.getMonth());
const locale = computed(() => props.locale || 'it-IT');
const fdow = computed(() => (props.firstDayOfWeek ?? 1));

/* funzioni data */
function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addMonths(d: Date, n: number): Date { const x = new Date(d); x.setMonth(x.getMonth()+n); return x; }
function parseItToDate(s: string | null): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = +m[1], mo = +m[2]-1, y = +m[3];
  const dt = new Date(y, mo, d);
  return isNaN(dt.getTime()) ? null : dt;
}
function formatDateIt(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleDateString('it-IT');
}

/* calendario */
const monthLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value, { month: 'long' }).format(new Date(viewYear.value, viewMonth.value, 1))
);
const weekDays = computed(() => {
  const base = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  return fdow.value === 1 ? base : [...base.slice(-1), ...base.slice(0,-1)];
});
function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startWeekDay = (first.getDay() + 6) % 7; // Mon=0
  const padStart = (fdow.value === 1) ? startWeekDay : first.getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = padStart-1; i>=0; i--) {
    const d = new Date(year, month-1, prevDays-i);
    cells.push({ key:`p-${i}`, day:d.getDate(), date:startOfDay(d), currentMonth:false, disabled:false });
  }
  for (let i=1;i<=daysInMonth;i++) {
    const d=new Date(year,month,i);
    cells.push({ key:`c-${i}`, day:i, date:startOfDay(d), currentMonth:true, disabled:false });
  }
  const tail=42-cells.length;
  for(let i=1;i<=tail;i++){
    const d=new Date(year,month+1,i);
    cells.push({ key:`n-${i}`, day:i, date:startOfDay(d), currentMonth:false, disabled:false });
  }
  return cells;
}
const calendarCells = computed(()=>monthMatrix(viewYear.value,viewMonth.value));

/* interazioni */
function isSameDate(a:Date,b:Date){return a.getTime()===b.getTime();}
function isSelected(d:Date){const cur=parseItToDate(internalValue.value||'');return cur && isSameDate(cur,d);}
function isToday(d:Date){return isSameDate(today,d);}
function pickDate(d:Date){
  const it=formatDateIt(d);
  internalValue.value=it;
  emit('update:modelValue',it);
  emit('change',it);
  if(props.closeOnSelect??true) closePopup();
}
function openPopup(){
  if(popupOpen.value) return;
  popupOpen.value=true;
  emit('open');
  setTimeout(()=>{
    adjustPopupPosition();
    bindOutside();
  },0);
}
function closePopup(){
  if(!popupOpen.value) return;
  popupOpen.value=false;
  emit('close');
  unbindOutside();
}
function togglePopup() {
  if (popupOpen.value) {
    closePopup();
  } else {
    openPopup();
  }
}

/* navigation */
function prevYear() { viewDate.value = addMonths(viewDate.value, -12); }
function prevMonth() { viewDate.value = addMonths(viewDate.value, -1); }
function nextMonth() { viewDate.value = addMonths(viewDate.value, 1); }
function nextYear() { viewDate.value = addMonths(viewDate.value, 12); }

/* input */
function onManualInput(e:Event){
  const el=e.target as HTMLInputElement;
  const digits=el.value.replace(/\D/g,'').slice(0,8);
  let out='';
  if(digits.length<=2) out=digits;
  else if(digits.length<=4) out=digits.slice(0,2)+'/'+digits.slice(2);
  else out=digits.slice(0,2)+'/'+digits.slice(2,4)+'/'+digits.slice(4);
  el.value=out;
  const norm=parseItToDate(out);
  if(norm){internalValue.value=formatDateIt(norm);emit('update:modelValue',formatDateIt(norm));}
}
function confirmTyped(){ if(internalValue.value) closePopup(); }
function clear(){ internalValue.value=null; emit('update:modelValue',null); emit('change',null); }

/* click fuori */
function onDocPointerDown(ev:Event){
  if(!popupOpen.value) return;
  const target=ev.target as Node;
  if(rootEl.value && rootEl.value.contains(target)) return;
  closePopup();
}
function bindOutside(){ document.addEventListener('pointerdown',onDocPointerDown,true); }
function unbindOutside(){ document.removeEventListener('pointerdown',onDocPointerDown,true); }

/* gestione posizione */
function adjustPopupPosition() {
  if (!rootEl.value || !popupEl.value) return;
  const inputRect = rootEl.value.getBoundingClientRect();
  const popupHeight = popupEl.value.offsetHeight;
  const spaceBelow = window.innerHeight - inputRect.bottom;
  const spaceAbove = inputRect.top;

  if (spaceBelow < popupHeight && spaceAbove > popupHeight) {
    popupPosition.value = 'up';
  } else {
    popupPosition.value = 'down';
  }
}

onMounted(()=>{});
onBeforeUnmount(()=>unbindOutside());
</script>
