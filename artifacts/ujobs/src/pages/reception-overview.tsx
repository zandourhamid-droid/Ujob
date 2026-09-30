import { type ComponentType, type ReactNode, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Headphones,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import {
  useGetDashboardSummary,
  useListCities,
  useListSectors,
  useListServiceRequests,
  useListServices,
} from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';

type ShellProps = {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

type SharedProps = {
  PageShell: ComponentType<ShellProps>;
  RequestCard: ComponentType<{ request: any }>;
  LoadingBlock: ComponentType<{ rows?: number }>;
  QueryError: ComponentType<{ onRetry?: () => void }>;
  EmptyState: ComponentType<{ title: string; body: string; action?: ReactNode }>;
};

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/95 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icon className="size-5" />
        </span>
        <span className="text-[11px] font-bold text-emerald-700">{detail}</span>
      </div>
      <strong className="mt-4 block text-2xl tracking-tight">{value}</strong>
      <span className="mt-1 block text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function ReceptionOverview({
  PageShell,
  RequestCard,
  LoadingBlock,
  QueryError,
  EmptyState,
}: SharedProps) {
  const [, setLocation] = useLocation();
  const sectors = useListSectors();
  const cities = useListCities();
  const requests = useListServiceRequests({ limit: 4 });
  const summary = useGetDashboardSummary();
  const [service, setService] = useState('');
  const [city, setCity] = useState('');
  const serviceList = useListServices(service ? { search: service } : undefined);
  const summaryData = summary.data;
  const cityName = (cities.data ?? []).find((item: any) => item.id === city)?.name;

  return (
    <PageShell>
      <section className="relative overflow-hidden rounded-[30px] border border-[#2c6f8b]/50 bg-[#0c3456] px-5 py-7 text-white shadow-xl sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="hero-grid absolute inset-0 opacity-35" />
        <div className="absolute -left-24 -top-32 size-96 rounded-full bg-[#50d7df]/20 blur-3xl" />
        <div className="absolute -bottom-28 right-1/3 size-80 rounded-full bg-[#256ea3]/35 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#b9eff5]">
              <ShieldCheck className="size-4" />
              منصة خدمات مغربية موثوقة
            </div>
            <h1 className="mt-5 max-w-2xl text-balance text-4xl font-bold leading-[1.22] tracking-tight sm:text-5xl lg:text-[58px]">
              أهلاً بك في
              <br />
              <span className="text-[#61e2ea]">لوحة استقبال Ujobs.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-blue-100/80 sm:text-lg">
              ابدأ من احتياجك، وسنوصلك بمهنيين موثّقين في مدينتك. اطلب بوضوح، قارن بثقة، واحتفظ بكل خطواتك في مكان واحد.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold text-blue-100/80">
              <span className="inline-flex items-center gap-2"><BadgeCheck className="size-4 text-[#61e2ea]" /> مهنيون موثّقون</span>
              <span className="inline-flex items-center gap-2"><LockKeyhole className="size-4 text-[#61e2ea]" /> تعاملات آمنة</span>
              <span className="inline-flex items-center gap-2"><Headphones className="size-4 text-[#61e2ea]" /> دعم محلي</span>
            </div>
          </div>

          <div className="animate-rise-delay-1 rounded-[26px] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-md">
            <div className="rounded-[20px] bg-card p-5 text-foreground sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-[.14em] text-primary">خطوتك الأولى</p>
                  <h2 className="mt-2 text-xl font-bold">ما الخدمة التي تحتاجها؟</h2>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">اختر الخدمة والموقع لنقترح لك المسار الأسرع.</p>
                </div>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <Search className="size-5" />
                </span>
              </div>
              <label className="mt-5 block text-xs font-bold text-muted-foreground">الخدمة أو المجال</label>
              <div className="relative mt-2">
                <Search className="absolute right-3 top-3.5 size-4 text-muted-foreground" />
                <input
                  value={service}
                  onChange={(event) => setService(event.target.value)}
                  list="reception-service-options"
                  placeholder="مثال: سباكة، تصميم..."
                  className="h-11 w-full rounded-xl border border-input bg-background pr-10 pl-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  data-testid="input-reception-service"
                />
                <datalist id="reception-service-options">
                  {(serviceList.data ?? []).slice(0, 8).map((item: any) => <option key={item.id} value={item.name} />)}
                </datalist>
              </div>
              <label className="mt-4 block text-xs font-bold text-muted-foreground">المدينة</label>
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                data-testid="select-reception-city"
              >
                <option value="">كل المدن</option>
                {(cities.data ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              {cityName && <p className="mt-2 text-xs font-semibold text-primary">موقعك المختار: {cityName}</p>}
              <button
                type="button"
                onClick={() => setLocation(`/requests${city ? `?cityId=${city}` : ''}`)}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
                data-testid="button-reception-search"
              >
                استكشف المهنيين
                <ArrowLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setLocation('/request/new')}
                className="mt-3 w-full rounded-xl py-2 text-center text-sm font-bold text-primary transition hover:bg-secondary"
                data-testid="button-reception-create"
              >
                لدي طلب محدد وأريد نشره
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-4 relative z-10 grid grid-cols-2 gap-3 px-3 sm:grid-cols-4 sm:px-8 lg:px-12">
        <StatCard icon={BadgeCheck} label="مهنيون موثّقون" value={summaryData?.verifiedProviders ?? '—'} detail="جودة الشبكة" />
        <StatCard icon={BriefcaseBusiness} label="طلبات مفتوحة" value={summaryData?.openRequests ?? '—'} detail="نشطة الآن" />
        <StatCard icon={MapPin} label="مدن نشطة" value={summaryData?.activeCities ?? '—'} detail="تتوسع باستمرار" />
        <StatCard icon={TrendingUp} label="إجمالي الطلبات" value={summaryData?.totalRequests ?? '—'} detail="منصة تنمو" />
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold tracking-[.16em] text-primary">تجربة واضحة</p>
            <h2 className="mt-2 text-2xl font-bold">من الطلب إلى الإنجاز في ثلاث خطوات</h2>
          </div>
          <Link href="/request/new" className="hidden items-center gap-2 text-sm font-bold text-primary sm:flex">
            ابدأ الآن <ArrowLeft className="size-4" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: Sparkles, title: 'صف احتياجك', text: 'حدد الخدمة والموقع والميزانية المناسبة لك.' },
            { icon: Users, title: 'قارن المهنيين', text: 'استقبل عروضاً واضحة واختر الأنسب لطلبك.' },
            { icon: CheckCircle2, title: 'أنجز بثقة', text: 'تابع طلبك واترك تقييمك بعد إتمام الخدمة.' },
          ].map((item, index) => (
            <div key={item.title} className="relative rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className="absolute left-5 top-5 text-xs font-bold text-muted-foreground">0{index + 1}</span>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary"><item.icon className="size-5" /></span>
              <h3 className="mt-6 font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold tracking-[.16em] text-primary">مجالات مختارة</p>
            <h2 className="mt-2 text-2xl font-bold">كل ما تحتاجه في مكان واحد</h2>
          </div>
          <Link href="/requests" className="hidden items-center gap-2 text-sm font-bold text-primary sm:flex">استكشف الكل <ArrowLeft className="size-4" /></Link>
        </div>
        {sectors.isLoading ? <LoadingBlock rows={1} /> : sectors.isError ? <QueryError onRetry={() => sectors.refetch()} /> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(sectors.data ?? []).slice(0, 6).map((sector: any, index: number) => (
              <Link href={`/requests?sectorId=${sector.id}`} key={sector.id} className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
                <span className={`mb-8 flex size-11 items-center justify-center rounded-2xl ${index % 2 ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-primary'}`}><Wrench className="size-5" /></span>
                <p className="font-bold">{sector.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{sector.serviceCount} خدمة</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_290px]">
        <div>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold tracking-[.16em] text-primary">طلبات قريبة</p>
              <h2 className="mt-2 text-2xl font-bold">أشخاص يبحثون عن مهنيين الآن</h2>
            </div>
            <Link href="/requests" className="inline-flex items-center gap-2 text-sm font-bold text-primary">عرض الكل <ArrowLeft className="size-4" /></Link>
          </div>
          {requests.isLoading ? <LoadingBlock /> : requests.isError ? <QueryError onRetry={() => requests.refetch()} /> : (requests.data ?? []).length ? (
            <div className="grid gap-4 md:grid-cols-2">{(requests.data ?? []).slice(0, 4).map((request: any) => <RequestCard key={request.id} request={request} />)}</div>
          ) : <EmptyState title="لا توجد طلبات منشورة بعد" body="كن أول من ينشر طلبه، وسيصل إلى مهنيين موثوقين في مدينتك." action={<Link href="/request/new" className="inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">نشر طلب جديد</Link>} />}
        </div>
        <aside className="rounded-3xl bg-secondary p-6">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-card text-primary shadow-sm"><Banknote className="size-5" /></span>
          <h3 className="mt-8 text-xl font-bold">واضح وعادل من البداية</h3>
          <p className="mt-2 text-sm leading-7 text-secondary-foreground">العمولة ثابتة ومعلنة لمقدم الخدمة: 10 د.م فقط عند قبول الطلب المؤهل.</p>
          <div className="mt-7 space-y-4 border-t border-primary/10 pt-5">
            <div className="flex items-center gap-2 text-sm"><Clock3 className="size-4 text-primary" /><span>عروض واضحة قبل الاختيار</span></div>
            <div className="flex items-center gap-2 text-sm"><ShieldCheck className="size-4 text-primary" /><span>مؤشرات ثقة ودعم محلي</span></div>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}