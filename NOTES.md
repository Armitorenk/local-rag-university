# NOTES — Bu repoda ne yapıldı?

Bu proje, [`leestott/local-rag`](https://github.com/leestott/local-rag) ("Building Your First Local RAG Application with Foundry Local") deposundan **fork edilip özelleştirilmiş** hâlidir. Orijinal demo bir **gaz sahası destek ajanı**ydı; burası bir **üniversite öğrenci asistanına** dönüştürüldü.

## Genel mimari (değişmedi)
- **Node.js + Express** sunucu, **SQLite** (`better-sqlite3`) vektör deposu.
- Retrieval: **TF-IDF + kosinüs benzerliği** (embedding modeli yok).
- Üretim: **Phi-3.5 Mini**, **Foundry Local** üzerinden, tamamen **çevrimdışı/yerel** (GPU varyantı `phi-3.5-mini-instruct-trtrtx-gpu`).
- Akış: `docs/*.md` → parçala (`src/chunker.js`) → TF vektörü → SQLite (`src/ingest.js`) → sorguda en yakın 3 parça → sistem prompt'una bağlam olarak göm → modelden **stream** yanıt (SSE).

## Çalıştırma
```bash
npm install
npm run ingest      # docs/ → data/rag.db (sadece içerik değişince tekrar gerekir)
npm start           # http://127.0.0.1:3000
```
> Önkoşul: `winget install Microsoft.FoundryLocal`. `foundry` PATH'te değilse terminali yeniden aç.

## Yapılan değişiklikler / düzeltmeler

### 1. İçerik: gaz sahası → üniversite (İngilizce)
- `docs/` içindeki 20 gaz dokümanı silindi, yerine **12 İngilizce üniversite dokümanı** eklendi (ders kaydı, sınav/not, devam, burs, yurt, kütüphane, mezuniyet, staj, geçişler, disiplin, akademik takvim, danışmanlık).
- `src/prompts.js` üniversite asistanı için yeniden yazıldı: **yalnızca getirilen bağlamı kullan, uydurma, bilgi yoksa söyle, selamlama/alan-dışı girdide kısa-kibar yanıt ver**.

### 2. Foundry Local katalog 429 düzeltmesi (kritik)
- `foundry-local-sdk@0.9.0`'ın `Catalog.getModel()` metodu her açılışta bulut kataloğunu (`get_model_list`, eastus) yokluyor ve sık sık **HTTP 429** dönüp `npm start`'ı çökertiyordu.
- `src/chatEngine.js`'e **backoff'lu retry** eklendi (`_getModelWithRetry`, 15s→90s, 12 deneme). Model yereldeyken yalnızca metadata çekimi throttle yiyordu.

### 3. Yanıt kalitesi ayarı (küçük model davranışı)
- `_buildContext`'e **alaka eşiği**: en yüksek retrieval skoru `< 0.18` ise bağlam "ilgili belge yok" olarak verilir → selamlama/alan-dışı sorularda **halüsinasyon/geveleme** engellenir.
- `maxTokens` 1024 → **768** (kompakt modda 384) → modelin gereksiz tekrar/loop yapması azaltıldı.

### 4. Tamamen yeni arayüz (`public/index.html`)
- Koyu, **X/Twitter tarzı** minimal tasarım: tam genişlik timeline, mesaj-arası çizgi yok, gri-siyah tonlar, emojisiz, ince çizgi SVG ikonlar, sevimli robot-yüzü avatar.
- Sağlam **SSE streaming** (parça sınırlarını doğru tamponlar — orijinaldeki ayrıştırma hatası giderildi).
- Özellikler: cevap altında **Kopyala** + **Yeniden üret**, üretim sırasında **Durdur**, **zaman damgası**, **Markdown'a dışa aktar**, **localStorage** ile sohbet kalıcılığı, titremesiz açılan **"New chat" / "Export"** başlık butonları, özel **toggle** (kompakt mod), renkli durum noktası (yeşil/amber/kırmızı).
- Orijinal arayüz `public/index.original.html` olarak yedeklendi.

## Bilinen sınır
- Phi-3.5 Mini küçük bir modeldir; İngilizcede iyi, ama uzun/karmaşık sorularda yüzeysel kalabilir. Daha iyi kalite için `src/config.js`'te daha büyük bir yerel model (örn. `qwen2.5-7b`) denenebilir.
