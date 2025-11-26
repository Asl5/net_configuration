<!-- src/components/base/BaseHeader.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterLink, useRouter } from "vue-router";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseModalAlert from "@/components/base/BaseModalAlert.vue";
import { useNav, type NavItem } from "@/router/useNav";

import BaseModal from "@/components/base/BaseModal.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
// import BaseInput from "@/components/base/BaseInput.vue";
// import BaseSelect from "@/components/base/BaseSelect.vue";
import { useRightsStore } from "@/stores/rights";
import { logout } from "@/services/auth";

const showHelp = ref(false);
const helpSending = ref(false);
const helpSent = ref(false);
const helpError = ref<string | null>(null);

const helpForm = ref({
  nome: "",
  email: "",
  sezione: null as null | string | number,
  oggetto: "",
  messaggio: "",
});

// const helpSections = [
//   { value: "login", label: "Accesso / Login" },
//   { value: "flussi", label: "Net configuration" },
//   { value: "invii", label: "Invii/Ritorni" },
//   { value: "dashboard", label: "Dashboard" },
//   { value: "altro", label: "Altro" },
// ];

async function sendHelp() {
  helpError.value = null;
  if (!helpForm.value.email || !helpForm.value.messaggio) {
    helpError.value = "Compila almeno email e messaggio.";
    return;
  }
  helpSending.value = true;
  setTimeout(() => {
    helpSending.value = false;
    helpSent.value = true;
    showHelp.value = false;
    helpForm.value.oggetto = "";
    helpForm.value.messaggio = "";
  }, 600);
}

const props = defineProps<{
  title: string;
  navItems?: NavItem[]; // opzionale: se passato, overridea quelli globali
}>();

const isOpen = ref(false);
const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};
const closeMenu = () => {
  isOpen.value = false;
};

const { items } = useNav();
// Filtra il menu in base ai ruoli richiesti (ID numerici)
const effectiveNav = computed(() => {
  const source = props.navItems ?? items.value;
  const hasRole = (req?: number | number[]) => {
    if (!req) return true;
    const list = Array.isArray(req) ? req : [req];
    return list.some((id) => rightsStore.hasRole(id));
  };

  return source
    .map((it) => {
      if (it.group && Array.isArray(it.children)) {
        const children = it.children.filter((c) =>
          hasRole((c as any).requiredRole ?? (c as any).meta?.requiredRole)
        );
        // mostra il gruppo se almeno un child � visibile, oppure se il gruppo stesso � visibile
        const groupVisible =
          hasRole((it as any).requiredRole ?? (it as any).meta?.requiredRole) ||
          children.length > 0;
        return groupVisible ? { ...it, children } : null;
      }
      const visible = hasRole((it as any).requiredRole ?? (it as any).meta?.requiredRole);
      return visible ? it : null;
    })
    .filter(Boolean) as typeof source;
});
const showLogoutModal = ref(false);
const rightsStore = useRightsStore();
rightsStore.hydrateFromSession();
const router = useRouter();
async function doLogout() {
  showLogoutModal.value = false;
  try { await logout(); } catch {}
  try { rightsStore.clear(); } catch {}
  router.replace({ name: "login" });
}
</script>

<template>
  <header class="shrink-0 app-surface app-text border-b app-border">
    <div class="w-full px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <!-- Toggle menu -->
        <button
          @click="toggleMenu"
          class="p-2 rounded-md app-text hover:[background-color:var(--color-surface)] focus:outline-none"
        >
          <svg
            v-if="!isOpen"
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h1 class="text-xl font-semibold text-gray-900">{{ title }}</h1>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-md text-blue-600 hover:bg-blue-50"
          @click="showHelp = true"
        >
          <BaseIcon name="info" size="w-5 h-5" color="text-blue-600"/>
          <span class="text-sm font-medium">Aiuto</span>
        </button>
      </div>
    </div>

    <!-- Overlay -->
    <transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 bg-black/40 z-40" @click="closeMenu" />
    </transition>

    <!-- Drawer -->
    <transition name="slide">
      <aside
        v-if="isOpen"
        class="fixed inset-y-0 left-0 w-64 bg-white border-r shadow-lg z-50 flex flex-col"
      >
        <div class="p-3 flex justify-between items-center border-b bg-gray-100">
          <div class="flex items-center gap-2">
            <img src="@/assets/logo.png" alt="ASL" class="h-12 w-auto rounded" />
            <!-- <p class="text-md font-semibold text-gray-700">Navigazione</p> -->
          </div>
          <button @click="closeMenu" class="p-1 rounded-md text-gray-600 hover:bg-gray-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Nav -->
        <nav class="p-3 space-y-1 flex-1">
          <template v-for="(item, i) in effectiveNav" :key="i">
            <!-- Gruppo -->
            <template v-if="item.group">
              <div
                class="flex items-center gap-2 px-3 py-2 rounded text-blue-700 cursor-default font-semibold"
              >
                <!-- 👇 icona del gruppo, se presente -->
                <BaseIcon v-if="item.icon" :name="item.icon" color="text-blue-600" size="w-5 h-5" />
                <span>{{ item.label }}</span>
              </div>

              <!-- Figli del gruppo -->
              <RouterLink
                v-for="(child, j) in item.children ?? []"
                :key="j"
                :to="child.to!"
                class="flex items-center gap-2 pl-8 px-3 py-2 rounded hover:bg-gray-100 font-semibold transition-colors"
                @click="closeMenu"
                v-slot="{ isActive }"
              >
                <BaseIcon
                  v-if="child.icon"
                  :name="child.icon"
                  :color="isActive ? 'text-gray-800' : 'text-gray-400'"
                  size="w-5 h-5"
                />
                <span :class="[isActive ? 'text-gray-800 font-semibold' : 'text-gray-400']">
                  {{ child.label }}
                </span>
              </RouterLink>
            </template>

            <!-- Item piatto -->
            <!-- Item piatto -->
            <RouterLink
              v-else-if="item.to && item.clickable !== false"
              :to="item.to"
              class="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition-colors"
              @click="closeMenu"
              v-slot="{ isActive }"
            >
              <BaseIcon
                v-if="item.icon"
                :name="item.icon"
                :color="isActive ? 'text-gray-800' : 'text-gray-400'"
                size="w-5 h-5"
              />
              <span
                :class="[
                  'transition-colors',
                  isActive ? 'font-semibold text-gray-800' : 'text-gray-400',
                ]"
              >
                {{ item.label }}
              </span>
            </RouterLink>

            <!-- Caso non cliccabile -->
            <span v-else class="block px-3 py-2 rounded text-gray-400 cursor-default">
              {{ item.label }}
            </span>
          </template>
        </nav>
        <div
          class="p-4 border-t app-border mt-auto flex items-center justify-between gap-3 app-text bg-gray-100"
        >
          <BaseIcon name="user" color="text-gray-800" size="w-7 h-7" />
          <div class="flex items-center justify-between w-full ">
            <!-- Sinistra -->
            <div class="text-sm flex flex-col items-start">
              <div class="font-medium">Utente</div>
              <div class="text-gray-600">{{ rightsStore.matricola || "—" }}</div>
            </div>

            <!-- Destra -->
            <BaseButton
              variant="ghost"
              size="md"
              class="text-red-600 hover:bg-red-100 inline-flex items-center gap-2"
              @click="showLogoutModal = true"
            >
              <BaseIcon name="logout" size="w-4 h-4" color="text-red-600"/>
              Esci
            </BaseButton>
          </div>
        </div>
      </aside>
    </transition>
  </header>
  <BaseModalAlert
    :show="showLogoutModal"
    title="Conferma logout"
    message="Vuoi davvero uscire dall'applicazione?"
    ok-text="Esci"
    cancel-text="Annulla"
    @confirm="doLogout"
    @cancel="showLogoutModal = false"
  />

  <BaseModalAlert
    :show="helpSent"
    title="Richiesta inviata"
    message="Grazie! Ti risponderemo appena possibile."
    ok-text="Ok"
    @confirm="helpSent = false"
  /><BaseModal v-if="showHelp" v-model="showHelp" title="Contatta il Supporto" height="40vh" >
    <div class="space-y-4">
      <p class="text-sm app-muted">
        Hai bisogno di aiuto? Inviaci un messaggio con i dettagli del problema oppure usa i
        riferimenti qui sotto.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="rounded-md border p-3">
          <div class="text-xs text-gray-700 font-medium">Email</div>
          <a href="mailto:supporto@example.com" class="text-sm text-blue-600 hover:underline">
            supporto@example.com
          </a>
        </div>
        <div class="rounded-md border p-3">
          <div class="text-xs text-gray-700 font-medium">Telefono</div>
          <a href="tel:+39000000000" class="text-sm text-blue-600 hover:underline">
            +39 000 000 000
          </a>
        </div>
      </div>

      <!-- <div class="flex flex-col md:flex-row gap-3">
        <BaseInput
          v-model="helpForm.nome"
          label="Nome"
          placeholder="Il tuo nome"
          class="flex-1 min-w-0"
        />
        <BaseInput
          v-model="helpForm.email"
          type="email"
          label="Email"
          placeholder="nome@azienda.it"
          class="flex-1 min-w-0"
        />
      </div>

      <BaseSelect
        v-model="helpForm.sezione"
        :options="helpSections"
        label="Sezione"
        placeholder="Seleziona sezione"
        wrapperClass="w-full"
      />

      <BaseInput
        v-model="helpForm.oggetto"
        label="Oggetto"
        placeholder="Breve descrizione"
        class="w-full"
      />
      <BaseInput
        v-model="helpForm.messaggio"
        as="textarea"
        label="Messaggio"
        placeholder="Descrivi il problema"
        class="w-full"
      />

      <p v-if="helpError" class="text-sm text-red-600">{{ helpError }}</p> -->
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="secondary" @click="showHelp = false">Annulla</BaseButton>
        <BaseButton variant="primary" :disabled="helpSending" @click="sendHelp">Invia</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
</style>
