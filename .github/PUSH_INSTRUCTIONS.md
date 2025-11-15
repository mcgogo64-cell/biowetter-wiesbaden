# GitHub'a Push Etme Talimatları

## 1. GitHub'da Repository Oluşturun

1. https://github.com adresine gidin
2. Sağ üst köşedeki **"+"** butonuna tıklayın
3. **"New repository"** seçin
4. Repository adı: `biowetter-wiesbaden`
5. Public veya Private seçin
6. **"Create repository"** butonuna tıklayın
7. **ÖNEMLİ**: README, .gitignore veya license eklemeyin (zaten var)

## 2. Remote'u Ekleyin ve Push Edin

Aşağıdaki komutları terminal'de çalıştırın (YOUR_USERNAME yerine GitHub kullanıcı adınızı yazın):

```bash
cd "C:\Users\goekh\Desktop\web app\biowetter"
git remote add origin https://github.com/YOUR_USERNAME/biowetter-wiesbaden.git
git push -u origin main
```

## Alternatif: SSH Kullanıyorsanız

```bash
git remote add origin git@github.com:YOUR_USERNAME/biowetter-wiesbaden.git
git push -u origin main
```

## 3. Kontrol

Push işleminden sonra https://github.com/YOUR_USERNAME/biowetter-wiesbaden adresinde projenizi görebilirsiniz.

