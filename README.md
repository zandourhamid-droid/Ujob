# Ujobs

منصة مغربية لربط المستفيدين بمقدمي الخدمات، مملوكة لشركة Best Solutions For Life ومقرها الرباط.

## تشغيل محلي

المتطلبات: Node.js 24، pnpm، وPostgreSQL.

```bash
pnpm install
cp .env.example .env
pnpm --filter @workspace/db run push
pnpm run typecheck
```

بعدها شغّل خدمتي الواجهة والـ API من لوحة التشغيل، أو:

```bash
PORT=5000 pnpm --filter @workspace/api-server run dev
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/ujobs run dev
```

## الهيكلة

- `artifacts/ujobs`: الواجهة وواجهة الإدارة.
- `artifacts/api-server`: الـ API والمنطق التشغيلي.
- `lib/db`: مخطط PostgreSQL وDrizzle.
- `lib/api-spec`: عقد OpenAPI.
- `docs`: الهندسة، الأمان، والنشر.

## العقود وقاعدة البيانات

عدّل `lib/api-spec/openapi.yaml` أولاً، ثم شغّل:

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/db run push
```

بيانات البداية تشمل الرباط وأحياءها والقطاعات الأساسية وخدمات المنازل والسيارات
والإلكترونيات، إضافة إلى حسابين تجريبيين للمستفيد ومقدم الخدمة.

## الدفع

شحن محفظة مقدم الخدمة يتم عبر **Stripe Payment Element**.
ضع المفاتيح في البيئة:

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

ثم اضبط Webhook في لوحة Stripe على:

`https://YOUR_DOMAIN/api/stripe/webhook`

الحدث المطلوب: `payment_intent.succeeded`.

العمولة الحالية ثابتة بقيمة **10 د.م** عند قبول طلب مؤهل.
الرصيد الداخلي Ledger محاسبي ولا يمثل أموالاً محفوظة لدى Ujobs.
للإنتاج التجاري في المغرب يُفضَّل أيضاً بوابة مرخصة محلياً (CMI / Payzone / NAPS) عند استقبال أموال حقيقية داخل المملكة.

## Docker وPostgreSQL

```bash
docker compose up --build
```

للنشر على Render أو أي خدمة حاويات: عيّن `DATABASE_URL` و`SESSION_SECRET` و`NODE_ENV=production`.
للواجهة الثابتة يمكن استعمال Vercel، مع توجيه `/api` إلى خدمة API المنشورة.

## النطاق

اربط `ujobs.ma` بالواجهة المنشورة، و`api.ujobs.ma` بخدمة API، أو استخدم reverse proxy
يوجه `/api` إلى الخادم نفسه. لا تضع مفاتيح الدفع أو بيانات قاعدة البيانات في الواجهة.