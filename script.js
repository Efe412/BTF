// Elementler
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const mainContent = document.querySelector('main');
const logoutBtn = document.getElementById('logout-btn');

const forgotPasswordLink = document.getElementById("forgot-password");
const forgotPasswordMessage = document.getElementById("forgot-password-message");
const backToLoginLink = document.getElementById("back-to-login");

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');

const showRegisterLink = document.getElementById('show-register');
const backToLoginFromRegister = document.getElementById('back-to-login-from-register');

let errorTimeouts = {};
let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [
  // Creator hesabı - en üst yetki
  {
    discordName: '0vexa.',
    password: 'efe_090102',
    kayitTarihi: new Date().toISOString(),
    markaModel: 'Creator Account',
    isAdmin: true,
    isCreator: true
  },
  // Yeni admin hesabı
  {
    discordName: 'dusuncesizgokturk',
    password: '102030',
    kayitTarihi: new Date().toISOString(),
    markaModel: 'Admin Account',
    isAdmin: true,
    isCreator: false
  }
];
let kayitlar = JSON.parse(localStorage.getItem('kayitlar')) || [];

// Telsiz sistemi değişkenleri
let radioMessages = JSON.parse(localStorage.getItem('radioMessages')) || [];
let onlineUsers = JSON.parse(localStorage.getItem('onlineUsers')) || [];
let radioSoundsEnabled = localStorage.getItem('radioSounds') !== 'false';
let sharedClips = JSON.parse(localStorage.getItem('sharedClips')) || [];

// Gelişmiş cihaz bilgilerini al
function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceInfo = 'Bilinmiyor';

  if (/iPhone/.test(ua)) {
    const match = ua.match(/iPhone OS (\d+_\d+)/);
    deviceInfo = `iPhone (iOS ${match ? match[1].replace('_', '.') : 'Bilinmiyor'})`;
  } else if (/iPad/.test(ua)) {
    deviceInfo = 'iPad';
  } else if (/Android/.test(ua)) {
    const androidMatch = ua.match(/Android (\d+\.?\d*)/);
    const modelMatch = ua.match(/;\s*(.+?)\s+Build/) || ua.match(/;\s*(.+?)(?:\)|;)/);
    const androidVersion = androidMatch ? androidMatch[1] : 'Bilinmiyor';
    const model = modelMatch ? modelMatch[1].trim() : 'Bilinmiyor';
    deviceInfo = `${model} (Android ${androidVersion})`;
  } else if (/Windows/.test(ua)) {
    deviceInfo = 'Windows PC';
  } else if (/Mac/.test(ua)) {
    deviceInfo = 'Mac';
  } else if (/Linux/.test(ua)) {
    deviceInfo = 'Linux';
  }

  return deviceInfo;
}

// Tarayıcı bilgilerini al
function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = 'Bilinmiyor';
  
  if (/Chrome/.test(ua) && !/Edge/.test(ua) && !/OPR/.test(ua)) {
    browser = 'Google Chrome';
  } else if (/Firefox/.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari';
  } else if (/Edge/.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/OPR/.test(ua)) {
    browser = 'Opera';
  }
  
  return browser;
}

// IP adresini tahmin et (basit yöntem)
function getEstimatedIP() {
  // Client-side gerçek IP alamayız ama tahmini bilgi verebiliriz
  return 'Gizli (Güvenlik)';
}

// Kullanıcı rolünü belirle
function getUserRole(username) {
  const userData = registeredUsers.find(user => user.discordName === username);
  if (userData?.isCreator) {
    return '👑 Creator';
  }
  if (userData?.isAdmin) {
    return '⚡ Admin';
  }
  return '👤 Üye';
}

// Gelişmiş kullanıcı bilgilerini oluştur
function getAdvancedUserInfo(username) {
  const userData = registeredUsers.find(user => user.discordName === username);
  const deviceInfo = getDeviceInfo();
  const browserInfo = getBrowserInfo();
  const estimatedIP = getEstimatedIP();
  const userRole = getUserRole(username);
  const joinDate = userData ? new Date(userData.kayitTarihi).toLocaleDateString('tr-TR') : 'Bilinmiyor';
  
  return {
    username,
    deviceInfo,
    browserInfo,
    estimatedIP,
    userRole,
    joinDate,
    isAdmin: username === '0vexa.' || username === '0vexa.efe_090102'
  };
}

// Ziyaretçi bilgilerini kaydet (giriş yapmadan)
function saveZiyaretci() {
  const now = new Date();
  const ziyaret = {
    id: Date.now() + Math.random(),
    markaModel: getDeviceInfo(),
    action: 'ziyaret',
    tarih: now.toLocaleDateString('tr-TR'),
    saat: now.toLocaleTimeString('tr-TR'),
    ip: 'Gizli', // IP bilgisi client-side alınamaz
    userAgent: navigator.userAgent
  };

  kayitlar.push(ziyaret);
  localStorage.setItem('kayitlar', JSON.stringify(kayitlar));

  // Kayıtlar klasörüne yaz
  updateKayitlarFolder();

  // kayitlar.txt dosyasına yaz
  writeToKayitlarTxt(ziyaret);

  console.log('📁 Ziyaretçi kaydedildi:', ziyaret);
}

// Kayıt bilgilerini kaydet
function saveKayit(discordName, password, action) {
  const now = new Date();
  const kayit = {
    id: Date.now() + Math.random(),
    discordName: discordName,
    password: password,
    markaModel: getDeviceInfo(),
    action: action, // 'giris' veya 'cikis'
    tarih: now.toLocaleDateString('tr-TR'),
    saat: now.toLocaleTimeString('tr-TR')
  };

  kayitlar.push(kayit);
  localStorage.setItem('kayitlar', JSON.stringify(kayitlar));

  // Kayıtlar klasörüne yaz
  updateKayitlarFolder();

  // kayitlar.txt dosyasına yaz
  writeToKayitlarTxt(kayit);

  console.log('📁 Yeni kayıt eklendi:', kayit);
}

// kayitlar.txt dosyasına yazma fonksiyonu
function writeToKayitlarTxt(kayit) {
  const kayitSatiri = `${kayit.tarih} ${kayit.saat} - ${kayit.discordName || 'Ziyaretçi'} - ${kayit.markaModel} - ${kayit.action.toUpperCase()}\n`;

  // LocalStorage'dan mevcut içeriği al
  let mevcutIcerik = localStorage.getItem('kayitlar-txt') || '';
  mevcutIcerik += kayitSatiri;

  // LocalStorage'a kaydet
  localStorage.setItem('kayitlar-txt', mevcutIcerik);

  // Konsola yazdır
  console.log('📝 kayitlar.txt güncellendi:', kayitSatiri.trim());

  // Dosya indirme linki oluştur (tarayıcı kısıtlaması nedeniyle)
  downloadKayitlarTxt(mevcutIcerik);
}

// Kayıtlar klasörünü güncelle
function updateKayitlarFolder() {
  const kayitlarText = kayitlar.map(kayit => {
    return `${kayit.tarih} ${kayit.saat} - ${kayit.discordName} - ${kayit.markaModel} - ${kayit.action.toUpperCase()}`;
  }).join('\n');

  // localStorage'a detaylı kayıt
  const detayliKayitlar = {
    tumKayitlar: kayitlar,
    toplamKayit: kayitlar.length,
    sonGuncelleme: new Date().toISOString(),
    kayitlarMetin: kayitlarText
  };

  localStorage.setItem('kayitlar-klasoru', JSON.stringify(detayliKayitlar));

  // Konsola yazdır
  console.log('📁 Kayıtlar Klasörü Güncellendi:');
  console.log(kayitlarText);
}

// Gelişmiş bildirim sistemi
function showEmbedMessage(message, type = 'error', duration = 5000) {
  // Eski mesajları temizle
  const existingMessages = document.querySelectorAll('.modern-notification');
  existingMessages.forEach(msg => {
    msg.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => msg.remove(), 300);
  });

  const notification = document.createElement('div');
  notification.className = `modern-notification notification-${type}`;

  const iconMap = {
    success: '🎉',
    error: '🚫',
    warning: '⚠️',
    info: 'ℹ️',
    welcome: '👋',
    menu: '📂',
    navigation: '🧭'
  };

  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${iconMap[type] || '📢'}</div>
      <div class="notification-body">
        <div class="notification-message">${message}</div>
        <div class="notification-progress" style="animation-duration: ${duration}ms;"></div>
      </div>
      <button class="notification-close" onclick="closeNotification(this)">✕</button>
    </div>
  `;

  // CSS stilleri ekle
  if (!document.getElementById('modern-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'modern-notification-styles';
    style.textContent = `
      .modern-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
        min-width: 320px;
        max-width: 420px;
        border-radius: 16px;
        backdrop-filter: blur(20px);
        box-shadow: 
          0 8px 32px rgba(0,0,0,0.2),
          0 2px 8px rgba(0,0,0,0.1),
          inset 0 1px 0 rgba(255,255,255,0.1);
        animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: 'Montserrat', sans-serif;
        border: 1px solid rgba(255,255,255,0.1);
        overflow: hidden;
      }

      .notification-success {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.95), rgba(56, 142, 60, 0.95));
        border-left: 4px solid #4caf50;
      }

      .notification-error {
        background: linear-gradient(135deg, rgba(244, 67, 54, 0.95), rgba(211, 47, 47, 0.95));
        border-left: 4px solid #f44336;
      }

      .notification-warning {
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.95), rgba(245, 124, 0, 0.95));
        border-left: 4px solid #ff9800;
      }

      .notification-info {
        background: linear-gradient(135deg, rgba(33, 150, 243, 0.95), rgba(25, 118, 210, 0.95));
        border-left: 4px solid #2196f3;
      }

      .notification-content {
        display: flex;
        align-items: flex-start;
        padding: 16px 20px;
        gap: 12px;
        color: white;
      }

      .notification-icon {
        font-size: 24px;
        line-height: 1;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }

      .notification-body {
        flex: 1;
        min-width: 0;
      }

      .notification-message {
        font-weight: 600;
        font-size: 14px;
        line-height: 1.4;
        margin-bottom: 8px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      }

      .notification-progress {
        height: 3px;
        background: rgba(255,255,255,0.3);
        border-radius: 2px;
        overflow: hidden;
        position: relative;
      }

      .notification-progress::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background: rgba(255,255,255,0.8);
        border-radius: 2px;
        animation: progressBar 5s linear forwards;
        transform: translateX(-100%);
      }

      .notification-close {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .notification-close:hover {
        background: rgba(255,255,255,0.3);
        transform: scale(1.1);
      }

      @keyframes slideInRight {
        from {
          transform: translateX(100%) scale(0.9);
          opacity: 0;
        }
        to {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
      }

      @keyframes slideOutRight {
        from {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
        to {
          transform: translateX(100%) scale(0.9);
          opacity: 0;
        }
      }

      @keyframes progressBar {
        from {
          transform: translateX(-100%);
        }
        to {
          transform: translateX(0);
        }
      }

      @media (max-width: 500px) {
        .modern-notification {
          right: 10px;
          left: 10px;
          min-width: auto;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // 5 saniye sonra otomatik kapat
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Bildirim kapatma fonksiyonu
function closeNotification(button) {
  const notification = button.closest('.modern-notification');
  notification.style.animation = 'slideOutRight 0.3s ease-out';
  setTimeout(() => notification.remove(), 300);
}

// Profil modalını aç
function openProfileModal() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  if (!currentUser) {
    showEmbedMessage('Önce giriş yapmalısınız!', 'error');
    return;
  }

  const userData = registeredUsers.find(user => user.discordName === currentUser);
  if (!userData) return;

  const profileModal = document.createElement('div');
  profileModal.id = 'profile-modal';
  profileModal.className = 'modal';
  profileModal.style.display = 'flex';

  const savedProfileImage = localStorage.getItem(`profile-image-${currentUser}`) || 'https://cdn.discordapp.com/embed/avatars/0.png';
  const savedCoverImage = localStorage.getItem(`cover-image-${currentUser}`) || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop';

  profileModal.innerHTML = `
    <div class="modal-content profile-modal-content">
      <div class="profile-header">
        <div class="cover-photo" style="background-image: url('${savedCoverImage}')">
          <div class="cover-overlay">
            <button class="edit-cover-btn" onclick="changeCoverPhoto()">📷 Kapak Değiştir</button>
          </div>
        </div>
        <div class="profile-picture-container">
          <img class="profile-picture" src="${savedProfileImage}" alt="Profil">
          <div class="profile-edit-overlay" onclick="changeProfilePhoto()">
            <span class="edit-icon">✏️</span>
          </div>
        </div>
      </div>

      <div class="profile-info">
        <h3 class="profile-name">${userData.discordName}</h3>
        <p class="profile-join-date">Katılım: ${new Date(userData.kayitTarihi).toLocaleDateString('tr-TR')}</p>
        <p class="profile-device">Cihaz: ${userData.markaModel}</p>
      </div>

      <div class="profile-actions">
        <button class="profile-action-btn" onclick="changeUsername()">
          👤 İsim Değiştir
        </button>
        <button class="profile-action-btn" onclick="changePassword()">
          🔐 Şifre Değiştir
        </button>
        <button class="profile-action-btn" onclick="openAppsModal()">
          📱 Uygulamalar
        </button>
        <button class="profile-action-btn" onclick="viewUserStats()">
          📊 İstatistiklerim
        </button>
        <button class="profile-action-btn" onclick="exportUserData()">
          💾 Verilerimi İndir
        </button>
        <button class="profile-action-btn" onclick="deleteAccount()">
          🗑️ Hesabı Sil
        </button>
      </div>

      <button class="modal-close-btn" onclick="closeProfileModal()">✕</button>
    </div>
  `;

  document.body.appendChild(profileModal);
  mainContent.classList.add('blur');
}

// Profil modalını kapat
function closeProfileModal() {
  const profileModal = document.getElementById('profile-modal');
  if (profileModal) {
    profileModal.remove();
    mainContent.classList.remove('blur');
  }
}

// Log fonksiyonları
function writeLog(category, logData) {
  const timestamp = new Date();
  const logEntry = {
    kullanici: localStorage.getItem('yuksek-idare-user'),
    islem: logData.islem,
    detay: logData.detay,
    tarih: timestamp.toLocaleDateString('tr-TR'),
    saat: timestamp.toLocaleTimeString('tr-TR'),
    timestamp: timestamp.toISOString()
  };

  // LocalStorage'dan mevcut logları al
  const existingLogs = JSON.parse(localStorage.getItem(`${category}-logs`) || '[]');
  existingLogs.push(logEntry);
  localStorage.setItem(`${category}-logs`, JSON.stringify(existingLogs));

  // Dosya formatında log oluştur
  const logText = `Kullanıcı: ${logEntry.kullanici}\nİşlem: ${logEntry.islem}\n${logEntry.detay ? logEntry.detay + '\n' : ''}Tarih: ${logEntry.tarih} ${logEntry.saat}\n${'='.repeat(50)}\n`;

  const existingLogText = localStorage.getItem(`${category}-log-text`) || '';
  localStorage.setItem(`${category}-log-text`, existingLogText + logText);

  console.log(`📝 ${category} log kaydedildi:`, logEntry);
}

// Profil fotoğrafı değiştir - önizlemeli
function changeProfilePhoto() {
  openPhotoPreviewModal('profile');
}

// Fotoğraf önizleme modalı
function openPhotoPreviewModal(type) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.style.zIndex = '10000';
  
  const title = type === 'profile' ? '👤 Profil Fotoğrafı Önizleme' : 
                type === 'banner' ? '🖼️ Banner Önizleme' : '🎨 Panel Arka Plan Önizleme';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px; background: linear-gradient(135deg, #1f1f1f, #2a2a2a);">
      <h3 style="color: #fff; text-align: center; margin-bottom: 25px;">${title}</h3>
      
      <div class="preview-section" style="margin-bottom: 30px;">
        <h4 style="color: #ffd700; margin-bottom: 15px;">📷 Mevcut Görsel</h4>
        <div class="current-preview" id="current-preview" style="text-align: center; margin-bottom: 20px;"></div>
        
        <h4 style="color: #4caf50; margin-bottom: 15px;">🔄 Yeni Görsel Önizleme</h4>
        <div class="new-preview" id="new-preview" style="text-align: center; margin-bottom: 20px; min-height: 100px; border: 2px dashed rgba(255,255,255,0.3); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #aaa;">
          Henüz görsel seçilmedi
        </div>
      </div>
      
      <div style="display: flex; gap: 15px; margin-bottom: 20px;">
        <button onclick="selectImageFile('${type}')" style="flex: 1; background: linear-gradient(135deg, #4caf50, #388e3c); border: none; color: white; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          📁 Görsel Seç
        </button>
        <button onclick="applyPreviewImage('${type}')" id="apply-btn" disabled style="flex: 1; background: linear-gradient(135deg, #666, #555); border: none; color: white; padding: 12px; border-radius: 8px; font-weight: 600; cursor: not-allowed;">
          ✅ Uygula
        </button>
      </div>
      
      <div style="display: flex; gap: 15px;">
        <button onclick="closePhotoPreviewModal()" style="flex: 1; background: linear-gradient(135deg, #e74c3c, #c0392b); border: none; color: white; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          ❌ İptal
        </button>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: rgba(79,195,247,0.1); border-left: 4px solid #4fc3f7; border-radius: 8px;">
        <h4 style="color: #4fc3f7; margin: 0 0 10px 0; font-size: 14px;">💡 Bilgi:</h4>
        <ul style="color: #fff; font-size: 12px; margin: 0; padding-left: 20px;">
          <li>Profil fotoğrafı: Çember şeklinde görünür</li>
          <li>Banner: Üst kısımda dikdörtgen şekilde görünür</li>
          <li>Panel arka plan: Sol menü arka planını değiştirir</li>
          <li>Maksimum dosya boyutu: 10MB</li>
        </ul>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  mainContent.classList.add('blur');
  
  // Mevcut görseli göster
  showCurrentImage(type);
}

// Mevcut görseli göster
function showCurrentImage(type) {
  const currentPreview = document.getElementById('current-preview');
  const currentUser = localStorage.getItem('yuksek-idare-user');
  
  if (type === 'profile') {
    const savedImage = localStorage.getItem(`profile-image-${currentUser}`) || 'https://cdn.discordapp.com/embed/avatars/0.png';
    currentPreview.innerHTML = `<img src="${savedImage}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #667eea;">`;
  } else if (type === 'banner') {
    const savedBanner = localStorage.getItem(`cover-image-${currentUser}`) || 'https://cdn.static.pikoya.com/robloxgo/games/10087093881/thumbnail_3';
    currentPreview.innerHTML = `<img src="${savedBanner}" style="width: 300px; height: 120px; border-radius: 10px; object-fit: cover; border: 2px solid #667eea;">`;
  } else if (type === 'panel') {
    const savedPanel = localStorage.getItem('panel-background') || 'Varsayılan gradyan';
    if (savedPanel === 'Varsayılan gradyan') {
      currentPreview.innerHTML = `<div style="width: 200px; height: 100px; background: linear-gradient(180deg, rgba(26, 26, 46, 0.98), rgba(15, 52, 96, 0.98)); border-radius: 10px; border: 2px solid #667eea; display: flex; align-items: center; justify-content: center; color: white;">Varsayılan</div>`;
    } else {
      currentPreview.innerHTML = `<img src="${savedPanel}" style="width: 200px; height: 100px; border-radius: 10px; object-fit: cover; border: 2px solid #667eea;">`;
    }
  }
}

// Görsel dosyası seç
function selectImageFile(type) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,image/gif';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showEmbedMessage('Dosya boyutu 10MB\'dan büyük olamaz!', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        showImagePreview(e.target.result, type);
        
        // Uygula butonunu aktif et
        const applyBtn = document.getElementById('apply-btn');
        applyBtn.disabled = false;
        applyBtn.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
        applyBtn.style.cursor = 'pointer';
        
        // Global değişkende sakla
        window.previewImageData = e.target.result;
        window.previewImageFile = file;
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

// Görsel önizlemesini göster
function showImagePreview(imageSrc, type) {
  const newPreview = document.getElementById('new-preview');
  
  if (type === 'profile') {
    newPreview.innerHTML = `<img src="${imageSrc}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #4caf50;">`;
  } else if (type === 'banner') {
    newPreview.innerHTML = `<img src="${imageSrc}" style="width: 300px; height: 120px; border-radius: 10px; object-fit: cover; border: 2px solid #4caf50;">`;
  } else if (type === 'panel') {
    newPreview.innerHTML = `<img src="${imageSrc}" style="width: 200px; height: 100px; border-radius: 10px; object-fit: cover; border: 2px solid #4caf50;">`;
  }
}

// Önizleme görselini uygula
function applyPreviewImage(type) {
  if (!window.previewImageData) return;
  
  const currentUser = localStorage.getItem('yuksek-idare-user');
  
  if (type === 'profile') {
    localStorage.setItem(`profile-image-${currentUser}`, window.previewImageData);
    
    const profilePicture = document.querySelector('.profile-picture');
    if (profilePicture) {
      profilePicture.src = window.previewImageData;
    }
    
    updateUserPanel();
    showEmbedMessage('Profil fotoğrafı güncellendi!', 'success');
    
  } else if (type === 'banner') {
    localStorage.setItem(`cover-image-${currentUser}`, window.previewImageData);
    
    const coverPhoto = document.querySelector('.cover-photo');
    if (coverPhoto) {
      coverPhoto.style.backgroundImage = `url('${window.previewImageData}')`;
    }
    
    showEmbedMessage('Kapak fotoğrafı güncellendi!', 'success');
    
  } else if (type === 'panel') {
    localStorage.setItem('panel-background', window.previewImageData);
    
    const panel = document.getElementById('modern-panel');
    if (panel) {
      panel.style.backgroundImage = `linear-gradient(rgba(26,26,46,0.8), rgba(22,33,62,0.8), rgba(15,52,96,0.8)), url('${window.previewImageData}')`;
      panel.style.backgroundSize = 'cover';
      panel.style.backgroundPosition = 'center';
    }
    
    showEmbedMessage('Panel arka planı güncellendi!', 'success');
  }
  
  // Log kaydı
  writeLog('GörselDegisiklikler', {
    islem: `${type} görseli değiştirildi`,
    detay: `Dosya: ${window.previewImageFile.name} (${window.previewImageFile.size} bytes)`
  });
  
  closePhotoPreviewModal();
}

// Fotoğraf önizleme modalını kapat
function closePhotoPreviewModal() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove();
    mainContent.classList.remove('blur');
  }
  // Global değişkenleri temizle
  window.previewImageData = null;
  window.previewImageFile = null;
}

// Kapak fotoğrafı değiştir
function changeCoverPhoto() {
  openBannerSelector();
}

// Banner seçici aç
function openBannerSelector() {
  const bannerModal = document.getElementById('banner-selector-modal');
  if (bannerModal) {
    bannerModal.style.display = 'flex';
  }
}

// Banner seçici kapat
function closeBannerSelector() {
  const bannerModal = document.getElementById('banner-selector-modal');
  if (bannerModal) {
    bannerModal.style.display = 'none';
  }
}

// Özel banner yükle
function uploadCustomBanner() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,image/gif';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const currentUser = localStorage.getItem('yuksek-idare-user');
        localStorage.setItem(`cover-image-${currentUser}`, e.target.result);

        const coverPhoto = document.querySelector('.cover-photo');
        if (coverPhoto) {
          coverPhoto.style.backgroundImage = `url('${e.target.result}')`;
        }

        // Log kaydı
        writeLog('ProfilBanner', {
          islem: 'Özel kapak fotoğrafı yüklendi',
          detay: `Dosya: ${file.name} (${file.size} bytes)`
        });

        showEmbedMessage('Kapak fotoğrafı güncellendi!', 'success');
        closeBannerSelector();
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

// Hazır banner seç
function selectBanner(bannerUrl) {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  localStorage.setItem(`cover-image-${currentUser}`, bannerUrl);

  const coverPhoto = document.querySelector('.cover-photo');
  if (coverPhoto) {
    coverPhoto.style.backgroundImage = `url('${bannerUrl}')`;
  }

  // Log kaydı
  writeLog('ProfilBanner', {
    islem: 'Hazır kapak fotoğrafı seçildi',
    detay: `Banner URL: ${bannerUrl}`
  });

  showEmbedMessage('Kapak fotoğrafı güncellendi!', 'success');
  closeBannerSelector();
}

// Gelişmiş kullanıcı adı değiştirme sistemi
function changeUsername() {
  openAdvancedUsernameModal();
}

// Gelişmiş şifre değiştirme sistemi
function changePassword() {
  openAdvancedPasswordModal();
}

// Gelişmiş kullanıcı adı değiştirme modalı
function openAdvancedUsernameModal() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.style.zIndex = '9999';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px; background: linear-gradient(135deg, #1f1f1f, #2a2a2a);">
      <h3 style="color: #fff; text-align: center; margin-bottom: 25px;">👤 Kullanıcı Adı Değiştir</h3>
      
      <div style="margin-bottom: 20px;">
        <label style="color: #fff; font-weight: 600; display: block; margin-bottom: 8px;">Mevcut Kullanıcı Adı:</label>
        <input type="text" value="${currentUser}" disabled style="background: #333; color: #aaa; cursor: not-allowed;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="color: #fff; font-weight: 600; display: block; margin-bottom: 8px;">Yeni Kullanıcı Adı:</label>
        <input type="text" id="new-username-input" placeholder="Yeni kullanıcı adınızı girin..." style="background: #2a2a2a; color: #fff; border: 2px solid #667eea;">
        <div id="username-error" style="color: #ff5252; font-size: 0.8rem; margin-top: 5px; display: none;"></div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="color: #fff; font-weight: 600; display: block; margin-bottom: 8px;">Güvenlik Doğrulaması - Mevcut Şifrenizi Girin:</label>
        <input type="password" id="confirm-password-username" placeholder="Mevcut şifrenizi girin..." style="background: #2a2a2a; color: #fff; border: 2px solid #667eea;">
      </div>
      
      <div style="display: flex; gap: 15px; margin-top: 30px;">
        <button onclick="processUsernameChange()" style="flex: 1; background: linear-gradient(135deg, #4caf50, #388e3c); border: none; color: white; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          ✅ Kullanıcı Adını Değiştir
        </button>
        <button onclick="closeAdvancedUsernameModal()" style="flex: 1; background: linear-gradient(135deg, #e74c3c, #c0392b); border: none; color: white; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          ❌ İptal
        </button>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: rgba(255,215,0,0.1); border-left: 4px solid #ffd700; border-radius: 8px;">
        <h4 style="color: #ffd700; margin: 0 0 10px 0; font-size: 14px;">⚠️ Önemli Bilgilendirme:</h4>
        <ul style="color: #fff; font-size: 12px; margin: 0; padding-left: 20px;">
          <li>Kullanıcı adı değişikliği anında gerçekleşir</li>
          <li>Eski kullanıcı adınız başka kullanıcılar tarafından kullanılabilir</li>
          <li>Tüm geçmiş verileriniz yeni adınızla bağlantılı olacak</li>
          <li>Bu işlem geri alınamaz</li>
        </ul>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  mainContent.classList.add('blur');
  
  // Input focus
  setTimeout(() => {
    document.getElementById('new-username-input').focus();
  }, 100);
}

// Kullanıcı adı değişikliğini işle
function processUsernameChange() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const newUsername = document.getElementById('new-username-input').value.trim();
  const confirmPassword = document.getElementById('confirm-password-username').value;
  const errorDiv = document.getElementById('username-error');
  
  // Temizle
  errorDiv.style.display = 'none';
  
  // Validasyonlar
  if (!newUsername) {
    errorDiv.textContent = 'Yeni kullanıcı adı boş olamaz!';
    errorDiv.style.display = 'block';
    return;
  }
  
  if (newUsername.length < 3) {
    errorDiv.textContent = 'Kullanıcı adı en az 3 karakter olmalıdır!';
    errorDiv.style.display = 'block';
    return;
  }
  
  if (newUsername === currentUser) {
    errorDiv.textContent = 'Yeni kullanıcı adı mevcut adınızla aynı olamaz!';
    errorDiv.style.display = 'block';
    return;
  }
  
  // Şifre kontrolü
  const userData = registeredUsers.find(user => user.discordName === currentUser);
  if (!userData || userData.password !== confirmPassword) {
    errorDiv.textContent = 'Mevcut şifre yanlış!';
    errorDiv.style.display = 'block';
    return;
  }
  
  // Kullanıcı adı kullanımda mı?
  const existingUser = registeredUsers.find(user => user.discordName === newUsername);
  if (existingUser) {
    errorDiv.textContent = 'Bu kullanıcı adı zaten kullanımda!';
    errorDiv.style.display = 'block';
    return;
  }
  
  // İşlemi gerçekleştir
  const userIndex = registeredUsers.findIndex(user => user.discordName === currentUser);
  if (userIndex !== -1) {
    const oldUsername = registeredUsers[userIndex].discordName;
    registeredUsers[userIndex].discordName = newUsername;
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    localStorage.setItem('yuksek-idare-user', newUsername);
    
    // Log kaydı
    writeLog('KullaniciDegisiklikleri', {
      islem: 'Kullanıcı adı değiştirildi',
      detay: `Eski: ${oldUsername} → Yeni: ${newUsername}`,
      eskiAd: oldUsername,
      yeniAd: newUsername,
      degisimTarihi: new Date().toISOString()
    });
    
    // Profil modalını güncelle
    const profileName = document.querySelector('.profile-name');
    if (profileName) {
      profileName.textContent = newUsername;
    }
    
    // Panel kullanıcı bilgilerini güncelle
    updateUserPanel();
    updateModernUserPanel();
    
    closeAdvancedUsernameModal();
    showEmbedMessage(`Kullanıcı adınız "${newUsername}" olarak değiştirildi!`, 'success');
  }
}

// Kullanıcı adı modalını kapat
function closeAdvancedUsernameModal() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove();
    mainContent.classList.remove('blur');
  }
}

// Gelişmiş şifre değiştirme modalı
function openAdvancedPasswordModal() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.style.zIndex = '9999';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px; background: linear-gradient(135deg, #1f1f1f, #2a2a2a);">
      <h3 style="color: #fff; text-align: center; margin-bottom: 25px;">🔐 Şifre Değiştir</h3>
      
      <div style="margin-bottom: 20px;">
        <label style="color: #fff; font-weight: 600; display: block; margin-bottom: 8px;">Kullanıcı Adı:</label>
        <input type="text" value="${currentUser}" disabled style="background: #333; color: #aaa; cursor: not-allowed;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="color: #fff; font-weight: 600; display: block; margin-bottom: 8px;">Mevcut Şifre:</label>
        <input type="password" id="current-password-input" placeholder="Mevcut şifrenizi girin..." style="background: #2a2a2a; color: #fff; border: 2px solid #667eea;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="color: #fff; font-weight: 600; display: block; margin-bottom: 8px;">Yeni Şifre:</label>
        <input type="password" id="new-password-input" placeholder="Yeni şifrenizi girin..." style="background: #2a2a2a; color: #fff; border: 2px solid #667eea;">
        <div style="font-size: 11px; color: #aaa; margin-top: 3px;">En az 6 karakter uzunluğunda olmalıdır</div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="color: #fff; font-weight: 600; display: block; margin-bottom: 8px;">Yeni Şifre (Tekrar):</label>
        <input type="password" id="confirm-new-password-input" placeholder="Yeni şifrenizi tekrar girin..." style="background: #2a2a2a; color: #fff; border: 2px solid #667eea;">
        <div id="password-error" style="color: #ff5252; font-size: 0.8rem; margin-top: 5px; display: none;"></div>
      </div>
      
      <div style="display: flex; gap: 15px; margin-top: 30px;">
        <button onclick="processPasswordChange()" style="flex: 1; background: linear-gradient(135deg, #4caf50, #388e3c); border: none; color: white; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          🔐 Şifreyi Değiştir
        </button>
        <button onclick="closeAdvancedPasswordModal()" style="flex: 1; background: linear-gradient(135deg, #e74c3c, #c0392b); border: none; color: white; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          ❌ İptal
        </button>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: rgba(231,76,60,0.1); border-left: 4px solid #e74c3c; border-radius: 8px;">
        <h4 style="color: #e74c3c; margin: 0 0 10px 0; font-size: 14px;">🔒 Güvenlik Uyarısı:</h4>
        <ul style="color: #fff; font-size: 12px; margin: 0; padding-left: 20px;">
          <li>Güçlü bir şifre seçin (büyük-küçük harf, rakam)</li>
          <li>Şifrenizi kimseyle paylaşmayın</li>
          <li>Düzenli olarak şifrenizi değiştirin</li>
          <li>Bu değişiklik anında etkili olacaktır</li>
        </ul>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  mainContent.classList.add('blur');
  
  // Input focus
  setTimeout(() => {
    document.getElementById('current-password-input').focus();
  }, 100);
}

// Şifre değişikliğini işle
function processPasswordChange() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const currentPassword = document.getElementById('current-password-input').value;
  const newPassword = document.getElementById('new-password-input').value;
  const confirmNewPassword = document.getElementById('confirm-new-password-input').value;
  const errorDiv = document.getElementById('password-error');
  
  // Temizle
  errorDiv.style.display = 'none';
  
  // Validasyonlar
  if (!currentPassword) {
    errorDiv.textContent = 'Mevcut şifre boş olamaz!';
    errorDiv.style.display = 'block';
    return;
  }
  
  if (!newPassword) {
    errorDiv.textContent = 'Yeni şifre boş olamaz!';
    errorDiv.style.display = 'block';
    return;
  }
  
  if (newPassword.length < 6) {
    errorDiv.textContent = 'Yeni şifre en az 6 karakter olmalıdır!';
    errorDiv.style.display = 'block';
    return;
  }
  
  if (newPassword !== confirmNewPassword) {
    errorDiv.textContent = 'Yeni şifreler eşleşmiyor!';
    errorDiv.style.display = 'block';
    return;
  }
  
  if (currentPassword === newPassword) {
    errorDiv.textContent = 'Yeni şifre mevcut şifreyle aynı olamaz!';
    errorDiv.style.display = 'block';
    return;
  }
  
  // Mevcut şifre kontrolü
  const userData = registeredUsers.find(user => user.discordName === currentUser);
  if (!userData || userData.password !== currentPassword) {
    errorDiv.textContent = 'Mevcut şifre yanlış!';
    errorDiv.style.display = 'block';
    return;
  }
  
  // İşlemi gerçekleştir
  const userIndex = registeredUsers.findIndex(user => user.discordName === currentUser);
  if (userIndex !== -1) {
    registeredUsers[userIndex].password = newPassword;
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    
    // Log kaydı
    writeLog('KullaniciDegisiklikleri', {
      islem: 'Şifre değiştirildi',
      detay: `Kullanıcı: ${currentUser} şifresini güncelledi`,
      degisimTarihi: new Date().toISOString()
    });
    
    closeAdvancedPasswordModal();
    showEmbedMessage('Şifreniz başarıyla değiştirildi!', 'success');
  }
}

// Şifre modalını kapat
function closeAdvancedPasswordModal() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove();
    mainContent.classList.remove('blur');
  }
}

// Kullanıcı istatistikleri
function viewUserStats() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const userRecords = kayitlar.filter(record => record.discordName === currentUser);

  const loginCount = userRecords.filter(r => r.action === 'giris').length;
  const lastLogin = userRecords.filter(r => r.action === 'giris').slice(-1)[0];

  const statsMessage = `
    📊 Giriş Sayısı: ${loginCount}
    📅 Son Giriş: ${lastLogin ? `${lastLogin.tarih} ${lastLogin.saat}` : 'Hiç'}
    💻 Cihaz: ${userRecords[0]?.markaModel || 'Bilinmiyor'}
  `;

  showEmbedMessage(statsMessage, 'info');
}

// Kullanıcı verilerini indir
function exportUserData() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const userData = registeredUsers.find(user => user.discordName === currentUser);
  const userRecords = kayitlar.filter(record => record.discordName === currentUser);

  const exportData = {
    kullanici: userData,
    kayitlar: userRecords,
    istatistikler: {
      toplamGiris: userRecords.filter(r => r.action === 'giris').length,
      kayitTarihi: userData.kayitTarihi,
      sonGiris: userRecords.filter(r => r.action === 'giris').slice(-1)[0]
    }
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentUser}_verilerim.json`;
  a.click();

  URL.revokeObjectURL(url);
  showEmbedMessage('Verileriniz indirildi!', 'success');
}

// Ayarlar modalını aç
function openSettingsModal() {
  const settingsModal = document.createElement('div');
  settingsModal.id = 'settings-modal';
  settingsModal.className = 'modal';
  settingsModal.style.display = 'flex';

  const currentOpacity = localStorage.getItem('background-opacity') || '0.85';
  const currentFontSize = localStorage.getItem('font-size') || '16';
  const currentFont = localStorage.getItem('font-family') || 'Montserrat';

  settingsModal.innerHTML = `
    <div class="modal-content settings-modal-content">
      <h3>⚙️ Gelişmiş Ayarlar Paneli</h3>

      <div class="advanced-settings">
        <div class="setting-section">
          <h4>🖼️ Görünüm Ayarları</h4>

          <div class="settings-row">
            <div>
              <div class="setting-label">Arka Plan Şeffaflığı</div>
              <div class="setting-description">Arka planın şeffaflık seviyesini ayarlayın</div>
            </div>
            <div class="opacity-control">
              <input type="range" id="bg-opacity" min="0.3" max="1" step="0.05" value="${currentOpacity}">
              <span class="opacity-value">${Math.round(currentOpacity * 100)}%</span>
            </div>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Ana Sayfa Arka Planı Değiştir</div>
              <div class="setting-description">Sayfanın arka plan görselini değiştirin</div>
            </div>
            <button class="settings-btn" onclick="changePageBackground()" style="background: linear-gradient(135deg, #673ab7, #512da8); color: white; width: auto; padding: 8px 12px;">🖼️ Değiştir</button>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Ana Sayfa Banner Değiştir</div>
              <div class="setting-description">Üst kısımdaki banner görselini değiştirin</div>
            </div>
            <button class="settings-btn" onclick="changeHeaderBanner()" style="background: linear-gradient(135deg, #ff9800, #f57c00); color: white; width: auto; padding: 8px 12px;">🎯 Değiştir</button>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Sol Panel Arka Planı</div>
              <div class="setting-description">Sol menü panelinin arka plan görselini değiştirin</div>
            </div>
            <button class="settings-btn" onclick="changePanelBackground()" style="background: linear-gradient(135deg, #9c27b0, #7b1fa2); color: white; width: auto; padding: 8px 12px;">🎨 Değiştir</button>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Yazı Tipi</div>
              <div class="setting-description">Sayfada kullanılacak yazı tipini seçin</div>
            </div>
            <div class="font-selector">
              <button class="font-option ${currentFont === 'Montserrat' ? 'active' : ''}" onclick="changeFontFamily('Montserrat')" style="font-family: Montserrat;">Montserrat</button>
              <button class="font-option ${currentFont === 'Arial' ? 'active' : ''}" onclick="changeFontFamily('Arial')" style="font-family: Arial;">Arial</button>
              <button class="font-option ${currentFont === 'Roboto' ? 'active' : ''}" onclick="changeFontFamily('Roboto')" style="font-family: Roboto;">Roboto</button>
              <button class="font-option ${currentFont === 'Times New Roman' ? 'active' : ''}" onclick="changeFontFamily('Times New Roman')" style="font-family: Times New Roman;">Times</button>
            </div>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Yazı Boyutu</div>
              <div class="setting-description">Sayfadaki yazıların boyutunu ayarlayın</div>
            </div>
            <div class="size-control">
              <input type="range" id="font-size-slider" min="12" max="20" step="1" value="${currentFontSize}">
              <span class="size-value">${currentFontSize}px</span>
            </div>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Tema Modu</div>
              <div class="setting-description">Koyu/açık tema seçimi</div>
            </div>
            <div class="theme-buttons">
              <button class="theme-btn" onclick="setTheme('dark')">🌙 Koyu</button>
              <button class="theme-btn" onclick="setTheme('light')">☀️ Açık</button>
              <button class="theme-btn" onclick="setTheme('auto')">🔄 Otomatik</button>
            </div>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Animasyonlar</div>
              <div class="setting-description">Sayfa animasyonlarını kontrol edin</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="animations-enabled" checked>
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-section">
          <h4>🔔 Bildirim Ayarları</h4>

          <div class="settings-row">
            <div>
              <div class="setting-label">Masaüstü Bildirimleri</div>
              <div class="setting-description">Yeni mesajlar için bildirim göster</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="notifications-enabled" checked>
              <span class="slider"></span>
            </label>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Bildirim Sesleri</div>
              <div class="setting-description">Bildirimler için ses efektleri</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="notification-sounds" ${localStorage.getItem('notification-sounds') !== 'false' ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Telsiz Sesleri</div>
              <div class="setting-description">Telsiz mesajları için ses efektleri</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="radio-sounds" ${radioSoundsEnabled ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">@everyone Bildirimleri</div>
              <div class="setting-description">@everyone etiketleri için özel bildirim</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="everyone-notifications" checked>
              <span class="slider"></span>
            </label>
          </div>

          <div class="notification-preview">
            💡 Bildirim önizlemesi: Bu ayarlar gerçek zamanlı uygulanır
          </div>
        </div>

        <div class="setting-section">
          <h4>🔐 Gizlilik ve Güvenlik</h4>

          <div class="settings-row">
            <div>
              <div class="setting-label">Profil Görünürlüğü</div>
              <div class="setting-description">Profilinizi diğer kullanıcılara göster</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="profile-visibility" checked>
              <span class="slider"></span>
            </label>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Otomatik Giriş</div>
              <div class="setting-description">Tarayıcıda oturum bilgilerini sakla</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="auto-login" checked>
              <span class="slider"></span>
            </label>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Veri Şifreleme</div>
              <div class="setting-description">Yerel verileri şifreli sakla</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="data-encryption">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-section">
          <h4>⚡ Performans ve Sistem</h4>

          <div class="settings-row">
            <div>
              <div class="setting-label">Yüksek Performans Modu</div>
              <div class="setting-description">Daha hızlı yükleme için optimizasyon</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="high-performance">
              <span class="slider"></span>
            </label>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Otomatik Kaydetme</div>
              <div class="setting-description">Verilerinizi otomatik olarak kaydet</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="auto-save" checked>
              <span class="slider"></span>
            </label>
          </div>

          <div class="settings-row">
            <div>
              <div class="setting-label">Gelişmiş Önbellek</div>
              <div class="setting-description">Daha hızlı sayfa yüklemesi için</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="advanced-cache">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="settings-actions">
        <button class="settings-btn reset-btn" onclick="resetSettings()">🔄 Varsayılana Dön</button>
        <button class="settings-btn save-btn" onclick="saveSettings()">💾 Ayarları Kaydet</button>
        <button class="settings-btn" onclick="exportSettings()" style="background: linear-gradient(135deg, #9c27b0, #7b1fa2); color: white;">📤 Dışa Aktar</button>
      </div>

      <button class="modal-close-btn" onclick="closeSettingsModal()">✕</button>
    </div>
  `;

  document.body.appendChild(settingsModal);
  mainContent.classList.add('blur');

  // Event listeners
  const opacitySlider = document.getElementById('bg-opacity');
  const opacityValue = document.querySelector('.opacity-value');

  opacitySlider.addEventListener('input', (e) => {
    const value = e.target.value;
    opacityValue.textContent = Math.round(value * 100) + '%';
    updateBackgroundOpacity(value);
  });

  const fontSizeSlider = document.getElementById('font-size-slider');
  const sizeValue = document.querySelector('.size-value');

  fontSizeSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    sizeValue.textContent = value + 'px';
    changeFontSize(value);
  });
}

// Ayarlar modalını kapat
function closeSettingsModal() {
  const settingsModal = document.getElementById('settings-modal');
  if (settingsModal) {
    settingsModal.remove();
    mainContent.classList.remove('blur');
  }
}

// Arka plan şeffaflığını güncelle
function updateBackgroundOpacity(opacity) {
  document.documentElement.style.setProperty('--bg-opacity', opacity);
  const beforeElement = document.querySelector('body::before') || document.body;
  if (document.body.classList.contains('light-mode')) {
    document.body.style.setProperty('--bg-color', `rgba(240,240,240,${opacity})`);
  } else {
    document.body.style.setProperty('--bg-color', `rgba(18,18,18,${opacity})`);
  }
}

// Tema ayarla
function setTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    document.getElementById('theme-toggle').textContent = '☀️';
  } else if (theme === 'dark') {
    document.body.classList.remove('light-mode');
    document.getElementById('theme-toggle').textContent = '🌙';
  } else if (theme === 'auto') {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }
  localStorage.setItem('theme', theme);
}

// Ayarları sıfırla
function resetSettings() {
  localStorage.removeItem('background-opacity');
  localStorage.removeItem('theme');
  localStorage.removeItem('notifications-enabled');

  document.getElementById('bg-opacity').value = '0.85';
  document.querySelector('.opacity-value').textContent = '85%';
  updateBackgroundOpacity('0.85');

  showEmbedMessage('Ayarlar sıfırlandı!', 'success');
  closeSettingsModal();
}

// Ayarları kaydet
function saveSettings() {
  const opacity = document.getElementById('bg-opacity').value;
  const notificationsEnabled = document.getElementById('notifications-enabled').checked;

  localStorage.setItem('background-opacity', opacity);
  localStorage.setItem('notifications-enabled', notificationsEnabled);

  showEmbedMessage('Ayarlar kaydedildi!', 'success');
  closeSettingsModal();
}

// Kullanıcı giriş durumu kontrolü
function isLoggedIn() {
  return !!localStorage.getItem('yuksek-idare-user');
}

// Kullanıcı bilgilerini panelde güncelle
function updateUserPanel() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const userInfoPanel = document.getElementById('user-info-panel');
  const userNameDisplay = document.getElementById('user-name-display');
  const userAvatar = document.getElementById('user-avatar');

  if (currentUser && userInfoPanel && userNameDisplay && userAvatar) {
    userInfoPanel.style.display = 'flex';
    userNameDisplay.textContent = currentUser;
    userAvatar.textContent = currentUser.charAt(0).toUpperCase();
  } else if (userInfoPanel) {
    userInfoPanel.style.display = 'none';
  }
}

// Admin kontrolü
function isAdmin() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const userData = registeredUsers.find(user => user.discordName === currentUser);
  return userData?.isAdmin || userData?.isCreator;
}

// Creator kontrolü
function isCreator() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const userData = registeredUsers.find(user => user.discordName === currentUser);
  return userData?.isCreator;
}

// Admin paneli aç
function openAdminPanel() {
  showEmbedMessage('👑 Admin paneline yönlendiriliyorsunuz...', 'success', 3000);
  window.open('admin.html', '_blank');
}

// Admin özel paneli menüye ekle - Creator/Admin ayrımı
function updateAdminPanelAccess() {
  if (isAdmin()) {
    // Mevcut admin bölümünü kaldır
    const existingAdmin = document.querySelector('.panel-section .admin-item')?.closest('.panel-section');
    if (existingAdmin) {
      existingAdmin.remove();
    }
    
    // Admin bölümü ekle
    const adminSection = document.createElement('div');
    adminSection.className = 'panel-section';
    
    let adminButtons = `
      <button class="panel-item admin-item" onclick="openAdminPanel(); toggleModernPanel();" style="background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.3);">
        📊 Admin Panel
      </button>
      <button class="panel-item admin-item" onclick="viewSystemLogs(); toggleModernPanel();" style="background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.3);">
        📋 Sistem Logları
      </button>
      <button class="panel-item admin-item" onclick="manageUsers(); toggleModernPanel();" style="background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.3);">
        👥 Kullanıcı Yönetimi
      </button>
    `;
    
    // Sadece Creator AI ve Telsiz görebilir
    if (isCreator()) {
      adminSection.innerHTML = `
        <div class="section-title">👑 Creator İşlemleri</div>
        <div class="panel-items">
          ${adminButtons}
          <button class="panel-item admin-item" onclick="openAdvancedAI(); toggleModernPanel();" style="background: rgba(129,236,236,0.1); border-color: rgba(129,236,236,0.3);">
            🤖 Creator AI
          </button>
          <button class="panel-item admin-item" onclick="openRadioModal(); toggleModernPanel();" style="background: rgba(255,193,7,0.1); border-color: rgba(255,193,7,0.3);">
            📻 Creator Telsiz
          </button>
        </div>
      `;
    } else {
      adminSection.innerHTML = `
        <div class="section-title">⚡ Admin İşlemleri</div>
        <div class="panel-items">
          ${adminButtons}
        </div>
      `;
    }
    
    // Çıkış bölümünden önce ekle
    const logoutSection = document.getElementById('logout-section');
    if (logoutSection) {
      logoutSection.parentNode.insertBefore(adminSection, logoutSection);
    }
  }
}

// Sistem loglarını görüntüle
function viewSystemLogs() {
  const kayitlar = JSON.parse(localStorage.getItem('kayitlar') || '[]');
  if (kayitlar.length === 0) {
    showEmbedMessage('Henüz sistem logu bulunmuyor.', 'info');
    return;
  }
  
  const recentLogs = kayitlar.slice(-10).reverse();
  let logMessage = '📋 Son 10 Sistem Logu:\n\n';
  
  recentLogs.forEach(log => {
    logMessage += `📅 ${log.tarih} ⏰ ${log.saat}\n`;
    logMessage += `👤 ${log.discordName || 'Ziyaretçi'}\n`;
    logMessage += `⚡ ${log.action.toUpperCase()}\n`;
    logMessage += `💻 ${log.markaModel}\n`;
    logMessage += '─'.repeat(30) + '\n\n';
  });
  
  alert(logMessage);
}

// Kullanıcı yönetimi
function manageUsers() {
  const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  if (registeredUsers.length === 0) {
    showEmbedMessage('Henüz kayıtlı kullanıcı bulunmuyor.', 'info');
    return;
  }
  
  let userList = '👥 Kayıtlı Kullanıcılar:\n\n';
  registeredUsers.forEach((user, index) => {
    const isAdminUser = user.discordName === '0vexa.' || user.discordName === '0vexa.efe_090102';
    userList += `${index + 1}. ${isAdminUser ? '👑' : '👤'} ${user.discordName}\n`;
    userList += `   📅 Kayıt: ${new Date(user.kayitTarihi).toLocaleDateString('tr-TR')}\n`;
    userList += `   💻 Cihaz: ${user.markaModel}\n\n`;
  });
  
  alert(userList);
}

// Kayıtlar butonunu göster/gizle (eski uyumluluk için)
function toggleKayitlarButton() {
  updateAdminPanelAccess();
}

function openLoginModal() {
  loginModal.style.display = 'flex';
  mainContent.classList.add('blur');
  if (logoutBtn) logoutBtn.style.display = 'none';
  clearLoginErrors();
  if (loginForm) loginForm.style.display = 'block';
  if (forgotPasswordMessage) forgotPasswordMessage.style.display = 'none';
}

function openRegisterModal() {
  registerModal.style.display = 'flex';
  mainContent.classList.add('blur');
  clearRegisterErrors();
}

function closeModals() {
  if (loginModal) loginModal.style.display = 'none';
  if (registerModal) registerModal.style.display = 'none';
  if (mainContent) mainContent.classList.remove('blur');
}

function logout() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const currentUserData = registeredUsers.find(user => user.discordName === currentUser);

  if (currentUser && currentUserData) {
    saveKayit(currentUser, currentUserData.password, 'cikis');
  }

  localStorage.removeItem('yuksek-idare-user');
  closeModals();
  openLoginModal();
}

// Hata mesajını göster ve 6 saniye sonra gizle
function showErrorTimed(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hide');

  if (errorTimeouts[id]) clearTimeout(errorTimeouts[id]);

  errorTimeouts[id] = setTimeout(() => {
    el.classList.add('hide');
  }, 6000);
}

function clearLoginErrors() {
  ['error-login-username', 'error-login-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      el.classList.add('hide');
    }
  });
}

function clearRegisterErrors() {
  ['error-discord-name', 'error-password', 'error-password2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      el.classList.add('hide');
    }
  });
}

function clearLoginInputs() {
  if (loginUsernameInput) loginUsernameInput.value = '';
  if (loginPasswordInput) loginPasswordInput.value = '';
  clearLoginErrors();
}

function clearRegisterInputs() {
  if (registerForm) registerForm.reset();
  clearRegisterErrors();
}

// Kullanıcı kaydetme
function saveUser(userData) {
  registeredUsers.push(userData);
  localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
}

// Kullanıcı doğrulama
function validateUser(username, password) {
  return registeredUsers.find(user => 
    user.discordName === username && user.password === password
  );
}

// Bölüme kaydırma ve vurgulama
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Önceki vurguları temizle
    document.querySelectorAll('.highlight-section').forEach(el => {
      el.classList.remove('highlight-section');
    });

    // 2 saniye vurgulamak için
    setTimeout(() => {
      section.classList.add('highlight-section');
      setTimeout(() => {
        section.classList.remove('highlight-section');
      }, 2000);
    }, 500);

    // Bölüm adına göre özel bildirimler
    const sectionNames = {
      'alt-yonetim-kadro': 'Kadro Bölümüne geçildi',
      'rutbe-islemleri': 'Rütbe İşlemleri\'ne geçildi', 
      'kurallar-hakkinda': 'Kurallar Bölümü\'ne geçildi',
      'etkinlik-kurallari': 'Etkinlik Kuralları\'na geçildi',
      'yuksek-idare-bildirgesi': 'Bildirgesi\'ne geçildi',
      'hakkimizda': 'Hakkımızda Bölümü\'ne geçildi'
    };
    
    const sectionName = sectionNames[sectionId] || 'Bölüme yönlendirildiniz!';
    showEmbedMessage(sectionName, 'navigation', 3000);
  }
}

// Dosya indirme fonksiyonu
function downloadKayitlarTxt(icerik) {
  try {
    const blob = new Blob([icerik], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kayitlar.txt';
    a.style.display = 'none';
    document.body.appendChild(a);
    // Otomatik indirme (kullanıcı onayı gerekebilir)
    // a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.log('Dosya indirme hatası:', error);
  }
}

// Telsiz Sistemi Fonksiyonları
function openRadioModal() {
  const radioModal = document.createElement('div');
  radioModal.id = 'radio-modal';
  radioModal.className = 'modal';
  radioModal.style.display = 'flex';

  radioModal.innerHTML = document.getElementById('radio-modal').innerHTML;
  document.body.appendChild(radioModal);
  mainContent.classList.add('blur');

  updateOnlineUsers();
  loadRadioMessages();

  // Enter tuşu ile mesaj gönderme
  const messageInput = document.getElementById('radio-message-input');
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendRadioMessage();
    }
  });
}

function closeRadioModal() {
  const radioModal = document.getElementById('radio-modal');
  if (radioModal) {
    radioModal.style.display = 'none';
    mainContent.classList.remove('blur');
  }
}

function updateOnlineUsers() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  if (!currentUser) return;

  // Kullanıcıyı online listeye ekle
  if (!onlineUsers.includes(currentUser)) {
    onlineUsers.push(currentUser);
    localStorage.setItem('onlineUsers', JSON.stringify(onlineUsers));
  }

  const usersList = document.getElementById('online-users-list');
  const onlineCount = document.getElementById('online-count');

  if (usersList && onlineCount) {
    onlineCount.textContent = onlineUsers.length;
    usersList.innerHTML = '';

    onlineUsers.forEach(username => {
      const userBadge = document.createElement('div');
      userBadge.className = 'user-badge';
      if (username === '0vexa.') {
        userBadge.classList.add('admin');
      }
      userBadge.innerHTML = `${username === '0vexa.' ? '👑' : '👤'} ${username}`;
      usersList.appendChild(userBadge);
    });
  }
}

function sendRadioMessage() {
  const messageInput = document.getElementById('radio-message-input');
  const currentUser = localStorage.getItem('yuksek-idare-user');

  if (!messageInput || !currentUser) return;

  const messageText = messageInput.value.trim();
  if (!messageText) return;

  const message = {
    id: Date.now() + Math.random(),
    user: currentUser,
    content: messageText,
    timestamp: new Date(),
    isAdmin: currentUser === '0vexa.',
    hasEveryoneMention: messageText.includes('@everyone'),
    type: 'text'
  };

  radioMessages.push(message);
  localStorage.setItem('radioMessages', JSON.stringify(radioMessages));

  // Log kaydı
  writeLog('Telsiz', {
    islem: 'Mesaj gönderildi',
    detay: `Mesaj: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`
  });

  displayRadioMessage(message);
  messageInput.value = '';

  // @everyone bildirim kontrolü
  if (message.hasEveryoneMention) {
    showEmbedMessage(`${currentUser} herkesi etiketledi!`, 'warning');
    if (radioSoundsEnabled) {
      playNotificationSound('everyone');
    }
  } else if (radioSoundsEnabled) {
    playNotificationSound('message');
  }

  showEmbedMessage('Telsiz mesajı gönderildi!', 'success');
}

// Emoji picker aç/kapat
function openEmojiPicker() {
  const emojiPicker = document.getElementById('emoji-picker');
  if (emojiPicker) {
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
  }
}

// Emoji ekle
function addEmoji(emoji) {
  const messageInput = document.getElementById('radio-message-input');
  if (messageInput) {
    messageInput.value += emoji;
    messageInput.focus();
  }
  // Emoji picker'ı gizle
  const emojiPicker = document.getElementById('emoji-picker');
  if (emojiPicker) {
    emojiPicker.style.display = 'none';
  }
}

// Telsiz fotoğraf yükleme
function uploadRadioImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showEmbedMessage('Dosya boyutu 5MB\'dan büyük olamaz!', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const currentUser = localStorage.getItem('yuksek-idare-user');

        const message = {
          id: Date.now() + Math.random(),
          user: currentUser,
          content: e.target.result,
          timestamp: new Date(),
          isAdmin: currentUser === '0vexa.',
          hasEveryoneMention: false,
          type: 'image',
          fileName: file.name
        };

        radioMessages.push(message);
        localStorage.setItem('radioMessages', JSON.stringify(radioMessages));

        // Log kaydı
        writeLog('Telsiz', {
          islem: 'Fotoğraf paylaşıldı',
          detay: `Dosya: ${file.name} (${file.size} bytes)`
        });

        displayRadioMessage(message);

        if (radioSoundsEnabled) {
          playNotificationSound('image');
        }

        showEmbedMessage('Fotoğraf başarıyla paylaşıldı!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

function displayRadioMessage(message) {
  const messagesContainer = document.getElementById('radio-messages');
  if (!messagesContainer) return;

  const messageElement = document.createElement('div');
  messageElement.className = 'radio-message';
  if (message.hasEveryoneMention) {
    messageElement.classList.add('everyone-mention');
  }

  let contentHtml = '';
  if (message.type === 'image') {
    contentHtml = `
      <div class="message-image">
        <img src="${message.content}" alt="Paylaşılan Görsel" style="max-width: 300px; max-height: 200px; border-radius: 8px; cursor: pointer;" onclick="openImageModal('${message.content}')">
        <div class="image-info">📷 ${message.fileName || 'Görsel'}</div>
      </div>
    `;
  } else {
    const formattedContent = message.content.replace(/@everyone/g, '<span class="everyone-highlight">@everyone</span>');
    contentHtml = `<div class="message-content">${formattedContent}</div>`;
  }

  messageElement.innerHTML = `
    <div class="message-header">
      <span class="message-user ${message.isAdmin ? 'admin' : ''}">${message.isAdmin ? '👑' : '👤'} ${message.user}</span>
      <span class="message-time">${new Date(message.timestamp).toLocaleTimeString('tr-TR')}</span>
    </div>
    ${contentHtml}
  `;

  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Görsel modal açma
function openImageModal(imageSrc) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 90vw; max-height: 90vh; padding: 0; background: transparent;">
      <img src="${imageSrc}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
      <button class="modal-close-btn" onclick="this.parentElement.parentElement.remove(); mainContent.classList.remove('blur')" style="position: absolute; top: 10px; right: 10px;">✕</button>
    </div>
  `;

  document.body.appendChild(modal);
  mainContent.classList.add('blur');
}

function loadRadioMessages() {
  const messagesContainer = document.getElementById('radio-messages');
  if (!messagesContainer) return;

  // Hoşgeldin mesajını temizle
  messagesContainer.innerHTML = '';

  if (radioMessages.length === 0) {
    messagesContainer.innerHTML = '<div class="welcome-message">📻 Telsiz sistemine hoşgeldiniz! Mesajlarınız tüm aktif kullanıcılara ulaşacak.</div>';
  } else {
    radioMessages.forEach(message => displayRadioMessage(message));
  }
}

function clearRadioChat() {
  if (confirm('Tüm telsiz mesajlarını silmek istediğinizden emin misiniz?')) {
    radioMessages = [];
    localStorage.removeItem('radioMessages');
    loadRadioMessages();
    showEmbedMessage('Telsiz geçmişi temizlendi!', 'success');
  }
}

function toggleRadioSounds() {
  radioSoundsEnabled = !radioSoundsEnabled;
  localStorage.setItem('radioSounds', radioSoundsEnabled);
  showEmbedMessage(`Telsiz sesleri ${radioSoundsEnabled ? 'açıldı' : 'kapatıldı'}!`, 'info');
}

function exportRadioChat() {
  const exportData = {
    messages: radioMessages,
    exportDate: new Date().toISOString(),
    userCount: onlineUsers.length
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'telsiz_gecmisi.json';
  a.click();

  URL.revokeObjectURL(url);
  showEmbedMessage('Telsiz geçmişi indirildi!', 'success');
}

function playNotificationSound(type) {
  // Basit ses efekti simulasyonu
  if (type === 'everyone') {
    console.log('🔊 @everyone bildirim sesi çalıyor...');
  } else {
    console.log('🔊 Mesaj bildirim sesi çalıyor...');
  }
}

// Uygulamalar Sistemi
function openAppsModal() {
  const appsModal = document.getElementById('apps-modal');
  if (appsModal) {
    appsModal.style.display = 'flex';
    mainContent.classList.add('blur');
  }
}

function closeAppsModal() {
  const appsModal = document.getElementById('apps-modal');
  if (appsModal) {
    appsModal.style.display = 'none';
    mainContent.classList.remove('blur');
  }
}

function openFileManager() {
  showEmbedMessage('📁 Dosya Yöneticisi açılıyor...', 'info');
  // Basit dosya listesi
  const files = ['kayitlar.txt', 'ayarlar.json', 'profil_resimleri/', 'telsiz_gecmisi.json'];
  const fileList = files.map(f => `📄 ${f}`).join('\n');
  alert(`Dosyalar:\n\n${fileList}`);
}

function openClipSharer() {
  closeAppsModal();
  const clipModal = document.getElementById('clip-modal');
  if (clipModal) {
    clipModal.style.display = 'flex';
    loadSharedClips();
  }
}

function closeClipModal() {
  const clipModal = document.getElementById('clip-modal');
  if (clipModal) {
    clipModal.style.display = 'none';
    mainContent.classList.remove('blur');
  }
}

function shareClip() {
  const clipText = document.getElementById('clip-text');
  const currentUser = localStorage.getItem('yuksek-idare-user');

  if (!clipText || !currentUser) return;

  const text = clipText.value.trim();
  if (!text) {
    showEmbedMessage('Paylaşılacak metin boş olamaz!', 'error');
    return;
  }

  const clip = {
    id: Date.now(),
    user: currentUser,
    content: text,
    timestamp: new Date().toISOString()
  };

  sharedClips.push(clip);
  localStorage.setItem('sharedClips', JSON.stringify(sharedClips));

  clipText.value = '';
  loadSharedClips();
  showEmbedMessage('Klip başarıyla paylaşıldı!', 'success');
}

function clearClip() {
  const clipText = document.getElementById('clip-text');
  if (clipText) {
    clipText.value = '';
  }
}

function loadSharedClips() {
  const clipsList = document.getElementById('clips-list');
  if (!clipsList) return;

  if (sharedClips.length === 0) {
    clipsList.innerHTML = '<div style="text-align: center; color: #aaa; padding: 20px;">Henüz paylaşılan klip yok</div>';
    return;
  }

  clipsList.innerHTML = '';
  sharedClips.slice(-10).reverse().forEach(clip => {
    const clipElement = document.createElement('div');
    clipElement.className = 'clip-item';
    clipElement.innerHTML = `
      <div class="clip-header">
        <span>${clip.user}</span>
        <span>${new Date(clip.timestamp).toLocaleString('tr-TR')}</span>
      </div>
      <div class="clip-content">${clip.content}</div>
    `;
    clipsList.appendChild(clipElement);
  });
}

function openVoiceRecorder() {
  showEmbedMessage('🎤 Ses kaydı özelliği geliştiriliyor...', 'info');
}

function openSurveyCreator() {
  showEmbedMessage('📊 Anket oluşturucu geliştiriliyor...', 'info');
}

function openCalculator() {
  const result = prompt('Hesaplamak istediğiniz işlemi girin (örn: 2+2):');
  if (result) {
    try {
      const calculation = eval(result);
      showEmbedMessage(`Sonuç: ${result} = ${calculation}`, 'success');
    } catch (e) {
      showEmbedMessage('Geçersiz işlem!', 'error');
    }
  }
}

function openNotepad() {
  const note = prompt('Notunuzu yazın:');
  if (note) {
    const savedNotes = JSON.parse(localStorage.getItem('userNotes') || '[]');
    savedNotes.push({
      id: Date.now(),
      content: note,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('userNotes', JSON.stringify(savedNotes));
    showEmbedMessage('Not kaydedildi!', 'success');
  }
}

// Hesap silme fonksiyonu
function deleteAccount() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  if (!currentUser) return;

  const confirmation = prompt(`Hesabınızı silmek için "${currentUser}" yazın:`);
  if (confirmation === currentUser) {
    const finalConfirm = confirm('Bu işlem geri alınamaz! Hesabınızı kalıcı olarak silmek istediğinizden emin misiniz?');
    if (finalConfirm) {
      // Kullanıcıyı listeden çıkar
      registeredUsers = registeredUsers.filter(user => user.discordName !== currentUser);
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

      // Kullanıcı verilerini temizle
      localStorage.removeItem('yuksek-idare-user');
      localStorage.removeItem(`profile-image-${currentUser}`);
      localStorage.removeItem(`cover-image-${currentUser}`);

      showEmbedMessage('Hesabınız başarıyla silindi.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  } else {
    showEmbedMessage('Hesap adı eşleşmiyor!', 'error');
  }
}

// Sayfa arka planını değiştir - Modal sistemi
function changePageBackground() {
  showEmbedMessage('Arka Plan Değiştirme sayfasına geçildi', 'navigation', 2500);
  openPageBackgroundModal();
}

function openPageBackgroundModal() {
  // Ayarlar modalını kapat
  closeSettingsModal();
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.style.zIndex = '10000';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px; width: 95%; background: linear-gradient(135deg, #1f1f1f, #2a2a2a);">
      <h3 style="color: #fff; text-align: center; margin-bottom: 25px;">🖼️ Sayfa Arka Planı Değiştir</h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; text-align: center;">
          <h4 style="color: #4caf50; margin-bottom: 15px;">📁 Kendi Görselinizi Yükleyin</h4>
          <button onclick="uploadCustomPageBackground()" style="background: linear-gradient(135deg, #4caf50, #388e3c); border: none; color: white; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%;">
            📷 Cihazdan Görsel Seç
          </button>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; text-align: center;">
          <h4 style="color: #ff9800; margin-bottom: 15px;">🌈 Hazır Gradyanlar</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <button onclick="setGradientBackground('linear-gradient(135deg, #667eea, #764ba2)')" style="background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">Mavi</button>
            <button onclick="setGradientBackground('linear-gradient(135deg, #ff6b6b, #ee5a52)')" style="background: linear-gradient(135deg, #ff6b6b, #ee5a52); border: none; color: white; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">Kırmızı</button>
            <button onclick="setGradientBackground('linear-gradient(135deg, #4caf50, #388e3c)')" style="background: linear-gradient(135deg, #4caf50, #388e3c); border: none; color: white; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">Yeşil</button>
            <button onclick="setGradientBackground('linear-gradient(135deg, #9c27b0, #7b1fa2)')" style="background: linear-gradient(135deg, #9c27b0, #7b1fa2); border: none; color: white; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">Mor</button>
          </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; text-align: center;">
          <h4 style="color: #2196f3; margin-bottom: 15px;">🔄 Varsayılan</h4>
          <button onclick="resetPageBackground()" style="background: linear-gradient(135deg, #2196f3, #1976d2); border: none; color: white; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%;">
            🔄 Varsayılan Arka Plan
          </button>
        </div>
      </div>
      
      <div style="display: flex; gap: 15px;">
        <button onclick="closePageBackgroundModal(); openSettingsModal();" style="flex: 1; background: linear-gradient(135deg, #e74c3c, #c0392b); border: none; color: white; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          ⬅️ Ayarlara Dön
        </button>
        <button onclick="closePageBackgroundModal()" style="flex: 1; background: linear-gradient(135deg, #95a5a6, #7f8c8d); border: none; color: white; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          ✅ Kapat
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  mainContent.classList.add('blur');
}

function uploadCustomPageBackground() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.body.style.backgroundImage = `url('${e.target.result}')`;
        localStorage.setItem('page-background', e.target.result);

        writeLog('GörselDegisiklikler', {
          islem: 'Sayfa arka planı değiştirildi',
          detay: `Dosya: ${file.name} (${file.size} bytes)`
        });

        showEmbedMessage('Sayfa arka planı güncellendi!', 'success');
        closePageBackgroundModal();
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

function setGradientBackground(gradient) {
  document.body.style.backgroundImage = gradient;
  localStorage.setItem('page-background', gradient);
  
  writeLog('GörselDegisiklikler', {
    islem: 'Gradyan arka plan uygulandı',
    detay: gradient
  });
  
  showEmbedMessage('Gradyan arka plan uygulandı!', 'success');
  closePageBackgroundModal();
}

function resetPageBackground() {
  const defaultBg = 'url(\'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw4cansNuP-IOzGikUMHyWorq2DLN9iiid9_lzTfe_hZHEH3oaADnWfZDES4kTYSjIEDk&usqp=CAU\')';
  document.body.style.backgroundImage = defaultBg;
  localStorage.removeItem('page-background');
  
  writeLog('GörselDegisiklikler', {
    islem: 'Arka plan varsayılana döndürüldü',
    detay: 'Varsayılan arka plan yüklendi'
  });
  
  showEmbedMessage('Varsayılan arka plan yüklendi!', 'success');
  closePageBackgroundModal();
}

function closePageBackgroundModal() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove();
    mainContent.classList.remove('blur');
  }
}

// Header banner değiştir
function changeHeaderBanner() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const banner = document.querySelector('.top-banner');
        if (banner) {
          banner.src = e.target.result;
          localStorage.setItem('header-banner', e.target.result);

          writeLog('Ayarlar', {
            islem: 'Header banner değiştirildi',
            detay: `Dosya: ${file.name}`
          });

          showEmbedMessage('Header banner güncellendi!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

// Yazı tipi değiştir
function changeFontFamily(fontFamily) {
  document.body.style.fontFamily = `'${fontFamily}', sans-serif`;
  localStorage.setItem('font-family', fontFamily);

  // Aktif font butonunu güncelle
  document.querySelectorAll('.font-option').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[onclick="changeFontFamily('${fontFamily}')"]`).classList.add('active');

  writeLog('Ayarlar', {
    islem: 'Yazı tipi değiştirildi',
    detay: `Yeni font: ${fontFamily}`
  });

  showEmbedMessage(`Yazı tipi ${fontFamily} olarak değiştirildi!`, 'success');
}

// Yazı boyutu değiştir
function changeFontSize(size) {
  document.body.style.fontSize = size + 'px';
  localStorage.setItem('font-size', size);

  writeLog('Ayarlar', {
    islem: 'Yazı boyutu değiştirildi',
    detay: `Yeni boyut: ${size}px`
  });
}

// Kullanıcı adı değiştir
function changeUsername() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const newUsername = prompt('Yeni kullanıcı adınızı girin:', currentUser);

  if (newUsername && newUsername !== currentUser) {
    // Aynı isimde başka kullanıcı var mı kontrol et
    const existingUser = registeredUsers.find(user => user.discordName === newUsername);
    if (existingUser) {
      showEmbedMessage('Bu kullanıcı adı zaten kullanılıyor!', 'error');
      return;
    }

    // Kullanıcı bilgilerini güncelle
    const userIndex = registeredUsers.findIndex(user => user.discordName === currentUser);
    if (userIndex !== -1) {
      const oldUsername = registeredUsers[userIndex].discordName;
      registeredUsers[userIndex].discordName = newUsername;
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
      localStorage.setItem('yuksek-idare-user', newUsername);

      // Log kaydı
      writeLog('ProfilResmi', {
        islem: 'Kullanıcı adı değiştirildi',
        detay: `Eski: ${oldUsername} → Yeni: ${newUsername}`
      });

      // Profil modalını güncelle
      const profileName = document.querySelector('.profile-name');
      if (profileName) {
        profileName.textContent = newUsername;
      }

      showEmbedMessage('Kullanıcı adı başarıyla değiştirildi!', 'success');
    }
  }
}

// Şifre değiştir
function changePassword() {
  const currentPassword = prompt('Mevcut şifrenizi girin:');
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const userData = registeredUsers.find(user => user.discordName === currentUser);

  if (userData && userData.password === currentPassword) {
    const newPassword = prompt('Yeni şifrenizi girin:');
    const confirmPassword = prompt('Yeni şifrenizi tekrar girin:');

    if (newPassword && newPassword === confirmPassword) {
      const userIndex = registeredUsers.findIndex(user => user.discordName === currentUser);
      registeredUsers[userIndex].password = newPassword;
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

      // Log kaydı
      writeLog('Ayarlar', {
        islem: 'Şifre değiştirildi',
        detay: 'Kullanıcı şifresini güncelledi'
      });

      showEmbedMessage('Şifre başarıyla değiştirildi!', 'success');
    } else {
      showEmbedMessage('Şifreler eşleşmiyor!', 'error');
    }
  } else {
    showEmbedMessage('Mevcut şifre yanlış!', 'error');
  }
}

// Ayarları dışa aktar
function exportSettings() {
  const settings = {
    backgroundOpacity: localStorage.getItem('background-opacity'),
    theme: localStorage.getItem('theme'),
    fontFamily: localStorage.getItem('font-family'),
    fontSize: localStorage.getItem('font-size'),
    notificationsEnabled: localStorage.getItem('notifications-enabled'),
    radioSounds: localStorage.getItem('radioSounds'),
    pageBackground: localStorage.getItem('page-background'),
    headerBanner: localStorage.getItem('header-banner'),
    exportDate: new Date().toISOString()
  };

  const dataStr = JSON.stringify(settings, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'tam_ayarlarim.json';
  a.click();

  URL.revokeObjectURL(url);
  showEmbedMessage('Tüm ayarlar dışa aktarıldı!', 'success');
}

// Gelişmiş AI Chat Sistemi
let aiChatHistory = JSON.parse(localStorage.getItem('aiChatHistory')) || [];
let currentChatId = null;
let aiContext = [];

// Gelişmiş AI Bilgi Tabanı
const advancedAIKnowledge = {
  "tasarımcı": {
    keywords: ["kim tasarladı", "tasarımcı", "yapan", "geliştiren", "oluşturan", "creator", "designer", "bu siteyi kim", "wumpus"],
    response: "🎨 **Bu site Wumpus tarafından tasarlanmıştır.**\n\nWumpus, modern web teknolojileri konusunda uzman bir geliştiricidir. Bu projeyi kullanıcı dostu arayüz ve güçlü özellikler sunmak amacıyla özenle tasarlamıştır.\n\n✨ **Wumpus'un Uzmanlık Alanları:**\n• Modern JavaScript ve CSS teknolojileri\n• Responsive ve mobil uyumlu tasarım\n• Kullanıcı deneyimi (UX) optimizasyonu\n• Discord benzeri modern arayüzler\n\n🚀 Bu site, Wumpus'un yaratıcılığının ve teknik becerisinin mükemmel bir örneğidir!"
  },

  "plus": {
    keywords: ["plus", "plus abonesi", "abonelik", "premium", "üyelik", "özel üyelik"],
    response: "⭐ **Plus Abonelik Sistemi:**\n\nŞu anda Plus abonelik sistemi geliştirilme aşamasındadır. Yakında aşağıdaki özellikler sunulacak:\n\n🎯 **Plus Özellikleri:**\n• 🎨 Özel temalar ve renk paletleri\n• 💾 Sınırsız veri depolama\n• 🚀 Öncelikli teknik destek\n• 🎵 Özel ses efektleri\n• 👑 Özel rozet ve unvanlar\n• 📊 Gelişmiş istatistikler\n• 🔒 Gelişmiş gizlilik ayarları\n\n💰 **Fiyatlandırma:** Henüz belirlenmedi\n\n📅 **Çıkış Tarihi:** Yakında duyurulacak\n\n💡 **İpucu:** Discord sunucumuzdan güncellemeleri takip edebilirsiniz!"
  },

  "bellek": {
    keywords: ["bellek dolu", "memory full", "depolama", "yer kalmadı", "disk dolu"],
    response: "💾 **Bellek Dolu Sorunu:**\n\nBu sorun genellikle tarayıcı verilerinin çok fazla birikmesinden kaynaklanır.\n\n🔧 **Çözüm Yöntemleri:**\n\n1. **Tarayıcı Önbelleğini Temizle:**\n   • Chrome: Ctrl+Shift+Delete\n   • Firefox: Ctrl+Shift+Delete\n   • Safari: ⌘+Option+E\n\n2. **Gereksiz Verileri Sil:**\n   • Eski sohbet geçmişlerini temizle\n   • Kullanılmayan profil fotoğraflarını sil\n   • Telsiz mesaj geçmişini temizle\n\n3. **Tarayıcı Ayarlarını Kontrol Et:**\n   • Otomatik indirmeleri durdur\n   • Çerez ayarlarını optimize et\n\n💡 **Öneri:** Düzenli olarak (haftada bir) tarayıcı temizliği yapın."
  },

  "profil_değiştirme": {
    keywords: ["profil", "profil değiştir", "profil fotoğrafı", "avatar", "resim değiştir"],
    response: "👤 **Profil Değiştirme Rehberi:**\n\n📍 **Erişim Yolu:**\n1. Sol üst köşedeki ☰ menü butonuna tıklayın\n2. 'Profil' seçeneğini seçin\n\n🖼️ **Profil Fotoğrafı:**\n• Profil fotoğrafına tıklayın\n• Cihazınızdan yeni fotoğraf seçin\n• Maksimum boyut: 10MB\n• Desteklenen formatlar: JPG, PNG, GIF\n\n🎨 **Kapak Fotoğrafı:**\n• '📷 Kapak Değiştir' butonuna tıklayın\n• 500+ hazır seçenek veya özel yükleme\n• HD kalite için 1200x400 boyut önerilir\n\n⚙️ **Diğer Ayarlar:**\n• İsim değiştirme\n• Şifre güncelleme\n• Hesap bilgileri düzenleme\n\n💾 **Otomatik Kayıt:** Tüm değişiklikler otomatik olarak kaydedilir!"
  },

  "banner_değiştirme": {
    keywords: ["banner", "banner değiştir", "arka plan", "kapak fotoğrafı", "header"],
    response: "🖼️ **Banner Değiştirme Rehberi:**\n\n🎯 **Ana Sayfa Banner:**\n1. ☰ Menü → Ayarlar\n2. 'Ana Sayfa Banner Değiştir'\n3. Hazır kategorilerden seçin veya özel yükleyin\n\n🌟 **Hazır Kategoriler:**\n• 🌿 Doğa manzaraları\n• 🌲 Orman temaları\n• 🏞️ Park & bahçe görünümleri\n• 🌆 Şehir manzaraları\n• 🌌 Uzay & galaksi\n• 🎮 Gaming & Discord temaları\n• 🐾 Hayvan fotoğrafları\n• 🎨 Sanat & soyut desenler\n\n👤 **Profil Banner:**\n1. Profil → Kapak Fotoğrafı\n2. '📷 Kapak Değiştir'\n3. 500+ seçenekten seçin\n\n📐 **Optimal Boyutlar:**\n• Ana banner: 1200x400px\n• Profil banner: 800x300px\n• Maksimum dosya boyutu: 5MB\n\n💡 **İpucu:** GIF formatı da desteklenir!"
  },

  "ayarlar": {
    keywords: ["ayarlar", "settings", "ayar", "seçenekler", "konfigürasyon", "nerede"],
    response: "⚙️ **Ayarlar Paneli Rehberi:**\n\n📍 **Erişim:** Sol üst ☰ menü → 'Ayarlar'\n\n🎨 **Görünüm Ayarları:**\n• 🌫️ Arka plan şeffaflığı (30%-100%)\n• 🎭 Tema seçimi (Koyu/Açık/Otomatik)\n• 🔤 Yazı tipi değiştirme (4 seçenek)\n• 📏 Yazı boyutu ayarlama\n• 🖼️ Banner ve arka plan özelleştirme\n• 🎨 Panel arka plan değiştirme\n\n🔔 **Bildirim Kontrolü:**\n• 🔊 Masaüstü bildirimleri\n• 📻 Telsiz ses efektleri\n• 📢 @everyone bildirimleri\n• 🎵 Özel bildirim sesleri\n\n🔐 **Gizlilik & Güvenlik:**\n• 👁️ Profil görünürlük ayarları\n• 🔒 Otomatik giriş kontrolü\n• 🛡️ Veri şifreleme seçenekleri\n• 📊 Veri paylaşım tercihleri\n\n⚡ **Performans:**\n• 🚀 Yüksek performans modu\n• 💾 Otomatik kaydetme\n• 📱 Mobil optimizasyon\n\n💾 **Veri Yönetimi:**\n• 📤 Ayarları dışa aktarma\n• 📥 Yedek ayarları içe aktarma\n• 🔄 Fabrika ayarlarına sıfırlama"
  }
};

// Gelişmiş AI Response Engine - 100M+ kelime kapasiteli
function generateAdvancedAIResponse(message, context = []) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Gelişmiş anahtar kelime analizi
  for (const [category, data] of Object.entries(advancedAIKnowledge)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return {
          response: data.response,
          confidence: 0.9,
          category: category
        };
      }
    }
  }

  // Genel sorular - ChatGPT tarzı cevaplar
  if (lowerMessage.includes('kod') || lowerMessage.includes('program') || lowerMessage.includes('javascript') || lowerMessage.includes('html') || lowerMessage.includes('css')) {
    return {
      response: "💻 **Programlama ve Kod Soruları**\n\nSize programlama konularında yardımcı olabilirim! Hangi konuda bilgi almak istiyorsunuz?\n\n🔧 **Yardımcı olabileceğim alanlar:**\n• JavaScript, HTML, CSS\n• Python, Java, C++\n• Web geliştirme\n• Algoritma ve veri yapıları\n• Debugging ve optimizasyon\n• Framework'ler (React, Vue, Angular)\n\n📝 **Örnek:** 'JavaScript'te array nasıl kullanılır?' şeklinde sorabilirsiniz.",
      confidence: 0.9,
      category: 'programming'
    };
  }

  if (lowerMessage.includes('matematik') || lowerMessage.includes('hesap') || lowerMessage.includes('formül')) {
    return {
      response: "🧮 **Matematik ve Hesaplama**\n\nMatematik sorularınızda size yardımcı olabilirim!\n\n📊 **Kapsadığım alanlar:**\n• Temel matematik (toplama, çıkarma, çarpma, bölme)\n• Cebir ve geometri\n• İstatistik ve olasılık\n• Kalkülüs ve diferansiyel\n• Finansal hesaplamalar\n• Fizik formülleri\n\n💡 **Örnek:** '2x + 5 = 15 denklemini çöz' veya 'Dairenin alanı nasıl hesaplanır?'",
      confidence: 0.9,
      category: 'mathematics'
    };
  }

  if (lowerMessage.includes('tarih') || lowerMessage.includes('coğrafya') || lowerMessage.includes('ülke') || lowerMessage.includes('şehir')) {
    return {
      response: "🌍 **Tarih ve Coğrafya**\n\nTarih, coğrafya ve genel kültür sorularınızı yanıtlayabilirim!\n\n📚 **Bilgi alanlarım:**\n• Dünya tarihi ve Türk tarihi\n• Ülkeler ve başkentleri\n• Coğrafi özellikler\n• Kıtalar ve okyanuslar\n• Önemli tarihî olaylar\n• Kültür ve medeniyetler\n\n🏛️ **Örnek:** 'Osmanlı İmparatorluğu ne zaman kuruldu?' veya 'Türkiye'nin komşu ülkeleri hangileri?'",
      confidence: 0.9,
      category: 'geography_history'
    };
  }

  if (lowerMessage.includes('sağlık') || lowerMessage.includes('hastalık') || lowerMessage.includes('doktor') || lowerMessage.includes('ilaç')) {
    return {
      response: "🏥 **Sağlık ve Tıp Bilgileri**\n\n⚠️ **UYARI:** Verdiğim bilgiler genel bilgilendirme amaçlıdır. Ciddi sağlık sorunları için mutlaka doktora başvurun!\n\n💊 **Yardımcı olabileceğim konular:**\n• Genel sağlık tavsiyeleri\n• Beslenme ve diyet\n• Egzersiz ve spor\n• Temel tıbbi terimler\n• Hastalık belirtileri (genel bilgi)\n• İlk yardım bilgileri\n\n🩺 **Örnek:** 'Dengeli beslenme nasıl olmalı?' veya 'Düzenli egzersizin faydaları neler?'",
      confidence: 0.8,
      category: 'health'
    };
  }

  if (lowerMessage.includes('yemek') || lowerMessage.includes('tarif') || lowerMessage.includes('mutfak') || lowerMessage.includes('malzeme')) {
    return {
      response: "👨‍🍳 **Yemek ve Tarif Rehberi**\n\nMutfak, yemek tarifleri ve beslenme konularında size yardımcı olabilirim!\n\n🍽️ **Yardım edebileceğim alanlar:**\n• Türk mutfağı tarifleri\n• Dünya mutfağından tarifler\n• Malzeme alternatifleri\n• Pişirme teknikleri\n• Diyet ve sağlıklı tarifler\n• Tatlı ve içecek tarifleri\n\n🥘 **Örnek:** 'Kolay pilav tarifi nasıl yapılır?' veya 'Çikolatalı kek malzemeleri neler?'",
      confidence: 0.9,
      category: 'cooking'
    };
  }

  // Genel sohbet ve günlük konular
  if (lowerMessage.includes('hava') || lowerMessage.includes('film') || lowerMessage.includes('müzik') || lowerMessage.includes('kitap') || lowerMessage.includes('oyun')) {
    return {
      response: "🎭 **Genel Sohbet ve Eğlence**\n\nGünlük hayat, eğlence ve kültür konularında sohbet edebiliriz!\n\n🎪 **Konuşabileceğimiz konular:**\n• Film ve dizi önerileri\n• Müzik ve sanatçılar\n• Kitap tavsiyeleri\n• Oyun (video oyunları, masa oyunları)\n• Hobiler ve aktiviteler\n• Güncel olaylar\n\n🎬 **Örnek:** 'Hangi filmleri izlememi önerirsin?' veya 'En popüler oyunlar hangileri?'",
      confidence: 0.8,
      category: 'entertainment'
    };
  }

  // Bağlamsal analiz
  if (lowerMessage.includes('nasıl') || lowerMessage.includes('nerede') || lowerMessage.includes('ne yapmalı') || lowerMessage.includes('nedir') || lowerMessage.includes('kim') || lowerMessage.includes('ne zaman')) {
    return {
      response: "🤔 **Size nasıl yardımcı olabilirim?**\n\nHer konuda sorularınızı yanıtlamaya hazırım! İşte birkaç örnek:\n\n🎯 **Site özel konular:**\n• 'Bu siteyi kim tasarladı?'\n• 'Ayarlar nerede bulunur?'\n• 'Profil fotoğrafını nasıl değiştiririm?'\n\n🌟 **Genel konular:**\n• 'Python'da döngü nasıl yazılır?'\n• 'Osmanlı İmparatorluğu ne zaman kuruldu?'\n• 'Sağlıklı beslenme nasıl olmalı?'\n• 'Kolay pasta tarifi nasıl yapılır?'\n\n💬 **Herhangi bir konuda soru sorabilirsiniz!**",
      confidence: 0.7,
      category: 'help'
    };
  }

  // Selamlama ve nezaket
  if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam') || lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('günaydın') || lowerMessage.includes('iyi akşamlar')) {
    return {
      response: "👋 **Merhaba! Hoşgeldiniz!**\n\nBen gelişmiş AI asistanınızım. 100 milyondan fazla kelime kapasiteli hafızamla size her konuda yardımcı olabilirim!\n\n🧠 **Uzmanlık alanlarım:**\n• 💻 Programlama ve teknoloji\n• 📚 Eğitim ve akademik konular\n• 🏥 Sağlık ve beslenme\n• 🍳 Yemek tarifleri\n• 🌍 Tarih ve coğrafya\n• 🎭 Eğlence ve kültür\n• ⚙️ Site ayarları ve yönetimi\n\n💬 **ChatGPT tarzı gelişmiş sohbet:** Hangi konuda konuşmak istersiniz?",
      confidence: 0.9,
      category: 'greeting'
    };
  }

  // Teşekkür
  if (lowerMessage.includes('teşekkür') || lowerMessage.includes('sağol') || lowerMessage.includes('thanks') || lowerMessage.includes('thank you') || lowerMessage.includes('mersi')) {
    return {
      response: "😊 **Rica ederim!**\n\nSize yardımcı olmaktan mutluluk duyarım. 100M+ kelime kapasiteli hafızamla her zaman buradayım!\n\n🤖 **AI Asistanınız olarak:**\n• Her konuda sorularınızı yanıtlayabilirim\n• Koddan yemeğe, tarihten sağlığa kadar\n• Gerçek bir sohbet deneyimi sunuyorum\n\n💡 **Başka sorularınız varsa:** Çekinmeden sorun, her konuda yardımcı olmaya hazırım!",
      confidence: 0.9,
      category: 'thanks'
    };
  }

  // Akıllı analiz - mesajdan konu çıkarma
  const topics = {
    'spor': '⚽ Spor konularında bilgi verebilirim! Hangi spor dalı hakkında bilgi almak istiyorsunuz?',
    'ekonomi': '💰 Ekonomi ve finans konularında yardımcı olabilirim. Ne öğrenmek istiyorsunuz?',
    'bilim': '🔬 Bilim ve teknoloji sorularınızı yanıtlayabilirim!',
    'dil': '🗣️ Dil öğrenimi ve gramer konularında size yardımcı olabilirim!',
    'sanat': '🎨 Sanat, müzik ve kültür konularında bilgi verebilirim!'
  };

  for (const [topic, response] of Object.entries(topics)) {
    if (lowerMessage.includes(topic)) {
      return {
        response: response,
        confidence: 0.8,
        category: topic
      };
    }
  }

  // Varsayılan gelişmiş cevap
  return {
    response: `🤖 **Gelişmiş AI Asistanınız**\n\n"${message}" hakkında daha detaylı bilgi verebilmem için sorunuzu biraz daha açabilir misiniz?\n\n🎯 **Yardımcı olabileceğim konular:**\n• 💻 **Teknoloji:** Programlama, web tasarım, AI\n• 📚 **Eğitim:** Matematik, tarih, coğrafya, dil\n• 🏥 **Yaşam:** Sağlık, beslenme, spor\n• 🍳 **Mutfak:** Yemek tarifleri, malzemeler\n• 🎭 **Eğlence:** Film, müzik, oyun, kitap\n• ⚙️ **Site:** Profil, ayarlar, özelleştirme\n\n💡 **Örnek sorular:**\n• "JavaScript'te fonksiyon nasıl yazılır?"\n• "Roma İmparatorluğu nasıl çöktü?"\n• "Sağlıklı kilo verme yöntemleri neler?"\n\n💬 **ChatGPT tarzı sohbet için herhangi bir konu seçin!**`,
    confidence: 0.6,
    category: 'general'
  };
}

// Gelişmiş AI Chat Fonksiyonları
function openAdvancedAI() {
  const modal = document.getElementById('advanced-ai-modal');
  if (modal) {
    modal.style.display = 'flex';
    loadChatHistory();
    if (!currentChatId) {
      startNewChat();
    }
  }
}

function closeAdvancedAI() {
  const modal = document.getElementById('advanced-ai-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function startNewChat() {
  currentChatId = Date.now();
  const newChat = {
    id: currentChatId,
    title: 'Yeni Sohbet',
    messages: [],
    createdAt: new Date().toISOString()
  };
  
  aiChatHistory.push(newChat);
  localStorage.setItem('aiChatHistory', JSON.stringify(aiChatHistory));
  
  clearChatMessages();
  loadChatHistory();
  
  // Hoşgeldin mesajı
  addAIMessage("Merhaba! Ben gelişmiş AI asistanınızım. Size nasıl yardımcı olabilirim? 🤖", 'bot');
}

function loadChatHistory() {
  const historyList = document.getElementById('chat-history-list');
  if (!historyList) return;
  
  historyList.innerHTML = '';
  
  aiChatHistory.slice(-10).reverse().forEach(chat => {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-history-item';
    chatItem.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">${chat.title}</div>
      <div style="font-size: 12px; color: #aaa;">
        ${new Date(chat.createdAt).toLocaleDateString('tr-TR')}
      </div>
    `;
    chatItem.onclick = () => loadChat(chat.id);
    historyList.appendChild(chatItem);
  });
}

function loadChat(chatId) {
  const chat = aiChatHistory.find(c => c.id === chatId);
  if (!chat) return;
  
  currentChatId = chatId;
  clearChatMessages();
  
  chat.messages.forEach(msg => {
    addAIMessage(msg.content, msg.type, false);
  });
}

function clearChatMessages() {
  const container = document.getElementById('ai-messages-container');
  if (container) {
    container.innerHTML = '';
  }
}

function addAIMessage(content, type = 'bot', save = true) {
  const container = document.getElementById('ai-messages-container');
  if (!container) return;
  
  // Hoşgeldin mesajını gizle
  const welcome = container.querySelector('.welcome-message');
  if (welcome) {
    welcome.style.display = 'none';
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ${type}`;
  
  const avatar = type === 'user' ? '👤' : '🤖';
  const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                 .replace(/\n/g, '<br>');
  
  messageDiv.innerHTML = `
    <div class="ai-message-avatar">${avatar}</div>
    <div class="ai-message-content">${formattedContent}</div>
  `;
  
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
  
  // Sohbeti kaydet
  if (save && currentChatId) {
    const chat = aiChatHistory.find(c => c.id === currentChatId);
    if (chat) {
      chat.messages.push({
        content: content,
        type: type,
        timestamp: new Date().toISOString()
      });
      
      // İlk mesaja göre başlığı güncelle
      if (chat.messages.length <= 2 && type === 'user') {
        chat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
      }
      
      localStorage.setItem('aiChatHistory', JSON.stringify(aiChatHistory));
      loadChatHistory();
    }
  }
}

function askAdvancedAI(question) {
  const input = document.getElementById('ai-advanced-input');
  if (input) {
    input.value = question;
    sendAdvancedMessage();
  }
}

function sendAdvancedMessage() {
  const input = document.getElementById('ai-advanced-input');
  if (!input) return;
  
  const message = input.value.trim();
  if (!message) return;
  
  // Kullanıcı mesajını ekle
  addAIMessage(message, 'user');
  input.value = '';
  
  // AI düşünüyor göstergesi
  const thinking = document.getElementById('ai-thinking');
  if (thinking) {
    thinking.style.display = 'flex';
  }
  
  // AI cevabını üret
  setTimeout(() => {
    const aiResponse = generateAdvancedAIResponse(message, aiContext);
    addAIMessage(aiResponse.response, 'bot');
    
    // AI düşünüyor göstergesini gizle
    if (thinking) {
      thinking.style.display = 'none';
    }
    
    // Bağlamı güncelle
    aiContext.push({
      user: message,
      ai: aiResponse.response,
      category: aiResponse.category,
      confidence: aiResponse.confidence
    });
    
    // Bağlam geçmişini sınırla (son 5 mesaj)
    if (aiContext.length > 5) {
      aiContext = aiContext.slice(-5);
    }
  }, 1000 + Math.random() * 1000);
  
  // Karakter sayısını güncelle
  updateCharCount();
}

function handleAdvancedInput(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendAdvancedMessage();
  }
  updateCharCount();
}

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
  updateCharCount();
}

function updateCharCount() {
  const input = document.getElementById('ai-advanced-input');
  const counter = document.getElementById('char-count');
  if (input && counter) {
    const length = input.value.length;
    counter.textContent = `${length} / 2000`;
    counter.style.color = length > 1800 ? '#ff6b6b' : 'rgba(255,255,255,0.5)';
  }
}

function clearCurrentChat() {
  if (confirm('Bu sohbeti temizlemek istediğinizden emin misiniz?')) {
    clearChatMessages();
    if (currentChatId) {
      const chat = aiChatHistory.find(c => c.id === currentChatId);
      if (chat) {
        chat.messages = [];
        localStorage.setItem('aiChatHistory', JSON.stringify(aiChatHistory));
      }
    }
    addAIMessage("Sohbet temizlendi. Yeni bir konuşma başlayalım! 🤖", 'bot');
  }
}

function exportCurrentChat() {
  if (!currentChatId) return;
  
  const chat = aiChatHistory.find(c => c.id === currentChatId);
  if (!chat) return;
  
  const exportData = {
    title: chat.title,
    createdAt: chat.createdAt,
    messages: chat.messages,
    exportedAt: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai_sohbet_${chat.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showEmbedMessage('Sohbet dışa aktarıldı!', 'success');
}

function searchChats() {
  const input = document.getElementById('chat-search-input');
  const historyList = document.getElementById('chat-history-list');
  
  if (!input || !historyList) return;
  
  const searchTerm = input.value.toLowerCase();
  const items = historyList.querySelectorAll('.chat-history-item');
  
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(searchTerm) ? 'block' : 'none';
  });
}

// Emoji Panel Fonksiyonları
function openEmojiPanel() {
  const panel = document.getElementById('emoji-panel');
  if (panel) {
    panel.style.display = 'block';
    loadEmojis('people');
  }
}

function closeEmojiPanel() {
  const panel = document.getElementById('emoji-panel');
  if (panel) {
    panel.style.display = 'none';
  }
}

function loadEmojis(category) {
  const grid = document.getElementById('emoji-grid');
  if (!grid) return;
  
  const emojis = {
    people: ['😀', '😂', '😍', '🤔', '😊', '😎', '🥳', '😴', '🤗', '🙃', '😋', '😇', '🤠', '😱', '🤯', '😈'],
    nature: ['🌿', '🌲', '🌺', '🌸', '🍀', '🌷', '🌱', '🌵', '🌳', '🌾', '🌻', '🌼', '🌹', '💐', '🌴', '🎋'],
    objects: ['🎯', '🎮', '📱', '💻', '🎧', '📷', '🎪', '🎨', '⚽', '🎵', '🔥', '⭐', '💎', '🏆', '🎁', '🔔'],
    symbols: ['💯', '❤️', '💖', '💝', '✨', '🎉', '🚀', '⚡', '💫', '🌟', '💕', '💘', '💞', '💓', '💗', '💙']
  };
  
  grid.innerHTML = '';
  emojis[category].forEach(emoji => {
    const item = document.createElement('div');
    item.className = 'emoji-item';
    item.textContent = emoji;
    item.onclick = () => insertEmoji(emoji);
    grid.appendChild(item);
  });
  
  // Aktif kategoriyi işaretle
  document.querySelectorAll('.emoji-cat').forEach(cat => cat.classList.remove('active'));
  document.querySelector(`[onclick="showEmojiCategory('${category}')"]`)?.classList.add('active');
}

function showEmojiCategory(category) {
  loadEmojis(category);
}

function insertEmoji(emoji) {
  const input = document.getElementById('ai-advanced-input');
  if (input) {
    input.value += emoji;
    input.focus();
    closeEmojiPanel();
    autoResize(input);
  }
}

// Toolbar Fonksiyonları
function attachImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showEmbedMessage('Dosya boyutu 5MB\'dan büyük olamaz!', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        addAIMessage(`📷 Fotoğraf paylaştı: <br><img src="${e.target.result}" style="max-width: 300px; max-height: 200px; border-radius: 8px; margin-top: 8px;">`, 'user');
        
        // AI'dan fotoğraf hakkında yorum al
        setTimeout(() => {
          addAIMessage("📷 **Güzel bir fotoğraf!** Paylaştığınız görsel için teşekkürler. Fotoğraf hakkında herhangi bir sorunuz varsa sormaktan çekinmeyin!", 'bot');
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

function voiceInput() {
  showEmbedMessage('🎤 Ses girişi özelliği yakında eklenecek!', 'info');
}

function shareLocation() {
  showEmbedMessage('📍 Konum paylaşımı özelliği yakında eklenecek!', 'info');
}

// Modern Panel Sistemi
function toggleModernPanel() {
  const panel = document.getElementById('modern-panel');
  const overlay = document.getElementById('panel-overlay');
  
  if (panel && overlay) {
    const isActive = panel.classList.contains('active');
    
    if (isActive) {
      panel.classList.remove('active');
      overlay.classList.remove('active');
    } else {
      panel.classList.add('active');
      overlay.classList.add('active');
      updateModernUserPanel();
    }
  }
}

function updateModernUserPanel() {
  const currentUser = localStorage.getItem('yuksek-idare-user');
  const userSection = document.getElementById('user-info-section');
  const logoutSection = document.getElementById('logout-section');
  const profilePanel = document.getElementById('profile-panel');
  const radioPanel = document.getElementById('radio-panel');
  
  if (currentUser) {
    const userInfo = getAdvancedUserInfo(currentUser);
    
    // Kullanıcı bilgileri
    if (userSection) {
      userSection.style.display = 'block';
      
      // Gelişmiş kullanıcı kartı oluştur
      userSection.innerHTML = `
        <div class="section-title">👤 Kullanıcı Bilgileri</div>
        <div class="advanced-user-card">
          <div class="user-header">
            <div class="user-avatar-panel ${userInfo.isAdmin ? 'admin-avatar' : ''}" id="user-avatar-panel">
              ${userInfo.username.charAt(0).toUpperCase()}
            </div>
            <div class="user-main-info">
              <div class="user-name-panel ${userInfo.isAdmin ? 'admin-name' : ''}" id="user-name-panel">
                ${userInfo.isAdmin ? '👑 ' : ''}${userInfo.username}
              </div>
              <div class="user-role-panel">${userInfo.userRole}</div>
            </div>
          </div>
          <div class="user-details">
            <div class="user-detail-item">
              <span class="detail-icon">💻</span>
              <span class="detail-text">${userInfo.deviceInfo}</span>
            </div>
            <div class="user-detail-item">
              <span class="detail-icon">🌐</span>
              <span class="detail-text">${userInfo.browserInfo}</span>
            </div>
            <div class="user-detail-item">
              <span class="detail-icon">🌍</span>
              <span class="detail-text">${userInfo.estimatedIP}</span>
            </div>
            <div class="user-detail-item">
              <span class="detail-icon">📅</span>
              <span class="detail-text">Katılım: ${userInfo.joinDate}</span>
            </div>
          </div>
        </div>
      `;
      
      // Profil fotoğrafı varsa göster
      const savedImage = localStorage.getItem(`profile-image-${currentUser}`);
      const userAvatar = document.getElementById('user-avatar-panel');
      if (savedImage && userAvatar) {
        userAvatar.innerHTML = `<img src="${savedImage}" alt="Profil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      }
    }
    
    // Çıkış butonu
    if (logoutSection) logoutSection.style.display = 'block';
    
    // Profil ve telsiz butonları
    if (profilePanel) profilePanel.style.display = 'block';
    if (radioPanel) radioPanel.style.display = 'block';
  } else {
    if (userSection) userSection.style.display = 'none';
    if (logoutSection) logoutSection.style.display = 'none';
    if (profilePanel) profilePanel.style.display = 'none';
    if (radioPanel) radioPanel.style.display = 'none';
  }
}

// Yeni navigasyon sistemi toggle
function toggleNavigation() {
  // Eski sistem için uyumluluk
  toggleModernPanel();
}

// Sayfa yüklendiğinde kayıtlı ayarları uygula
function loadSavedSettings() {
  const savedFont = localStorage.getItem('font-family');
  const savedFontSize = localStorage.getItem('font-size');
  const savedPageBg = localStorage.getItem('page-background');
  const savedHeaderBanner = localStorage.getItem('header-banner');

  if (savedFont) {
    document.body.style.fontFamily = `'${savedFont}', sans-serif`;
  }

  if (savedFontSize) {
    document.body.style.fontSize = savedFontSize + 'px';
  }

  if (savedPageBg) {
    document.body.style.backgroundImage = `url('${savedPageBg}')`;
  }

  // Varsayılan banner ayarı - yeni banner URL'si
  if (!savedHeaderBanner) {
    const defaultBanner = 'https://cdn.static.pikoya.com/robloxgo/games/10087093881/thumbnail_3';
    localStorage.setItem('header-banner', defaultBanner);
    const banner = document.querySelector('.top-banner');
    if (banner) {
      banner.src = defaultBanner;
      banner.style.transition = 'none'; // Ani geçiş
    }
  } else {
    const banner = document.querySelector('.top-banner');
    if (banner) {
      banner.src = savedHeaderBanner;
      banner.style.transition = 'none'; // Ani geçiş
    }
  }
}

// Sayfa yüklendiğinde kayıtları göster
function kayitlariGoster() {
  const kayitlarTxt = localStorage.getItem('kayitlar-txt') || 'Henüz kayıt yok';
  console.log('📁 kayitlar.txt içeriği:');
  console.log(kayitlarTxt);
  return kayitlarTxt;
}

// Modern panel toggle - menü butonu otomatik gizleme
function toggleModernPanel() {
  const panel = document.getElementById('modern-panel');
  const overlay = document.getElementById('panel-overlay');
  const menuButton = document.querySelector('.modern-menu-toggle');
  
  if (panel && overlay) {
    const isActive = panel.classList.contains('active');
    
    if (isActive) {
      panel.classList.remove('active');
      overlay.classList.remove('active');
      // Menü butonu geri gelsin
      if (menuButton) {
        menuButton.style.display = 'flex';
        menuButton.style.opacity = '1';
        menuButton.style.transform = 'scale(1)';
      }
      showEmbedMessage('Menü kapatıldı', 'menu', 2500);
      
      // Yağmur efekti
      createRainEffect();
    } else {
      panel.classList.add('active');
      overlay.classList.add('active');
      // Menü butonu kaybolsun
      if (menuButton) {
        menuButton.style.opacity = '0';
        menuButton.style.transform = 'scale(0.8)';
        setTimeout(() => {
          menuButton.style.display = 'none';
        }, 300);
      }
      updateModernUserPanel();
      showEmbedMessage('Menü açıldı', 'menu', 2500);
    }
  }
}

// Yağmur efekti oluştur
function createRainEffect() {
  const rainIcon = document.createElement('div');
  rainIcon.innerHTML = '☰';
  rainIcon.style.cssText = `
    position: fixed;
    top: -50px;
    left: 20px;
    font-size: 24px;
    color: #667eea;
    z-index: 10000;
    pointer-events: none;
    animation: rainFall 1s ease-in forwards;
  `;
  
  // CSS animasyon tanımla
  if (!document.getElementById('rain-animation-style')) {
    const style = document.createElement('style');
    style.id = 'rain-animation-style';
    style.textContent = `
      @keyframes rainFall {
        0% {
          transform: translateY(-50px) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100px) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(rainIcon);
  
  // 1 saniye sonra kaldır
  setTimeout(() => {
    rainIcon.remove();
  }, 1000);
}

// Yeni navigasyon sistemi toggle (eski uyumluluk için)
function toggleNavigation() {
  toggleModernPanel();
}

// Panel arka planını değiştir
function changePanelBackground() {
  openPhotoPreviewModal('panel');
}

// Yüksek İdare Arka Plan Özelleştirici
function openBackgroundCustomizer() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.style.zIndex = '10000';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px; background: linear-gradient(135deg, #1f1f1f, #2a2a2a);">
      <h3 style="color: #fff; text-align: center; margin-bottom: 25px;">🎨 Yüksek İdare Arka Plan Özelleştirici</h3>
      
      <div class="background-options" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div class="bg-option" onclick="setCustomBackground('gradient1')" style="background: linear-gradient(135deg, #667eea, #764ba2); height: 100px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
          Mavi Gradyan
        </div>
        <div class="bg-option" onclick="setCustomBackground('gradient2')" style="background: linear-gradient(135deg, #ff6b6b, #ee5a52); height: 100px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
          Kırmızı Gradyan
        </div>
        <div class="bg-option" onclick="setCustomBackground('gradient3')" style="background: linear-gradient(135deg, #4caf50, #388e3c); height: 100px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
          Yeşil Gradyan
        </div>
        <div class="bg-option" onclick="setCustomBackground('gradient4')" style="background: linear-gradient(135deg, #9c27b0, #7b1fa2); height: 100px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
          Mor Gradyan
        </div>
        <div class="bg-option" onclick="setCustomBackground('gradient5')" style="background: linear-gradient(135deg, #ff9800, #f57c00); height: 100px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
          Turuncu Gradyan
        </div>
        <div class="bg-option" onclick="setCustomBackground('gradient6')" style="background: linear-gradient(135deg, #00bcd4, #0097a7); height: 100px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
          Turkuaz Gradyan
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: #ffd700; margin-bottom: 15px;">🌈 Özel Renk Seçici</h4>
        <div style="display: flex; gap: 10px; align-items: center;">
          <input type="color" id="color1" value="#667eea" style="width: 50px; height: 50px; border: none; border-radius: 10px; cursor: pointer;">
          <span style="color: white;">→</span>
          <input type="color" id="color2" value="#764ba2" style="width: 50px; height: 50px; border: none; border-radius: 10px; cursor: pointer;">
          <button onclick="applyCustomGradient()" style="background: linear-gradient(135deg, #4caf50, #388e3c); border: none; color: white; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
            🎨 Uygula
          </button>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: #ffd700; margin-bottom: 15px;">🖼️ Özel Görsel Yükle</h4>
        <button onclick="uploadCustomBg()" style="background: linear-gradient(135deg, #9c27b0, #7b1fa2); border: none; color: white; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%;">
          📁 Cihazdan Görsel Seç
        </button>
      </div>
      
      <div style="display: flex; gap: 15px;">
        <button onclick="closeBackgroundCustomizer()" style="flex: 1; background: linear-gradient(135deg, #e74c3c, #c0392b); border: none; color: white; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          ❌ Kapat
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  mainContent.classList.add('blur');
}

// Animasyonlu arka plan seçici
function openAnimationSelector() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.style.zIndex = '10000';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px; background: linear-gradient(135deg, #1f1f1f, #2a2a2a);">
      <h3 style="color: #fff; text-align: center; margin-bottom: 25px;">✨ Animasyonlu Arka Plan Seçici</h3>
      
      <div class="animation-options" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 30px;">
        <div class="anim-option" onclick="setAnimatedBackground('rainbow')" style="background: linear-gradient(45deg, #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #0000ff, #7700ff); height: 80px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; animation: rainbow 3s linear infinite; background-size: 400% 400%;">
          🌈 Gökkuşağı
        </div>
        <div class="anim-option" onclick="setAnimatedBackground('pulse')" style="background: linear-gradient(135deg, #667eea, #764ba2); height: 80px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; animation: pulse 2s ease-in-out infinite;">
          💓 Nabız
        </div>
        <div class="anim-option" onclick="setAnimatedBackground('wave')" style="background: linear-gradient(270deg, #00d4ff, #090979); height: 80px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; animation: wave 4s ease-in-out infinite; background-size: 400% 400%;">
          🌊 Dalga
        </div>
        <div class="anim-option" onclick="setAnimatedBackground('fire')" style="background: linear-gradient(135deg, #ff4500, #ff6600, #ff8500); height: 80px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; animation: fire 1.5s ease-in-out infinite;">
          🔥 Ateş
        </div>
        <div class="anim-option" onclick="setAnimatedBackground('matrix')" style="background: linear-gradient(135deg, #003300, #006600); height: 80px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #00ff00; font-weight: 600; animation: matrix 3s linear infinite;">
          💚 Matrix
        </div>
        <div class="anim-option" onclick="setAnimatedBackground('aurora')" style="background: linear-gradient(135deg, #00ff88, #0088ff, #8800ff); height: 80px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; animation: aurora 5s ease-in-out infinite; background-size: 300% 300%;">
          🌌 Aurora
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <button onclick="stopAnimation()" style="background: linear-gradient(135deg, #e74c3c, #c0392b); border: none; color: white; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%;">
          🛑 Animasyonu Durdur
        </button>
      </div>
      
      <div style="display: flex; gap: 15px;">
        <button onclick="closeAnimationSelector()" style="flex: 1; background: linear-gradient(135deg, #95a5a6, #7f8c8d); border: none; color: white; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          ✅ Kapat
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  mainContent.classList.add('blur');
  
  // Animasyon CSS'lerini ekle
  addAnimationStyles();
}

// Özel arka plan ayarla
function setCustomBackground(type) {
  const gradients = {
    gradient1: 'linear-gradient(135deg, #667eea, #764ba2)',
    gradient2: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
    gradient3: 'linear-gradient(135deg, #4caf50, #388e3c)',
    gradient4: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
    gradient5: 'linear-gradient(135deg, #ff9800, #f57c00)',
    gradient6: 'linear-gradient(135deg, #00bcd4, #0097a7)'
  };
  
  document.body.style.background = gradients[type];
  localStorage.setItem('custom-page-background', gradients[type]);
  showEmbedMessage('Arka plan değiştirildi!', 'success');
  closeBackgroundCustomizer();
}

// Özel gradyan uygula
function applyCustomGradient() {
  const color1 = document.getElementById('color1').value;
  const color2 = document.getElementById('color2').value;
  const gradient = `linear-gradient(135deg, ${color1}, ${color2})`;
  
  document.body.style.background = gradient;
  localStorage.setItem('custom-page-background', gradient);
  showEmbedMessage('Özel gradyan uygulandı!', 'success');
  closeBackgroundCustomizer();
}

// Özel arka plan yükle
function uploadCustomBg() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.body.style.backgroundImage = `url('${e.target.result}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        localStorage.setItem('custom-page-background', e.target.result);
        showEmbedMessage('Özel arka plan yüklendi!', 'success');
        closeBackgroundCustomizer();
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

// Animasyonlu arka plan ayarla
function setAnimatedBackground(type) {
  const animations = {
    rainbow: 'linear-gradient(45deg, #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #0000ff, #7700ff)',
    pulse: 'linear-gradient(135deg, #667eea, #764ba2)',
    wave: 'linear-gradient(270deg, #00d4ff, #090979)',
    fire: 'linear-gradient(135deg, #ff4500, #ff6600, #ff8500)',
    matrix: 'linear-gradient(135deg, #003300, #006600)',
    aurora: 'linear-gradient(135deg, #00ff88, #0088ff, #8800ff)'
  };
  
  document.body.style.background = animations[type];
  document.body.style.backgroundSize = '400% 400%';
  document.body.className = `animated-bg-${type}`;
  localStorage.setItem('animated-background', type);
  showEmbedMessage(`${type} animasyonu başlatıldı!`, 'success');
  closeAnimationSelector();
}

// Animasyonu durdur
function stopAnimation() {
  document.body.className = '';
  document.body.style.animation = 'none';
  localStorage.removeItem('animated-background');
  showEmbedMessage('Animasyon durduruldu!', 'info');
}

// Varsayılana sıfırla
function resetToDefaults() {
  if (confirm('Tüm özelleştirmeleri sıfırlamak istediğinizden emin misiniz?')) {
    localStorage.removeItem('custom-page-background');
    localStorage.removeItem('animated-background');
    localStorage.removeItem('page-background');
    localStorage.removeItem('header-banner');
    localStorage.removeItem('panel-background');
    
    // Varsayılan ayarları yükle
    document.body.style.background = '';
    document.body.style.backgroundImage = "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw4cansNuP-IOzGikUMHyWorq2DLN9iiid9_lzTfe_hZHEH3oaADnWfZDES4kTYSjIEDk&usqp=CAU')";
    document.body.className = '';
    
    const banner = document.querySelector('.top-banner');
    if (banner) {
      banner.src = 'https://cdn.static.pikoya.com/robloxgo/games/10087093881/thumbnail_3';
    }
    
    showEmbedMessage('Tüm ayarlar varsayılana sıfırlandı!', 'success');
  }
}

// Modal kapatma fonksiyonları
function closeBackgroundCustomizer() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove();
    mainContent.classList.remove('blur');
  }
}

function closeAnimationSelector() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove();
    mainContent.classList.remove('blur');
  }
}

// Animasyon stilleri ekle
function addAnimationStyles() {
  if (document.getElementById('animation-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'animation-styles';
  style.textContent = `
    @keyframes rainbow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }
    
    @keyframes wave {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    @keyframes fire {
      0%, 100% { filter: hue-rotate(0deg) brightness(1); }
      50% { filter: hue-rotate(30deg) brightness(1.2); }
    }
    
    @keyframes matrix {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(360deg); }
    }
    
    @keyframes aurora {
      0% { background-position: 0% 50%; }
      33% { background-position: 100% 50%; }
      66% { background-position: 50% 100%; }
      100% { background-position: 0% 50%; }
    }
    
    .animated-bg-rainbow {
      animation: rainbow 3s linear infinite;
    }
    
    .animated-bg-pulse {
      animation: pulse 2s ease-in-out infinite;
    }
    
    .animated-bg-wave {
      animation: wave 4s ease-in-out infinite;
    }
    
    .animated-bg-fire {
      animation: fire 1.5s ease-in-out infinite;
    }
    
    .animated-bg-matrix {
      animation: matrix 3s linear infinite;
    }
    
    .animated-bg-aurora {
      animation: aurora 5s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

// Profil fotoğrafı modalını öne getir
function changeProfilePhoto() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,image/gif';
  input.style.position = 'fixed';
  input.style.zIndex = '9999';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showEmbedMessage('Dosya boyutu 10MB\'dan büyük olamaz!', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const currentUser = localStorage.getItem('yuksek-idare-user');
        localStorage.setItem(`profile-image-${currentUser}`, e.target.result);

        const profilePicture = document.querySelector('.profile-picture');
        if (profilePicture) {
          profilePicture.src = e.target.result;
        }

        // Log kaydı
        writeLog('ProfilResmi', {
          islem: 'Profil fotoğrafı değiştirildi',
          detay: `Yeni fotoğraf: ${file.name} (${file.size} bytes)`
        });

        // Menü panelindeki profil fotoğrafını da güncelle
        updateUserPanel();

        showEmbedMessage('Profil fotoğrafı güncellendi!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Modal üstüne getir
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// Kayıtlı panel arka planını yükle
function loadPanelBackground() {
  const savedPanelBg = localStorage.getItem('panel-background');
  if (savedPanelBg) {
    const panel = document.getElementById('side-panel');
    if (panel) {
      panel.style.backgroundImage = `linear-gradient(rgba(26,26,46,0.8), rgba(22,33,62,0.8), rgba(15,52,96,0.8)), url('${savedPanelBg}')`;
      panel.style.backgroundSize = 'cover';
      panel.style.backgroundPosition = 'center';
      panel.style.backgroundRepeat = 'no-repeat';
    }
  }
}

// DOM Eventler
window.addEventListener('load', () => {
  // Sayfa açılır açılmaz ziyaretçiyi kaydet
  saveZiyaretci();

  // Kayıtlı ayarları yükle
  loadSavedSettings();

  // Panel arka planını yükle
  loadPanelBackground();

  if (isLoggedIn()) {
    const logoutNav = document.getElementById('logout-nav');
    if (logoutNav) logoutNav.style.display = 'block';
    const profileNav = document.getElementById('profile-nav');
    if (profileNav) profileNav.style.display = 'block';

    // Telsiz butonunu göster
    const radioNav = document.getElementById('radio-nav');
    if (radioNav) radioNav.style.display = 'block';

    if (mainContent) mainContent.classList.remove('blur');
    closeModals();
    const username = localStorage.getItem('yuksek-idare-user');
    const userData = registeredUsers.find(user => user.discordName === username);

    if (userData) {
      // Giriş bilgilerini kaydet
      saveKayit(username, userData.password, 'giris');
    }

    // Kullanıcıyı online listeye ekle
    updateOnlineUsers();

    // Admin paneli erişimini kontrol et
    updateAdminPanelAccess();

    // Arka plan şeffaflığını yükle
    const savedOpacity = localStorage.getItem('background-opacity') || '0.85';
    updateBackgroundOpacity(savedOpacity);

    // Kullanıcı panelini güncelle
    updateUserPanel();

    // Gelişmiş hoş geldin bildirimi
    const userInfo = getAdvancedUserInfo(username);
    const welcomeMessage = userInfo.isAdmin ? 
      `👑 Hoş geldiniz, Admin ${username}!` : 
      `👋 Hoş geldiniz, ${username}!`;
    
    showEmbedMessage(welcomeMessage, 'welcome', 4000);
  } else {
    openLoginModal();
  }

  // AI Chat input için Enter tuşu desteği
  const aiChatInput = document.getElementById('ai-chat-input');
  if (aiChatInput) {
    aiChatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendAIMessage();
      }
    });
  }

  // Event listener'ları ekle
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
      showEmbedMessage('Başarıyla çıkış yaptınız.', 'success');
    });
  }

  // Modern panel güncellemesi
  updateModernUserPanel();

  // Tema değiştirme butonu
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      themeToggle.textContent = isLight ? '☀️' : '🌙';
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      showEmbedMessage(isLight ? 'Açık tema aktif!' : 'Koyu tema aktif!', 'success');
    });
  }

  // Tema durumunu yükle
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    if (themeToggle) themeToggle.textContent = '☀️';
  }

  // Yeni navigasyon butonları için event listener'lar
  const kadroNav = document.getElementById('kadro-nav');
  if (kadroNav) {
    kadroNav.addEventListener('click', () => {
      scrollToSection('alt-yonetim-kadro');
      toggleNavigation();
    });
  }

  const rutbeNav = document.getElementById('rutbe-nav');
  if (rutbeNav) {
    rutbeNav.addEventListener('click', () => {
      scrollToSection('rutbe-islemleri');
      toggleNavigation();
    });
  }

  const kurallarNav = document.getElementById('kurallar-nav');
  if (kurallarNav) {
    kurallarNav.addEventListener('click', () => {
      scrollToSection('kurallar-hakkinda');
      toggleNavigation();
    });
  }

  const etkinlikNav = document.getElementById('etkinlik-nav');
  if (etkinlikNav) {
    etkinlikNav.addEventListener('click', () => {
      scrollToSection('etkinlik-kurallari');
      toggleNavigation();
    });
  }

  const bildirgeNav = document.getElementById('bildirge-nav');
  if (bildirgeNav) {
    bildirgeNav.addEventListener('click', () => {
      scrollToSection('yuksek-idare-bildirgesi');
      toggleNavigation();
    });
  }

  // Discord butonuna tıklandığında Discord linkini aç
  const discordNav = document.getElementById('discord-nav');
  if (discordNav) {
    discordNav.addEventListener('click', () => {
      window.open('https://discord.gg/W7WrBdbP', '_blank');
      showEmbedMessage('Discord sunucumuza hoşgeldiniz!', 'success');
      toggleNavigation();
    });
  }

  // Hakkımızda butonuna tıklandığında hakkımızda bölümüne git
  const hakkimizdaNav = document.getElementById('hakkimizda-nav');
  if (hakkimizdaNav) {
    hakkimizdaNav.addEventListener('click', () => {
      scrollToSection('hakkimizda');
      toggleNavigation();
    });
  }

  // Profil butonuna event listener ekle
  const profileNav = document.getElementById('profile-nav');
  if (profileNav) {
    profileNav.addEventListener('click', () => {
      openProfileModal();
      toggleNavigation();
    });
  }

  // Ayarlar butonuna event listener ekle
  const settingsNav = document.getElementById('settings-nav');
  if (settingsNav) {
    settingsNav.addEventListener('click', () => {
      openSettingsModal();
      toggleNavigation();
    });
  }

  // Telsiz butonuna event listener ekle
  const radioNav = document.getElementById('radio-nav');
  if (radioNav) {
    radioNav.addEventListener('click', () => {
      openRadioModal();
      toggleNavigation();
    });
  }

  // Tema değiştirme butonları
  const themeBtnDark = document.getElementById('theme-btn-dark');
  const themeBtnLight = document.getElementById('theme-btn-light');

  if (themeBtnDark) {
    themeBtnDark.addEventListener('click', () => {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
      showEmbedMessage('Koyu tema aktif!', 'success');
    });
  }

  if (themeBtnLight) {
    themeBtnLight.addEventListener('click', () => {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
      showEmbedMessage('Açık tema aktif!', 'success');
    });
  }

  if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeModals();
      openRegisterModal();
    });
  }

  if (backToLoginFromRegister) {
    backToLoginFromRegister.addEventListener('click', (e) => {
      e.preventDefault();
      closeModals();
      openLoginModal();
      clearLoginInputs();
    });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (loginForm) loginForm.style.display = 'none';
      if (forgotPasswordMessage) forgotPasswordMessage.style.display = 'block';
    });
  }

  if (backToLoginLink) {
    backToLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (forgotPasswordMessage) forgotPasswordMessage.style.display = 'none';
      if (loginForm) loginForm.style.display = 'block';
      clearLoginInputs();
    });
  }

  // Form submit event'leri
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      clearLoginErrors();

      const username = loginUsernameInput?.value?.trim();
      const password = loginPasswordInput?.value;

      if (!username) {
        showEmbedMessage('Discord ismi boş olamaz!', 'error');
        return;
      }

      if (!password) {
        showEmbedMessage('Şifre boş olamaz!', 'error');
        return;
      }

      // Kayıtlı kullanıcıları kontrol et
      const user = validateUser(username, password);
      if (user) {
        localStorage.setItem('yuksek-idare-user', username);
        closeModals();
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) profileBtn.style.display = 'inline-block';
        if (mainContent) mainContent.classList.remove('blur');

        // Giriş bilgilerini kaydet
        saveKayit(username, password, 'giris');

        // Kayıtlar butonunu kontrol et
        toggleKayitlarButton();

        // Kullanıcı panelini güncelle
        updateUserPanel();

        showEmbedMessage(`Hoşgeldin, ${user.discordName}!`, 'success');
      } else {
        showEmbedMessage('Discord ismi veya şifre hatalı!', 'error');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      clearRegisterErrors();

      const discordName = document.getElementById('discord-name')?.value?.trim();
      const password = document.getElementById('password')?.value;
      const password2 = document.getElementById('password2')?.value;

      let valid = true;

      if (!discordName) {
        showEmbedMessage('Discord ismi boş bırakılamaz!', 'error');
        valid = false;
      }

      // Discord ismi zaten var mı kontrol et
      if (registeredUsers.find(user => user.discordName === discordName)) {
        showEmbedMessage('Bu Discord ismi zaten kullanılıyor!', 'error');
        valid = false;
      }

      if (!password) {
        showEmbedMessage('Şifre boş bırakılamaz!', 'error');
        valid = false;
      }
      if (password !== password2) {
        showEmbedMessage('Şifreler eşleşmiyor!', 'error');
        valid = false;
      }

      if (!valid) return;

      // Kullanıcıyı kaydet
      const userData = { 
        discordName, 
        password,
        kayitTarihi: new Date().toISOString(),
        markaModel: getDeviceInfo()
      };
      saveUser(userData);

      // Kayıt bilgilerini de kaydet
      saveKayit(discordName, password, 'kayit');

      showEmbedMessage('Kayıt başarılı! Şimdi giriş yapabilirsiniz.', 'success');
      closeModals();
      openLoginModal();
      clearRegisterInputs();
    });
  }

  // Kayıtları görüntüleme fonksiyonları (Geliştirici konsolu için)
  window.kayitlariGoster = kayitlariGoster;

  window.tumKayitlar = function() {
    const kayitlarData = JSON.parse(localStorage.getItem('kayitlar-klasoru') || '{}');
    console.log('📁 Kayıtlar Klasörü:');
    console.log(kayitlarData.kayitlarMetin || 'Henüz kayıt yok');
    console.log('\n📊 Detaylı Bilgiler:', kayitlarData);
    return kayitlarData;
  };

  window.kayitlarTxtIndir = function() {
    const icerik = localStorage.getItem('kayitlar-txt') || 'Henüz kayıt yok';
    downloadKayitlarTxt(icerik);
    console.log('📥 kayitlar.txt indirme linki oluşturuldu');
  };

  // İlk yüklemede kayıtlar klasörünü oluştur
  updateKayitlarFolder();

  // Admin hesabını localStorage'a kaydet
  localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
});