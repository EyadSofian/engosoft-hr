# النشر على Railway + تفعيل التعديل

## الجزء ١ — Apps Script (لو عايز التعديل من الداشبورد)

الخلط الشائع: **الكود بيتحط جوّه جوجل شيتس، والرابط اللي بيطلع منه بيتحط في Railway.**

| الحاجة | بتتحط فين |
| --- | --- |
| محتوى `apps-script/Code.gs` | **جوّه الجوجل شيت** (Extensions → Apps Script) |
| الرابط اللي بينتهي بـ `/exec` | **Railway** كمتغير `VITE_WRITE_API_URL` |
| التوكن (إنت بتخترعه) | **مكانين**: Script Properties جوّه Apps Script باسم `API_TOKEN`، و Railway باسم `VITE_WRITE_API_TOKEN` |

### الخطوات

1. افتح الجوجل شيت → **Extensions → Apps Script**
2. امسح أي كود موجود، والصق كل محتوى `apps-script/Code.gs`، واحفظ (Ctrl+S)
3. **⚙️ Project Settings** (الترس على الشمال) → انزل لـ **Script Properties** → **Add script property**
   - Property: `API_TOKEN`
   - Value: أي نص عشوائي طويل (مثلاً 32 حرف). ده اللي هتحطه في Railway كمان
4. ارجع للكود → **Deploy → New deployment**
   - دوس على ⚙️ جنب "Select type" واختار **Web app**
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` ← مهم جدًا، لو حطيت غير كده الداشبورد مش هيعرف يكتب
   - **Deploy** → هيطلب إذن، وافق (هيقولك "Google hasn't verified this app" → Advanced → Go to … → Allow)
5. هيديك رابط شكله كده:
   ```
   https://script.google.com/macros/s/AKfycbx.....................qP/exec
   ```
   **ده الرابط اللي بيتحط في Railway.** انسخه.

> **كل ما تعدّل الكود لازم تعمل Deploy تاني** — من `Deploy → Manage deployments → ✏️ → Version: New version → Deploy`. لو عملت "New deployment" من الأول هيديك رابط جديد ولازم تغيّره في Railway.

## الجزء ٢ — Railway

### المتغيرات

في Railway: **مشروعك → الخدمة → Variables → + New Variable**

| المتغير | القيمة | إجباري |
| --- | --- | --- |
| `VITE_SHEET_ID` | الـ ID من رابط الشيت (اللي بين `/d/` و `/edit`) | ✅ |
| `VITE_REFRESH_SECONDS` | `90` | ✅ |
| `VITE_SALARY_PASS_HASH` | بصمة SHA-256 لرمز المرتبات | ✅ |
| `VITE_WRITE_API_URL` | رابط الـ `/exec` من فوق | للتعديل |
| `VITE_WRITE_API_TOKEN` | نفس التوكن بتاع `API_TOKEN` | للتعديل |

**ما تحطش** `VITE_DATA_MODE` خالص — ده للتجربة المحلية بس.

لتوليد بصمة رمز المرتبات:

```bash
python -c "import hashlib,sys; print(hashlib.sha256(sys.argv[1].encode()).hexdigest())" "الرمز-اللي-انت-عايزه"
```

### ⚠️ أهم نقطة في Railway

متغيرات `VITE_*` **بتتحرق جوّه الملفات وقت البناء (build)، مش وقت التشغيل.**

يعني:

- لازم تضيف المتغيرات **قبل** أول Deploy، أو تعمل **Redeploy** بعد ما تضيفها
- تغيير أي متغير **لوحده مش بيعمل حاجة** — لازم Redeploy عشان يتحرق في البناء الجديد
- Railway بيعمل redeploy تلقائي لما تغيّر متغير، بس اتأكد إن البناء خلص فعلاً

### الباقي جاهز

`railway.json` مظبوط بالفعل:

```json
{ "build":  { "builder": "NIXPACKS", "buildCommand": "npm run build" },
  "deploy": { "startCommand": "node server.mjs", "healthcheckPath": "/healthz" } }
```

`server.mjs` بيقرأ `PORT` من Railway لوحده، وبيرد على `/healthz`، وبيحط cache دائم على ملفات
`assets/` و `no-cache` على `index.html` عشان أي نشر جديد يوصل للناس على طول.

## الجزء ٣ — بعد النشر

1. افتح الموقع → **الإعدادات**. هتلاقي جدول بكل التبويبات وحالتها:
   - **متصل** = التبويب اتقرا تمام
   - **لم يُطلب بعد** = الصفحة دي لسه ما اتفتحتش (طبيعي)
   - **خطأ أحمر** = الرسالة تحتيه بتقول السبب بالظبط (غالبًا اسم تبويب غلط أو الشيت مش مشارَك)
2. نفس الصفحة بتقولك **واجهة الكتابة مفعّلة ولا لأ**
3. اكتب اسمك في **هويتك** — بيتسجل مع كل تعديل في تبويب `_Audit` المخفي

## مشاكل شائعة

| العَرَض | السبب |
| --- | --- |
| `No tab named "Employees"` | اسم التبويب مش مطابق بالحرف. لازم `Employees` مش `employees` ولا `Employees ` |
| كل التبويبات خطأ | الشيت مش مشارَك **Anyone with the link → Viewer** |
| التعديل بيقول "not shared with Anyone" | الـ Apps Script اتعمل له Deploy بـ access غير `Anyone` |
| التعديل بيقول 401 | التوكن مختلف بين `API_TOKEN` و `VITE_WRITE_API_TOKEN` |
| غيّرت متغير وما حصلش حاجة | لازم Redeploy — المتغيرات بتتحرق وقت البناء |
| صفحة المرتبات بتقول "لم يُضبط رمز الدخول" | `VITE_SALARY_PASS_HASH` فاضي أو اتضاف بعد البناء |

## ⚠️ حاجة مهمة قبل أول push

ملفات `data/csv/*.csv` **متمنوعة من الرفع** في `.gitignore` عن قصد — فيها أرقام قومية
وعناوين وتليفونات ومرتبات. متشيلهاش من هناك. لو احتجتها على جهاز تاني، شغّل:

```bash
python tools/extract_to_csv.py
```
