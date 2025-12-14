<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/stores/auth';
import { isValidEmail } from '@/lib/helperFunctions';
import { postEvent } from '@/utils/mediator';
import { useRouter } from 'vue-router';


const email = ref('')
const password = ref('')
const errorMessage = ref('')
const auth = useAuth()
const router = useRouter()

async function login() {
  if (!isValidEmail(email.value)) {
    errorMessage.value = 'Please Enter a Valid Email';
    return
  }
  if (!password.value) {
    errorMessage.value = 'Please Enter a Valid Password';
    return
  }
  const res = await auth.login(email.value, password.value)
  if (!res.success) {
    errorMessage.value = res.msg;
    return
  }

  postEvent('add_toast', {
    severity: 'info',
    summary: 'Log in Success',
    detail: res.msg,
    life: 3000
  })
  router.push('/dashboard')
}

</script>


<template>

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

        <button type="submit" class="btn btn-primary" @click="login">Sign In</button>
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
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
}

.login-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--color-border);
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
  border-radius: var(--radius-md);
  width: 80%;
  max-width: 220px;
  height: auto;
  max-height: 60px;
  object-fit: contain;
  border-radius: var(--radius-sm);
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
  color: var(--color-foreground);
  margin-bottom: 0.5rem;
}

.login-header p {
  color: var(--color-muted-foreground);
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
  color: var(--color-foreground);
  font-size: 0.875rem;
}

.form-group input[type="email"],
.form-group input[type="password"] {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-input);
  color: var(--color-foreground);
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-ring);
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
  color: var(--color-foreground);
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.login-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin-bottom: 0.5rem;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}

.btn-primary:hover {
  background: var(--color-primary);
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-md);
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
  border-radius: var(--radius-md);
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