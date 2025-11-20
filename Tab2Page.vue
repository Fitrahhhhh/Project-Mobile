<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Manajemen Produk</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout" color="danger">
            <ion-icon slot="icon-only" :icon="logOut"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- User Info -->
      <ion-card color="light" v-if="user">
        <ion-card-content class="ion-text-center">
          <ion-text color="primary">
            <h3>Halo, {{ user.username }}! 👋</h3>
          </ion-text>
          <p>Selamat datang di sistem manajemen produk</p>
        </ion-card-content>
      </ion-card>

      <!-- Tombol Tambah Data -->
      <ion-button expand="block" color="primary" @click="bukaFormTambah" class="ion-margin-bottom">
        <ion-icon slot="start" :icon="add"></ion-icon>
        Tambah Produk Baru
      </ion-button>

      <!-- Loading State -->
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
        <p>Memuat data produk...</p>
      </div>

      <!-- List Produk -->
      <ion-list>
        <ion-item-sliding v-for="produk in produkList" :key="produk.id">
          <ion-item>
            <ion-label>
              <h2>{{ produk.nama }}</h2>
              <p>💰 Harga: Rp {{ formatCurrency(produk.harga) }}</p>
              <p>📦 Stok: {{ produk.stok }} unit</p>
              <p>
                <small>
                  <ion-text color="medium">
                    ID: {{ produk.id }} • Dibuat: {{ formatDate(produk.created_at) }}
                  </ion-text>
                </small>
              </p>
            </ion-label>
            <ion-badge :color="produk.stok > 0 ? 'success' : 'danger'" slot="end">
              {{ produk.stok > 0 ? 'Tersedia' : 'Habis' }}
            </ion-badge>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option color="warning" @click="bukaFormEdit(produk)">
              <ion-icon slot="icon-only" :icon="pencil"></ion-icon>
              Edit
            </ion-item-option>
            <ion-item-option color="danger" @click="hapusProduk(produk.id)">
              <ion-icon slot="icon-only" :icon="trash"></ion-icon>
              Hapus
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <!-- Empty State -->
      <div v-if="!loading && produkList.length === 0" class="ion-text-center ion-padding">
        <ion-icon :icon="cube" size="large" color="medium"></ion-icon>
        <h3>Belum ada produk</h3>
        <p>Tambahkan produk pertama Anda dengan menekan tombol di atas</p>
      </div>

      <!-- Modal Form Tambah/Edit -->
      <ion-modal :is-open="showModal" @didDismiss="tutupModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ isEditMode ? 'Edit Produk' : 'Tambah Produk' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="tutupModal">Tutup</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <form @submit.prevent="simpanProduk">
            <ion-list>
              <ion-item>
                <ion-label position="stacked">Nama Produk <span class="required">*</span></ion-label>
                <ion-input 
                  v-model="formData.nama" 
                  placeholder="Contoh: Laptop ASUS ROG"
                  :class="{ 'ion-invalid': submitted && !formData.nama }"
                ></ion-input>
                <ion-note slot="error" v-if="submitted && !formData.nama">
                  Nama produk harus diisi
                </ion-note>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Harga (Rp) <span class="required">*</span></ion-label>
                <ion-input 
                  v-model="formData.harga" 
                  type="number" 
                  placeholder="Contoh: 8500000"
                  :class="{ 'ion-invalid': submitted && !formData.harga }"
                ></ion-input>
                <ion-note slot="error" v-if="submitted && !formData.harga">
                  Harga harus diisi
                </ion-note>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Stok <span class="required">*</span></ion-label>
                <ion-input 
                  v-model="formData.stok" 
                  type="number" 
                  placeholder="Contoh: 10"
                  :class="{ 'ion-invalid': submitted && !formData.stok }"
                ></ion-input>
                <ion-note slot="error" v-if="submitted && !formData.stok">
                  Stok harus diisi
                </ion-note>
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
              type="submit" 
              :disabled="loadingForm" 
              class="ion-margin-top"
            >
              <ion-spinner v-if="loadingForm" class="ion-margin-end"></ion-spinner>
              {{ isEditMode ? 'Update Produk' : 'Simpan Produk' }}
            </ion-button>
          </form>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButton, IonList, IonItem, IonLabel, IonInput, 
  IonSpinner, IonIcon, IonButtons, IonModal, IonNote,
  IonCard, IonCardContent, IonText, IonBadge,
  IonItemSliding, IonItemOptions, IonItemOption
} from '@ionic/vue';
import { add, pencil, trash, logOut, cube } from 'ionicons/icons';

interface Produk {
  id: number;
  nama: string;
  harga: number;
  stok: number;
  created_at?: string;
}

interface User {
  username: string;
}

const produkList = ref<Produk[]>([]);
const user = ref<User | null>(null);
const loading = ref(false);
const loadingForm = ref(false);
const showModal = ref(false);
const isEditMode = ref(false);
const submitted = ref(false);
const errorMessage = ref('');

const formData = reactive({
  id: 0,
  nama: '',
  harga: '',
  stok: ''
});

// Cek login status
const checkAuth = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userData = localStorage.getItem('user');
  
  if (!isLoggedIn || !userData) {
    window.location.href = '/tabs/tab1';
    return;
  }
  
  user.value = JSON.parse(userData);
};

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID').format(value);
};

// Format date
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID');
};

// Load data produk
const loadProduk = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:3000/data');
    if (!response.ok) throw new Error('Network response was not ok');
    produkList.value = await response.json();
  } catch (error) {
    console.error('Error loading produk:', error);
    errorMessage.value = 'Gagal memuat data produk. Periksa koneksi server.';
  } finally {
    loading.value = false;
  }
};

// Buka form tambah
const bukaFormTambah = () => {
  isEditMode.value = false;
  resetForm();
  showModal.value = true;
};

// Buka form edit
const bukaFormEdit = (produk: Produk) => {
  isEditMode.value = true;
  formData.id = produk.id;
  formData.nama = produk.nama;
  formData.harga = produk.harga.toString();
  formData.stok = produk.stok.toString();
  showModal.value = true;
};

// Tutup modal
const tutupModal = () => {
  showModal.value = false;
  resetForm();
};

// Reset form
const resetForm = () => {
  formData.id = 0;
  formData.nama = '';
  formData.harga = '';
  formData.stok = '';
  submitted.value = false;
  errorMessage.value = '';
};

// Validasi form
const validateForm = () => {
  submitted.value = true;
  
  if (!formData.nama.trim() || !formData.harga || !formData.stok) {
    errorMessage.value = 'Semua field harus diisi';
    return false;
  }
  
  if (parseFloat(formData.harga) <= 0) {
    errorMessage.value = 'Harga harus lebih dari 0';
    return false;
  }
  
  if (parseInt(formData.stok) < 0) {
    errorMessage.value = 'Stok tidak boleh negatif';
    return false;
  }
  
  return true;
};

// Simpan produk (tambah/edit)
const simpanProduk = async () => {
  if (!validateForm()) return;

  loadingForm.value = true;
  errorMessage.value = '';

  try {
    const url = isEditMode.value 
      ? `http://localhost:3000/edit/${formData.id}`
      : 'http://localhost:3000/tambah';
    
    const method = isEditMode.value ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nama: formData.nama.trim(),
        harga: parseFloat(formData.harga),
        stok: parseInt(formData.stok)
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert(`Produk berhasil ${isEditMode.value ? 'diupdate' : 'ditambahkan'}!`);
      tutupModal();
      loadProduk();
    } else {
      errorMessage.value = result.message || `Gagal ${isEditMode.value ? 'mengupdate' : 'menambah'} produk`;
    }
  } catch (error) {
    console.error('Error saving produk:', error);
    errorMessage.value = 'Terjadi kesalahan. Periksa koneksi server.';
  } finally {
    loadingForm.value = false;
  }
};

// Hapus produk
const hapusProduk = async (id: number) => {
  if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

  try {
    const response = await fetch(`http://localhost:8100/hapus/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    
    if (result.success) {
      alert('Produk berhasil dihapus!');
      loadProduk();
    } else {
      alert(result.message || 'Gagal menghapus produk');
    }
  } catch (error) {
    console.error('Error deleting produk:', error);
    alert('Terjadi kesalahan saat menghapus produk');
  }
};

// Logout
const handleLogout = () => {
  if (confirm('Apakah Anda yakin ingin logout?')) {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.href = '/tabs/tab1';
  }
};

onMounted(() => {
  checkAuth();
  loadProduk();
});
</script>

<style scoped>
.required {
  color: var(--ion-color-danger);
}

.error-message {
  margin: 16px 0;
  padding: 12px;
  background: rgba(var(--ion-color-danger-rgb), 0.1);
  border-radius: 8px;
  border-left: 4px solid var(--ion-color-danger);
}

ion-item-sliding {
  margin-bottom: 8px;
}

ion-badge {
  margin-left: 8px;
}
</style>