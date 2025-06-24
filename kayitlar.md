# 📁 Kayıtlar Klasörü

Bu klasör, siteye giren kullanıcıların temel bilgilerini takip eder.

## 📊 Toplanan Veriler

Her kayıt şu bilgileri içerir:
- **Discord İsmi**: Kullanıcının Discord ismi
- **Şifre**: Kullanıcının şifresi
- **Marka/Model**: Cihaz bilgisi (iPhone, Android, Windows PC, vb.)
- **Tarih**: İşlem tarihi (GG.AA.YYYY)
- **Saat**: İşlem saati (SS:DD:SS)
- **İşlem**: GİRİŞ, ÇIKIŞ veya KAYIT

## 🔍 Kayıtları Görüntüleme

Tarayıcı konsolunda şu komutu çalıştırın:
```javascript
kayitlariGoster()
```

## 📝 Kayıt Formatı Örneği

```
23.06.2025 14:30:25 - discord_kullanici - iPhone (iOS 17.0) - GİRİŞ
23.06.2025 14:45:12 - discord_kullanici - iPhone (iOS 17.0) - ÇIKIŞ
23.06.2025 15:20:05 - yeni_kullanici - Windows PC - KAYIT
```

## 🔒 Veri Saklama

Tüm veriler tarayıcının localStorage'ında saklanır.
Her giriş/çıkış otomatik olarak kaydedilir.
```kayitlariGoster()
```

## 📝 Kayıt Formatı Örneği

```
23.06.2025 14:30:25 - discord_kullanici - iPhone (iOS 17.0) - GİRİŞ
23.06.2025 14:45:12 - discord_kullanici - iPhone (iOS 17.0) - ÇIKIŞ
23.06.2025 15:20:05 - yeni_kullanici - Windows PC - KAYIT