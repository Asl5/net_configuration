<template>
  <!-- Overlay -->
  <div class="fixed inset-0 flex items-center justify-center bg-white z-50 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white shadow-2xl rounded-xl overflow-hidden transition-all duration-500" :class="successAnim ? 'scale-95 opacity-0 ring-2 ring-emerald-500 ring-offset-2 ring-offset-white' : ''">
      <div class="px-4 sm:px-6 py-4 flex flex-col gap-2 items-center text-center"><img src="@/assets/logo.png" alt="Logo" class="w-auto bg-white rounded-md" />
           <BaseLabel as="h1" text="Net configuration" size="2xl" weight="bold" text-color="text-blue-800"   />

          <!-- <BaseLabel
            as="p"
            text="Area riservata"
            size="sm"
            weight="normal"
            text-color="text-black"
          />  -->
        </div>

       <form novalidate class="px-4 sm:px-6 py-5 sm:py-6 space-y-4" @submit.prevent="onSubmit" autocomplete="on">
          <div>
            <BaseInput
              v-model="email"
              label="Username"
              type="text"
              placeholder="Username"
              :invalid="!!errors.email"
              :data-error="errors.email" class="mb-6"
            />

            <BaseInput
              v-model="password"
              label="Password"
              type="password"
              placeholder="Password"
              :minlength="6"
              required
              showPasswordToggle
              :invalid="!!errors.password"
              :data-error="errors.password"
              text-color="text-gray-800"
              placeholder-color="placeholder-gray-400"
              label-color="text-gray-700"
              help="Minimo 6 caratteri"
              border-color="border-gray-300"
              border-color-invalid="border-red-600"
              focus-class="focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              @blur="validateField('password')"
              autocomplete="current-password"
            />
          </div>

          <!-- Errore generale del form (es. server) -->
          <p v-if="errors.form" class="text-sm text-red-600 mb-2">{{ errors.form }}</p>
          <BaseButton
            type="submit"
            :loading="loading"
            block
            size="md"
            rounded="lg"
            variant="primary"
          >
            Entra
          </BaseButton>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from "vue";
import BaseInput from "../components/base/BaseInput.vue";
import BaseLabel from "../components/base/BaseLabel.vue";
import BaseButton from "../components/base/BaseButton.vue";
import { useRoute, useRouter } from "vue-router";
import { setToken } from "@/services/auth";
import { loginRequest } from "@/services/api";
import { useRightsStore } from "@/stores/rights";
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const loading = ref(false);
const successAnim = ref(false);
const errors = reactive<{ email?: string; password?: string; form?: string }>({});

// function validateEmail() {
//   if (!email.value) return "Email obbligatoria";
//   if (!/.+@.+\..+/.test(email.value)) return "Email non valida";
//   return "";
// }

function validatePassword() {
  if (!password.value) return "Password obbligatoria";
  if (password.value.length < 6) return "Password troppo corta (min 6)";
  return "";
}

function validateField(name: "password") {
  errors[name] = validatePassword();
}

async function onSubmit() {
  // errors.email = validateEmail();
  errors.password = validatePassword();
  errors.form = "";

  if (errors.email || errors.password) return;

  loading.value = true;
  try {
    const { access_token } = await loginRequest(email.value, password.value);

    setToken(access_token);
    const rights = useRightsStore();
    await rights.bootstrap(email.value);
    // Se non ha diritti, non entra
    if ((!rights.generalRoles || rights.generalRoles.length === 0) && (!rights.rights || rights.rights.length === 0)) {
      rights.clear();
      errors.form = "Utente senza diritti. Accesso negato.";
      return;
    }
    await nextTick();
    setTimeout(() => {
      const redirect = route.query.redirect ? String(route.query.redirect) : "/users";
      router.push(redirect);
    }, 0);
  } catch (e: any) {
    errors.form = e?.message ?? "Errore di autenticazione";
  } finally {
    loading.value = false;
  }
}
</script>





