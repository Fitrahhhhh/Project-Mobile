<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding" color="light">
      <div class="login-container">
        <div class="ion-text-center ion-padding-vertical">
          <ion-icon :icon="lockClosed" size="large" color="primary"></ion-icon>
          <h1>Welcome</h1>
          <p>Silakan login untuk melanjutkan</p>
        </div>

        <form @submit.prevent="handleLogin">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Username</ion-label>
              <ion-input 
                v-model="formData.username" 
                placeholder="Masukkan username"
                :disabled="loading"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Password</ion-label>
              <ion-input 
                v-model="formData.password" 
                type="password" 
                placeholder="Masukkan password"
                :disabled="loading"
              ></ion-input>
            </ion-item>
          </ion-list>

          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message ion-text-center">
            <ion-text color="danger">
              <small>{{ errorMessage }}</small>
            </ion-text>
          </div>

          <ion-button 
            expand="block" 
            size="large" 
            class="ion-margin-top" 
            @click="handleLogin" 
            :disabled="loading"
          >
            <ion-spinner v-if="loading" class="ion-margin-end"></ion-spinner>
            {{ loading ? 'Loading...' : 'Login' }}
          </ion-button>

          <div class="ion-text-center ion-margin-top">
            <ion-text color="medium">
              <small>Demo: admin / 123456</small>
            </ion-text>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonItem, IonLabel, IonInput, IonButton, IonList, 
  IonSpinner, IonIcon, IonText 
} from '@ionic/vue';
import { lockClosed } from 'ionicons/icons';

const formData = reactive({
  username: '',
  password: ''
});

const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  // Reset error message
  errorMessage.value = '';
  
  // Validation
  if (!formData.username || !formData.password) {
    errorMessage.value = 'Username dan password harus diisi';
    return;
  }

  loading.value = true;

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: formData.username.trim(),
        password: formData.password
      })
    });

    const result = await response.json();

    if (result.success) {

      // ➕ SIMPAN TOKEN KE LOCALSTORAGE (TAMBAHAN)
      localStorage.setItem('token', result.token);

      // Simpan data login
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(result.user));
      
      // Redirect ke tab2 (CRUD)
      window.location.href = '/tabs/tab2';
      
    } else {
      errorMessage.value = result.message || 'Login gagal';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = 'Terjadi kesalahan. Periksa koneksi server.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding-top: 30%;
}

.error-message {
  margin: 16px 0;
  padding: 12px;
  background: rgba(var(--ion-color-danger-rgb), 0.1);
  border-radius: 8px;
  border-left: 4px solid var(--ion-color-danger);
}

ion-item {
  --background: transparent;
  margin-bottom: 16px;
}
</style>
