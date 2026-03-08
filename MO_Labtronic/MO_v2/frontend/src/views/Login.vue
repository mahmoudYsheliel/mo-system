<script setup lang="ts">
import { ref } from 'vue';
import { login } from '@/services/user.service';
import { isValidEmail } from '@/lib/helper-functions';
import { useRouter } from 'vue-router';
import { Toast, useToast } from 'primevue';

const toast = useToast()
const email = ref('')
const password = ref('')
const errorMessage = ref<string |undefined>()
const router = useRouter()

async function loginUser() {
  if (!isValidEmail(email.value)) {
    errorMessage.value = 'Please Enter a Valid Email';
    return
  }
  if (!password.value) {
    errorMessage.value = 'Please Enter a Valid Password';
    return
  }
  const res = await login(email.value, password.value)
  if (!res.success) {
    errorMessage.value = res?.msg;
    return
  }

  toast.add( {
    severity: 'info',
    summary: 'Log in Success',
    detail: res.msg,
    life: 3000
  })
  router.push('/dashboard')
}

</script>


<template>
<Toast />
   <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <img src="/imgs/logo.png" alt="LabTronic Logo" class="logo" style="width: 50%; height: auto; display: block; margin: 0 auto; object-fit: contain;">
        <h1>LabTronic MO System</h1>
        <p>Manufacturing Order Management</p>
      </div>

      <div class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" name="email" @input="errorMessage = ''" v-model="email">
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" name="password" @input="errorMessage = ''" v-model="password">
        </div>

        <button type="submit" class="btn btn-primary" @click="loginUser">Sign In</button>
      </div>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    </div>
  </div> 


</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #122e7c 0%, #ebebeb 100%);
}

.login-card {
  background: #fcfcfc;
  border-radius:calc(0.5rem - 2px);
  box-shadow: 0px 1px 2px 0px hsl(0 0% 0% / 0.18),;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  border: 1px solid #ebebeb;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
  border-radius:calc(0.5rem - 2px);
  width: 80%;
  max-width: 220px;
  height: auto;
  max-height: 60px;
  object-fit: contain;
  border-radius:calc(0.5rem - 2px);
  display: block;
  margin: 0 auto;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: black;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #757575;
  font-size: 0.875rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: black;
  font-size: 0.875rem;
}

.form-group input[type="email"],
.form-group input[type="password"] {
  padding: 0.75rem;
  border: 1px solid #ebebeb;
  border-radius:calc(0.5rem - 2px);
  background: #ebebeb;
  color: black;
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #122e7c;
  box-shadow: 0 0 0 3px black;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: black;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: #122e7c;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.login-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: black;
  margin-bottom: 0.5rem;
}

.btn-primary {
  background: #122e7c;
  color: white;
}

.btn-primary:hover {
  background: #122e7c;
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius:calc(0.5rem - 2px);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.error-message {
  background: var(--color-destructive);
  color: var(--color-destructive-foreground);
  padding: 0.75rem;
  border-radius:calc(0.5rem - 2px);
  margin-top: 1rem;
  font-size: 0.875rem;
  text-align: center;
}

@media (max-width: 768px) {
  .login-card {
    padding: 2rem;
  }
}
</style>