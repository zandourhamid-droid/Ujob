import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowUpRight, BadgeCheck, Banknote, BriefcaseBusiness, Building2, CalendarDays,
  Check, ChevronDown, CircleAlert, Clock3, FilePlus2, Filter, Globe2, Headphones,
  Home as HomeIcon, ListFilter, Loader2, LockKeyhole, MapPin, Menu, MessageCircle,
  MoreHorizontal, Plus, Search, Send, ShieldCheck, Sparkles, TrendingUp, UserRound, Users,
  WalletCards, Wrench
} from 'lucide-react';
import {
  getGetAdminOverviewQueryKey, getGetDashboardSummaryQueryKey, getGetServiceRequestQueryKey,
  getGetWalletQueryKey, getHealthCheckQueryKey, getListServiceRequestsQueryKey,
  getListWalletTransactionsQueryKey,
  useAcceptOffer, useCreateComplaint, useCreateOffer, useCreateServiceRequest, useCreateTopup,
  useGetAdminOverview, useGetDashboardSummary, useGetServiceRequest, useGetWallet,
  useHealthCheck, useListCities, useListSectors, useListServiceRequests, useListServices,
  useListWalletTransactions
} from '@workspace/api-client-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import ReceptionOverview from '@/pages/reception-overview';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();

const formatMAD = (value?: number | null) => `${new Intl.NumberFormat('fr-MA').format(value ?? 0)} د.م`;
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat('ar-MA', { day: 'numeric', month: 'short' }).format(new Date(value)) : '—';
const initials = (name: string) => name.split(' ').map((part) => part[0]).slice(0, 2).join('');

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 no-underline" data-testid="link-logo">
      <span className="relative flex size-10 items-center justify-center rounded-[14px] bg-primary text-lg font-extrabold text-primary-foreground shadow-md">
        <span className="absolute -right-1 -top-1 size-2 rounded-full bg-accent" />
        U
      </span>
      {!compact && <span className="leading-none"><strong className="font-['Manrope'] text-[21px] tracking-[-.06em] text-foreground">ujobs</strong><small className="block pt-1 text-[10px] font-medium text-muted-foreground">خدمات محلية بثقة</small></span>}
    </Link>
  );
}

function IconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return <button type="button" aria-label={label} onClick={onClick} className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:bg-secondary hover:text-primary" data-testid={`button-${label}`}>{children}</button>;
}

function AppHeader() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState('العربية');
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 30_000 } });
  const navItems = [
    { href: '/', label: 'الرئيسية', icon: HomeIcon },
    { href: '/requests', label: 'طلبات الخدمات', icon: ListFilter },
    { href: '/request/new', label: 'أطلب خدمة', icon: FilePlus2 },
    { href: '/provider/wallet', label: 'محفظتي', icon: WalletCards },
  ];
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-6">
            <IconButton label="فتح القائمة" onClick={() => setMenuOpen(!menuOpen)}><Menu className="size-5" /></IconButton>
            <Logo />
            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.slice(0, 3).map((item) => <Link key={item.href} href={item.href} className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-primary" data-testid={`link-nav-${item.href.replaceAll('/', '') || 'home'}`}>{item.label}</Link>)}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => setLang(lang === 'العربية' ? 'Français' : 'العربية')} className="flex items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-primary sm:px-3" data-testid="button-language"><Globe2 className="size-4" /> {lang === 'العربية' ? 'العربية · Français' : 'Français · العربية'}<ChevronDown className="size-3" /></button>
            <span className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:flex ${health.isError ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-700'}`} data-testid="status-api"><span className="size-1.5 rounded-full bg-current" /> {health.isError ? 'غير متصل' : 'الشبكة تعمل'}</span>
            <Link href="/auth" className="hidden items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition hover:border-primary/40 hover:text-primary sm:flex" data-testid="link-auth"><UserRound className="size-4" /> دخول</Link>
            <button type="button" onClick={() => setLocation('/request/new')} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" data-testid="button-header-request"><Plus className="size-4" /> <span className="hidden sm:inline">أطلب خدمة</span></button>
          </div>
        </div>
      </header>
      {menuOpen && <div className="fixed inset-x-3 top-[84px] z-40 rounded-2xl border border-border bg-card p-3 shadow-lg lg:hidden animate-rise" data-testid="menu-mobile">
        {navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-foreground hover:bg-secondary" data-testid={`link-mobile-${item.label}`}><item.icon className="size-5 text-primary" /> {item.label}</Link>)}
        <Link href="/auth" onClick={() => setMenuOpen(false)} className="mt-2 flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 font-semibold text-primary" data-testid="link-mobile-auth"><UserRound className="size-5" /> تسجيل الدخول</Link>
      </div>}
    </>
  );
}

function Footer() {
  return <footer className="mt-20 border-t border-border bg-card"><div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-9 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10"><div className="flex items-center gap-3"><Logo compact /><span className="text-xs text-muted-foreground">© 2024 Best Solutions For Life</span></div><div className="flex gap-5 text-xs font-semibold text-muted-foreground"><Link href="/requests" data-testid="link-footer-requests">تصفح الطلبات</Link><Link href="/auth" data-testid="link-footer-providers">للمهنيين</Link><Link href="/admin" data-testid="link-footer-admin">الإدارة</Link></div><span className="text-xs text-muted-foreground">صنع في المغرب، لخدمة المغرب</span></div></footer>;
}

function PageShell({ children, title, eyebrow, actions }: { children: ReactNode; title?: string; eyebrow?: string; actions?: ReactNode }) {
  return <div className="app-shell" dir="rtl"><AppHeader /><main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10">{(title || actions) && <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-2 text-xs font-bold tracking-[.16em] text-primary">{eyebrow}</p>}{title && <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>}</div>{actions}</div>}{children}</main><Footer /></div>;
}

function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3" data-testid="loading-skeleton">{Array.from({ length: rows }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>;
}

function QueryError({ onRetry }: { onRetry?: () => void }) {
  return <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center" data-testid="state-error"><CircleAlert className="mx-auto mb-3 size-8 text-destructive" /><h3 className="font-bold">تعذر تحميل البيانات</h3><p className="mt-1 text-sm text-muted-foreground">تحقق من اتصالك وحاول مرة أخرى.</p>{onRetry && <button onClick={onRetry} type="button" className="mt-4 rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground" data-testid="button-retry">إعادة المحاولة</button>}</div>;
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center" data-testid="state-empty"><div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Sparkles className="size-5" /></div><h3 className="font-bold">{title}</h3><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function Metric({ label, value, hint, icon: MetricIcon, tone = 'blue' }: { label: string; value: string | number; hint?: string; icon: typeof Users; tone?: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" data-testid={`metric-${label}`}><div className="flex items-start justify-between"><span className={`flex size-10 items-center justify-center rounded-xl ${tone === 'amber' ? 'bg-amber-100 text-amber-700' : tone === 'green' ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-primary'}`}><MetricIcon className="size-5" /></span>{hint && <span className="text-[11px] font-bold text-emerald-700">{hint}</span>}</div><p className="mt-5 text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p></div>;
}

function RequestCard({ request }: { request: any }) {
  return <Link href={`/requests/${request.id}`} className="group block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md" data-testid={`card-request-${request.id}`}><div className="flex items-start justify-between gap-4"><div><div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">{request.serviceName}</span>{request.urgent && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">عاجل</span>}</div><h3 className="font-bold leading-relaxed text-foreground transition group-hover:text-primary">{request.title}</h3></div><ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition group-hover:-translate-y-1 group-hover:text-primary" /></div><p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{request.description}</p><div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/70 pt-4 text-xs font-medium text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-primary" /> {request.cityName}، {request.neighborhoodName}</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {formatDate(request.createdAt)}</span><span className="mr-auto font-bold text-foreground">{request.budgetMax ? `${formatMAD(request.budgetMin)} — ${formatMAD(request.budgetMax)}` : 'الميزانية عند الاتفاق'}</span></div></Link>;
}

function Home() {
  return <ReceptionOverview PageShell={PageShell} RequestCard={RequestCard} LoadingBlock={LoadingBlock} QueryError={QueryError} EmptyState={EmptyState} />;
  /*
  const [, setLocation] = useLocation();
  const sectors = useListSectors();
  const cities = useListCities();
  const requests = useListServiceRequests({ limit: 4 });
  const summary = useGetDashboardSummary();
  const [service, setService] = useState('');
  const [city, setCity] = useState('');
  const serviceList = useListServices(service ? { search: service } : undefined);
  const items = sectors.data ?? [];
  return <PageShell><section className="relative overflow-hidden rounded-[28px] bg-[#10365A] px-6 py-12 text-white shadow-lg sm:px-10 lg:px-16 lg:py-[78px]"><div className="hero-grid absolute inset-0 opacity-40" /><div className="absolute -left-20 -top-24 size-72 rounded-full bg-[#26C6DA]/20 blur-3xl" /><div className="relative grid items-center gap-12 lg:grid-cols-[1.2fr_.8fr]"><div className="animate-rise"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#b9eff5]"><ShieldCheck className="size-4" /> شبكة مهنية موثوقة في المغرب</div><h1 className="max-w-2xl text-balance text-4xl font-bold leading-[1.25] tracking-tight sm:text-5xl lg:text-[58px]">الخدمة التي تبحث عنها،<br /><span className="text-[#61E2EA]">أقرب مما تتوقع.</span></h1><p className="mt-6 max-w-xl text-base leading-8 text-blue-100/80 sm:text-lg">اعثر على مهنيين موثّقين في مدينتك. اطلب، قارن العروض، وابدأ بثقة.</p><div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold text-blue-100/80"><span className="inline-flex items-center gap-2"><BadgeCheck className="size-4 text-[#61E2EA]" /> مهنيون موثّقون</span><span className="inline-flex items-center gap-2"><LockKeyhole className="size-4 text-[#61E2EA]" /> تواصل آمن</span><span className="inline-flex items-center gap-2"><Headphones className="size-4 text-[#61E2EA]" /> دعم محلي</span></div></div><div className="animate-rise-delay-1"><div className="rounded-3xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-md"><div className="rounded-2xl bg-card p-5 text-foreground sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold text-primary">ابدأ من هنا</p><h2 className="mt-1 text-xl font-bold">ما الخدمة التي تحتاجها؟</h2></div><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><Search className="size-5" /></span></div><label className="mb-2 block text-xs font-bold text-muted-foreground">الخدمة أو المجال</label><div className="relative"><Search className="absolute right-3 top-3.5 size-4 text-muted-foreground" /><input value={service} onChange={(e) => setService(e.target.value)} list="service-options" placeholder="مثال: سباكة، تصميم..." className="h-11 w-full rounded-xl border border-input bg-background pr-10 pl-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-home-service" /><datalist id="service-options">{(serviceList.data ?? []).slice(0, 8).map((item: any) => <option key={item.id} value={item.name} />)}</datalist></div><label className="mb-2 mt-4 block text-xs font-bold text-muted-foreground">المدينة</label><select value={city} onChange={(e) => setCity(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="select-home-city"><option value="">كل المدن</option>{(cities.data ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={() => setLocation(`/requests${city ? `?cityId=${city}` : ''}`)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground transition hover:bg-primary/90" data-testid="button-home-search">عرض المهنيين <ArrowLeft className="size-4" /></button><button type="button" onClick={() => setLocation('/request/new')} className="mt-3 w-full rounded-xl py-2 text-center text-sm font-bold text-primary hover:bg-secondary" data-testid="button-home-create">أريد نشر طلب محدد</button></div></div></div></div></section><section className="mt-12"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold tracking-[.16em] text-primary">مجالات مختارة</p><h2 className="mt-2 text-2xl font-bold">كل ما تحتاجه في مكان واحد</h2></div><Link href="/requests" className="hidden items-center gap-2 text-sm font-bold text-primary sm:flex" data-testid="link-all-services">استكشف كل الخدمات <ArrowLeft className="size-4" /></Link></div>{sectors.isLoading ? <LoadingBlock rows={1} /> : sectors.isError ? <QueryError onRetry={() => sectors.refetch()} /> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{items.slice(0, 6).map((sector: any, index: number) => <Link href={`/requests?sectorId=${sector.id}`} key={sector.id} className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-md" data-testid={`card-sector-${sector.id}`}><span className={`mb-8 flex size-11 items-center justify-center rounded-2xl ${index % 2 ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-primary'}`}><Wrench className="size-5" /></span><p className="font-bold">{sector.name}</p><p className="mt-1 text-xs text-muted-foreground">{sector.serviceCount} خدمة</p></Link>)}</div>}</section><section className="mt-14 grid gap-6 lg:grid-cols-[1fr_290px]"><div><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold tracking-[.16em] text-primary">طلبات قريبة</p><h2 className="mt-2 text-2xl font-bold">أشخاص يبحثون عن مهنيين الآن</h2></div><Link href="/requests" className="inline-flex items-center gap-2 text-sm font-bold text-primary" data-testid="link-recent-requests">عرض الكل <ArrowLeft className="size-4" /></Link></div>{requests.isLoading ? <LoadingBlock /> : requests.isError ? <QueryError onRetry={() => requests.refetch()} /> : (requests.data ?? []).length ? <div className="grid gap-4 md:grid-cols-2">{(requests.data ?? []).slice(0, 4).map((request: any) => <RequestCard key={request.id} request={request} />)}</div> : <EmptyState title="لا توجد طلبات منشورة بعد" body="كن أول من ينشر طلبه، وسيصل إلى مهنيين موثوقين في مدينتك." action={<Link href="/request/new" className="inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-empty-request">نشر طلب جديد</Link>} />}</div><aside className="rounded-3xl bg-secondary p-6"><span className="flex size-11 items-center justify-center rounded-2xl bg-card text-primary shadow-sm"><TrendingUp className="size-5" /></span><h3 className="mt-8 text-xl font-bold">مجتمع ينمو كل يوم</h3><p className="mt-2 text-sm leading-7 text-secondary-foreground">أكثر من {summary.data?.verifiedProviders ?? '—'} مهني موثّق جاهز لتقديم المساعدة.</p><div className="mt-7 space-y-4 border-t border-primary/10 pt-5"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">طلبات مفتوحة</span><strong>{summary.data?.openRequests ?? '—'}</strong></div><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">مدن نشطة</span><strong>{summary.data?.activeCities ?? '—'}</strong></div></div></aside></section></PageShell>;
  */
}

function NewRequest() {
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const services = useListServices();
  const cities = useListCities();
  const create = useCreateServiceRequest();
  const [form, setForm] = useState({ serviceId: '', cityId: '', neighborhoodId: '', title: '', description: '', budgetMin: '', budgetMax: '', urgent: false });
  const selectedCity: any = (cities.data ?? []).find((item: any) => item.id === form.cityId);
  const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate({ data: { serviceId: form.serviceId, cityId: form.cityId, neighborhoodId: form.neighborhoodId, title: form.title, description: form.description, budgetMin: form.budgetMin ? Number(form.budgetMin) : null, budgetMax: form.budgetMax ? Number(form.budgetMax) : null, urgent: form.urgent } }, { onSuccess: (request: any) => { client.invalidateQueries({ queryKey: getListServiceRequestsQueryKey() }); setLocation(`/requests/${request.id}`); } });
  };
  return <PageShell eyebrow="أطلب خدمة" title="احكِ لنا ما تحتاجه" actions={<div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">1</span><span>تفاصيل الطلب</span><span className="h-px w-8 bg-border" /><span className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">2</span><span>تلقّي العروض</span></div>}><div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_310px]"><form onSubmit={submit} className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8" data-testid="form-new-request"><div className="mb-8 border-b border-border pb-6"><h2 className="text-xl font-bold">تفاصيل الطلب</h2><p className="mt-1 text-sm text-muted-foreground">كلما كان وصفك أوضح، وصلت إليك عروض أدق.</p></div><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold">نوع الخدمة<select required value={form.serviceId} onChange={(e) => update('serviceId', e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="select-request-service"><option value="">اختر المجال والخدمة</option>{(services.data ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name} — {item.sectorName}</option>)}</select></label><label className="block text-sm font-bold">المدينة<select required value={form.cityId} onChange={(e) => update('cityId', e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="select-request-city"><option value="">اختر المدينة</option>{(cities.data ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="block text-sm font-bold">الحي<select required value={form.neighborhoodId} onChange={(e) => update('neighborhoodId', e.target.value)} disabled={!selectedCity} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50" data-testid="select-request-neighborhood"><option value="">اختر الحي</option>{(selectedCity?.neighborhoods ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="block text-sm font-bold">عنوان مختصر<input required minLength={3} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="مثال: إصلاح تسرب في المطبخ" className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-request-title" /></label></div><label className="mt-5 block text-sm font-bold">صف ما تحتاجه بالتفصيل<textarea required minLength={10} value={form.description} onChange={(e) => update('description', e.target.value)} rows={5} placeholder="اذكر التفاصيل المهمة، الموعد المفضل، وأي ملاحظات تساعد المهني على فهم طلبك..." className="mt-2 w-full resize-none rounded-xl border border-input bg-background p-3 font-normal leading-7 outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="textarea-request-description" /></label><div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold">الميزانية الدنيا <div className="relative mt-2"><input type="number" min="0" value={form.budgetMin} onChange={(e) => update('budgetMin', e.target.value)} placeholder="اختياري" className="h-12 w-full rounded-xl border border-input bg-background px-3 pl-14 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-budget-min" /><span className="absolute left-3 top-3.5 text-xs text-muted-foreground">د.م</span></div></label><label className="block text-sm font-bold">الميزانية القصوى <div className="relative mt-2"><input type="number" min="0" value={form.budgetMax} onChange={(e) => update('budgetMax', e.target.value)} placeholder="اختياري" className="h-12 w-full rounded-xl border border-input bg-background px-3 pl-14 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-budget-max" /><span className="absolute left-3 top-3.5 text-xs text-muted-foreground">د.م</span></div></label></div><label className="mt-6 flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background p-4 text-sm font-semibold"><input type="checkbox" checked={form.urgent} onChange={(e) => update('urgent', e.target.checked)} className="size-4 accent-[hsl(var(--primary))]" data-testid="checkbox-request-urgent" /><span><span className="block">هذا الطلب عاجل</span><span className="mt-1 block text-xs font-normal text-muted-foreground">سنوضّح للمهنيين أنك تبحث عن استجابة سريعة.</span></span></label><div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href="/" className="rounded-xl px-5 py-3 text-center text-sm font-bold text-muted-foreground hover:bg-muted" data-testid="link-cancel-request">إلغاء</Link><button disabled={create.isPending} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60" data-testid="button-submit-request">{create.isPending && <Loader2 className="size-4 animate-spin" />} نشر الطلب</button></div></form><aside className="space-y-4"><div className="rounded-3xl bg-[#10365A] p-6 text-white"><span className="flex size-10 items-center justify-center rounded-xl bg-white/10"><ShieldCheck className="size-5 text-[#61E2EA]" /></span><h3 className="mt-7 font-bold">طلبك يبقى تحت سيطرتك</h3><p className="mt-2 text-sm leading-7 text-blue-100/75">تصل إليك عروض من مهنيين مهتمين فقط، ويمكنك مقارنة السعر والمدة قبل الاختيار.</p></div><div className="rounded-3xl border border-border bg-card p-6"><h3 className="font-bold">نصيحة سريعة</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">أضف صوراً أو قياسات في الوصف إن أمكن. هذه التفاصيل تصنع فرقاً في جودة العروض.</p></div></aside></div></PageShell>;
}

function Requests() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const cities = useListCities();
  const requests = useListServiceRequests({ limit: 50, ...(city ? { cityId: city } : {}) });
  const filtered = useMemo(() => (requests.data ?? []).filter((item: any) => `${item.title} ${item.serviceName} ${item.cityName}`.toLowerCase().includes(search.toLowerCase())), [requests.data, search]);
  return <PageShell eyebrow="سوق الخدمات" title="طلبات تحتاج مهنيين" actions={<Link href="/request/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-new-request"><Plus className="size-4" /> نشر طلب</Link>}><div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm md:flex-row"><div className="relative flex-1"><Search className="absolute right-3 top-3.5 size-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في الطلبات..." className="h-11 w-full rounded-xl bg-muted/60 pr-10 pl-3 text-sm outline-none focus:ring-2 focus:ring-primary/15" data-testid="input-search-requests" /></div><div className="relative md:w-56"><MapPin className="absolute right-3 top-3.5 size-4 text-muted-foreground" /><select value={city} onChange={(e) => setCity(e.target.value)} className="h-11 w-full appearance-none rounded-xl bg-muted/60 px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/15" data-testid="select-filter-city"><option value="">كل المدن</option>{(cities.data ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-muted-foreground hover:bg-muted" data-testid="button-filter-requests"><Filter className="size-4" /> فلاتر</button></div>{requests.isLoading ? <LoadingBlock rows={5} /> : requests.isError ? <QueryError onRetry={() => requests.refetch()} /> : filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((request: any) => <RequestCard key={request.id} request={request} />)}</div> : <EmptyState title="لم نجد طلبات بهذا البحث" body="جرّب تغيير المدينة أو كلمات البحث، أو انشر طلبك ليصل إلى المهنيين." action={<Link href="/request/new" className="inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-no-results-request">نشر طلب جديد</Link>} />}</PageShell>;
}

function RequestDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const detail = useGetServiceRequest(id, { query: { enabled: Boolean(id), queryKey: getGetServiceRequestQueryKey(id) } });
  const createOffer = useCreateOffer();
  const acceptOffer = useAcceptOffer();
  const complaint = useCreateComplaint();
  const [offerForm, setOfferForm] = useState({ amount: '', message: '', estimatedDays: '2' });
  const [showOffer, setShowOffer] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const request: any = detail.data;
  const submitOffer = (event: FormEvent) => {
    event.preventDefault();
    createOffer.mutate({ id, data: { amount: Number(offerForm.amount), message: offerForm.message, estimatedDays: Number(offerForm.estimatedDays) } }, { onSuccess: () => { setShowOffer(false); client.invalidateQueries({ queryKey: getGetServiceRequestQueryKey(id) }); } });
  };
  if (detail.isLoading) return <PageShell><LoadingBlock rows={5} /></PageShell>;
  if (detail.isError || !request) return <PageShell><QueryError onRetry={() => detail.refetch()} /></PageShell>;
  return <PageShell><div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"><Link href="/requests" className="hover:text-primary" data-testid="link-back-requests">الطلبات</Link><ArrowLeft className="size-4" /><span>{request.serviceName}</span></div><div className="grid gap-6 lg:grid-cols-[1fr_360px]"><div className="space-y-6"><section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground">{request.serviceName}</span>{request.urgent && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">طلب عاجل</span>}<span className="mr-auto text-xs text-muted-foreground">{formatDate(request.createdAt)}</span></div><h1 className="mt-6 text-3xl font-bold leading-relaxed">{request.title}</h1><p className="mt-4 whitespace-pre-line text-sm leading-8 text-muted-foreground">{request.description}</p><div className="mt-7 grid gap-3 border-t border-border pt-5 sm:grid-cols-3"><div className="rounded-2xl bg-muted/60 p-4"><MapPin className="mb-3 size-4 text-primary" /><p className="text-[11px] text-muted-foreground">الموقع</p><strong className="mt-1 block text-sm">{request.cityName}، {request.neighborhoodName}</strong></div><div className="rounded-2xl bg-muted/60 p-4"><Banknote className="mb-3 size-4 text-primary" /><p className="text-[11px] text-muted-foreground">الميزانية</p><strong className="mt-1 block text-sm">{request.budgetMax ? `${formatMAD(request.budgetMin)} — ${formatMAD(request.budgetMax)}` : 'مرنة'}</strong></div><div className="rounded-2xl bg-muted/60 p-4"><MessageCircle className="mb-3 size-4 text-primary" /><p className="text-[11px] text-muted-foreground">العروض</p><strong className="mt-1 block text-sm">{request.offers?.length ?? request.offersCount} عروض</strong></div></div></section><section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-bold tracking-[.12em] text-primary">مقترحات المهنيين</p><h2 className="mt-2 text-2xl font-bold">قارن واختر الأنسب</h2></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{request.offers?.length ?? 0} عروض</span></div><div className="mt-6 space-y-3">{(request.offers ?? []).length ? request.offers.map((offer: any) => <div key={offer.id} className="rounded-2xl border border-border p-4 transition hover:border-primary/30 sm:p-5" data-testid={`card-offer-${offer.id}`}><div className="flex items-start gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">{initials(offer.providerName)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong>{offer.providerName}</strong><BadgeCheck className="size-4 text-primary" /><span className="mr-auto text-lg font-bold text-primary">{formatMAD(offer.amount)}</span></div><p className="mt-2 text-sm leading-7 text-muted-foreground">{offer.message}</p><div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {offer.estimatedDays} أيام</span><span>عمولة المنصة {formatMAD(offer.commission)}</span></div></div></div><div className="mt-4 flex justify-end gap-2">{offer.status === 'pending' && <button disabled={acceptOffer.isPending} onClick={() => acceptOffer.mutate({ id: offer.id }, { onSuccess: () => client.invalidateQueries({ queryKey: getGetServiceRequestQueryKey(id) }) })} type="button" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60" data-testid={`button-accept-offer-${offer.id}`}>{acceptOffer.isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />} قبول العرض</button>}</div></div>) : <EmptyState title="لا توجد عروض بعد" body="شارك الطلب مع مهنيين في شبكتك أو انتظر قليلاً." />}</div></section></div><aside className="space-y-4"><div className="sticky top-24 rounded-3xl bg-[#10365A] p-6 text-white shadow-lg"><p className="text-sm font-bold text-[#61E2EA]">هل أنت مهني؟</p><h2 className="mt-3 text-2xl font-bold leading-relaxed">أرسل عرضك للعميل</h2><p className="mt-2 text-sm leading-7 text-blue-100/75">أظهر خبرتك وسعرك وكن واضحاً في المدة المتوقعة.</p><button type="button" onClick={() => setShowOffer(!showOffer)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#61E2EA] py-3 text-sm font-bold text-[#10365A] transition hover:bg-white" data-testid="button-toggle-offer"><Send className="size-4" /> {showOffer ? 'إخفاء النموذج' : 'أرسل عرضاً'}</button>{showOffer && <form onSubmit={submitOffer} className="mt-4 space-y-3 border-t border-white/15 pt-4" data-testid="form-create-offer"><input required type="number" min="0" value={offerForm.amount} onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })} placeholder="السعر بالدراهم" className="h-11 w-full rounded-xl border-0 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-blue-100/60" data-testid="input-offer-amount" /><input required type="number" min="1" value={offerForm.estimatedDays} onChange={(e) => setOfferForm({ ...offerForm, estimatedDays: e.target.value })} placeholder="المدة بالأيام" className="h-11 w-full rounded-xl border-0 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-blue-100/60" data-testid="input-offer-days" /><textarea required minLength={5} value={offerForm.message} onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })} placeholder="رسالة قصيرة للعميل" className="w-full resize-none rounded-xl border-0 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-blue-100/60" rows={3} data-testid="textarea-offer-message" /><button disabled={createOffer.isPending} type="submit" className="w-full rounded-xl bg-white py-2.5 text-sm font-bold text-[#10365A] disabled:opacity-60" data-testid="button-submit-offer">إرسال العرض</button></form>}</div><div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-primary" /><strong className="text-sm">تواصل باحترام وأمان</strong></div><p className="mt-2 text-xs leading-6 text-muted-foreground">لا تشارك معلومات حساسة قبل الاتفاق على تفاصيل الخدمة.</p><button type="button" onClick={() => setShowComplaint(!showComplaint)} className="mt-3 text-xs font-bold text-destructive hover:underline" data-testid="button-toggle-complaint">الإبلاغ عن مشكلة</button>{showComplaint && <div className="mt-3 space-y-2"><textarea value={complaintText} onChange={(e) => setComplaintText(e.target.value)} placeholder="اكتب تفاصيل المشكلة..." rows={3} className="w-full rounded-xl border border-input p-2 text-xs outline-none focus:border-primary" data-testid="textarea-complaint" /><button disabled={complaint.isPending || complaintText.length < 10} onClick={() => complaint.mutate({ data: { requestId: id, subject: 'بلاغ على طلب خدمة', description: complaintText } }, { onSuccess: () => { setComplaintText(''); setShowComplaint(false); } })} type="button" className="rounded-xl bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground disabled:opacity-50" data-testid="button-submit-complaint">إرسال البلاغ</button></div>}</div></aside></div></PageShell>;
}

function StripePaymentForm({ onComplete }: { onComplete: () => Promise<void> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setPending(true);
    setError('');
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });
    if (result.error) {
      setError(result.error.message ?? 'تعذر إتمام الدفع');
      setPending(false);
      return;
    }
    try {
      await onComplete();
    } catch (confirmationError) {
      setError(confirmationError instanceof Error ? confirmationError.message : 'تعذر تأكيد الدفع');
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="rounded-xl bg-destructive/10 p-3 text-xs font-bold text-destructive">{error}</p>}
      <button disabled={!stripe || !elements || pending} type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-50">
        {pending && <Loader2 className="size-4 animate-spin" />}
        تأكيد الدفع
        <ArrowLeft className="size-4" />
      </button>
    </form>
  );
}

function Wallet() {
  const client = useQueryClient();
  const wallet = useGetWallet({ query: { queryKey: getGetWalletQueryKey() } });
  const transactions = useListWalletTransactions();
  const topup = useCreateTopup();
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('stripe');
  const [notice, setNotice] = useState('');
  const [stripePayment, setStripePayment] = useState<{ id: string; clientSecret: string; publishableKey: string } | null>(null);
  const stripePromise = useMemo(() => stripePayment ? loadStripe(stripePayment.publishableKey) : null, [stripePayment]);
  const finishTopup = () => {
    setNotice('تم تأكيد الدفع وإضافة الرصيد إلى المحفظة');
    setAmount('');
    setStripePayment(null);
    client.invalidateQueries({ queryKey: getGetWalletQueryKey() });
    client.invalidateQueries({ queryKey: getListWalletTransactionsQueryKey() });
  };
  const confirmStripeTopup = async () => {
    if (!stripePayment) return;
    const response = await fetch(`/api/wallet/topups/${stripePayment.id}/confirm`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'تعذر تأكيد الدفع');
    finishTopup();
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setNotice('');
    topup.mutate({ data: { amount: Number(amount), provider: provider as any } }, {
      onSuccess: (data: any) => {
        if (data.provider === 'stripe' && data.clientSecret && data.publishableKey) {
          setStripePayment({ id: data.id, clientSecret: data.clientSecret, publishableKey: data.publishableKey });
          return;
        }
        finishTopup();
      },
    });
  };
  return <PageShell eyebrow="مساحة المهني" title="المحفظة" actions={<div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700"><span className="size-2 rounded-full bg-emerald-500" /> الحساب نشط</div>}><div className="grid gap-6 lg:grid-cols-[1fr_380px]"><div className="space-y-6"><section className="relative overflow-hidden rounded-3xl bg-[#10365A] p-7 text-white shadow-lg sm:p-9"><div className="absolute -left-8 -top-16 size-48 rounded-full bg-[#61E2EA]/20 blur-2xl" /><div className="relative"><div className="flex items-center justify-between"><span className="text-sm text-blue-100/70">الرصيد المتاح</span><WalletCards className="size-6 text-[#61E2EA]" /></div><p className="mt-6 font-['Manrope'] text-4xl font-extrabold tracking-tight">{wallet.isLoading ? '—' : formatMAD(wallet.data?.balance)}</p><div className="mt-8 flex items-center justify-between border-t border-white/15 pt-4 text-xs text-blue-100/60"><span>آخر تحديث {formatDate(wallet.data?.updatedAt)}</span><span>{wallet.data?.currency ?? 'MAD'}</span></div></div></section><section className="rounded-3xl border border-border bg-card p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold tracking-[.12em] text-primary">السجل المالي</p><h2 className="mt-2 text-xl font-bold">آخر العمليات</h2></div><button type="button" className="rounded-xl p-2 text-muted-foreground hover:bg-muted" data-testid="button-transactions-menu"><MoreHorizontal className="size-5" /></button></div>{transactions.isLoading ? <LoadingBlock rows={4} /> : transactions.isError ? <QueryError onRetry={() => transactions.refetch()} /> : (transactions.data ?? []).length ? <div className="divide-y divide-border">{(transactions.data ?? []).map((item: any) => <div key={item.id} className="flex items-center gap-3 py-4" data-testid={`row-transaction-${item.id}`}><span className={`flex size-10 items-center justify-center rounded-xl ${item.type === 'credit' || item.amount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{item.amount > 0 ? <ArrowUpRight className="size-4" /> : <ArrowLeft className="size-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.description}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p></div><div className="text-left"><p className={`text-sm font-bold ${item.amount > 0 ? 'text-emerald-700' : ''}`}>{item.amount > 0 ? '+' : ''}{formatMAD(item.amount)}</p><p className="mt-1 text-[11px] text-muted-foreground">الرصيد {formatMAD(item.balanceAfter)}</p></div></div>)}</div> : <EmptyState title="لا توجد عمليات بعد" body="ستظهر هنا كل تعبئة أو حركة في محفظتك." />}</section></div><aside><form onSubmit={submit} className="rounded-3xl border border-border bg-card p-6 shadow-sm" data-testid="form-topup"><div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary"><Plus className="size-5" /></div><h2 className="mt-5 text-xl font-bold">تعبئة المحفظة</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">أضف رصيداً لاستخدام خدمات المنصة وتسوية العمولات.</p><label className="mt-6 block text-sm font-bold">المبلغ<input required min="10" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مثال: 250" className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-topup-amount" /></label><label className="mt-4 block text-sm font-bold">مزود الدفع<select value={provider} onChange={(e) => setProvider(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="select-topup-provider"><option value="stripe">Stripe</option><option value="sandbox">Sandbox</option><option value="cmi">CMI</option><option value="payzone">Payzone</option><option value="naps">NAPS</option></select></label>{notice && <p className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-xs font-bold text-emerald-700" data-testid="status-topup">{notice}</p>}<button disabled={topup.isPending || Number(amount) < 10} type="submit" className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-50" data-testid="button-topup">{topup.isPending && <Loader2 className="size-4 animate-spin" />} متابعة الدفع <ArrowLeft className="size-4" /></button><p className="mt-4 flex items-center justify-center gap-1 text-[11px] text-muted-foreground"><LockKeyhole className="size-3" /> معاملاتك محمية ومشفرة</p></form>{stripePayment && stripePromise && <div className="mt-4 rounded-3xl border border-primary/20 bg-card p-5 shadow-sm" data-testid="stripe-payment-panel"><div className="flex items-center justify-between"><div><p className="text-xs font-bold tracking-[.12em] text-primary">دفع آمن عبر Stripe</p><h3 className="mt-2 text-lg font-bold">{formatMAD(Number(amount))}</h3></div><LockKeyhole className="size-5 text-primary" /></div><Elements stripe={stripePromise} options={{ clientSecret: stripePayment.clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#188a9b', borderRadius: '12px' } } }}><StripePaymentForm onComplete={confirmStripeTopup} /></Elements></div>}</aside></div></PageShell>;
}

function Admin() {
  const overview = useGetAdminOverview({ query: { queryKey: getGetAdminOverviewQueryKey() } });
  const data: any = overview.data;
  const summary = data?.summary;
  return <PageShell eyebrow="لوحة التشغيل" title="نظرة عامة" actions={<div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground"><CalendarDays className="size-4 text-primary" /> آخر 30 يوماً <ChevronDown className="size-3" /></div>}><div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{overview.isLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />) : <><Metric label="إجمالي المهنيين" value={summary?.totalProviders ?? '—'} hint="+8.4%" icon={Users} /><Metric label="المهنيون الموثّقون" value={summary?.verifiedProviders ?? '—'} hint="جودة الشبكة" icon={BadgeCheck} tone="green" /><Metric label="الطلبات المفتوحة" value={summary?.openRequests ?? '—'} hint="نشطة الآن" icon={BriefcaseBusiness} tone="amber" /><Metric label="عمولات المنصة" value={summary ? formatMAD(summary.totalCommissions) : '—'} hint="هذا الشهر" icon={Banknote} /></>}</div>{overview.isError ? <QueryError onRetry={() => overview.refetch()} /> : <div className="grid gap-6 lg:grid-cols-[1fr_1fr]"><section className="rounded-3xl border border-border bg-card p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold tracking-[.12em] text-primary">آخر النشاطات</p><h2 className="mt-2 text-xl font-bold">طلبات الخدمة</h2></div><Link href="/requests" className="text-xs font-bold text-primary" data-testid="link-admin-requests">عرض الكل</Link></div><div className="space-y-2">{(data?.recentRequests ?? []).length ? data.recentRequests.map((request: any) => <Link key={request.id} href={`/requests/${request.id}`} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-muted" data-testid={`row-admin-request-${request.id}`}><span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary"><Wrench className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{request.title}</p><p className="mt-1 text-xs text-muted-foreground">{request.cityName} · {request.offersCount} عروض</p></div><span className="text-[11px] text-muted-foreground">{formatDate(request.createdAt)}</span></Link>) : <EmptyState title="لا يوجد نشاط حديث" body="ستظهر الطلبات الجديدة هنا." />}</div></section><section className="rounded-3xl border border-border bg-card p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold tracking-[.12em] text-primary">الماليات</p><h2 className="mt-2 text-xl font-bold">آخر المعاملات</h2></div><Link href="/provider/wallet" className="text-xs font-bold text-primary" data-testid="link-admin-wallet">المحفظة</Link></div><div className="space-y-2">{(data?.recentTransactions ?? []).length ? data.recentTransactions.map((transaction: any) => <div key={transaction.id} className="flex items-center gap-3 rounded-2xl p-3" data-testid={`row-admin-transaction-${transaction.id}`}><span className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Banknote className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{transaction.description}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p></div><strong className="text-sm text-emerald-700">+{formatMAD(transaction.amount)}</strong></div>) : <EmptyState title="لا توجد معاملات" body="ستظهر الحركات المالية الجديدة هنا." />}</div></section></div>}</PageShell>;
}

function Catalog() {
  const sectors = useListSectors();
  const services = useListServices();
  const cities = useListCities();
  const [tab, setTab] = useState('sectors');
  const tabs = [{ id: 'sectors', label: 'المجالات', icon: BriefcaseBusiness }, { id: 'services', label: 'الخدمات', icon: Wrench }, { id: 'cities', label: 'المدن والأحياء', icon: Building2 }];
  return <PageShell eyebrow="الإدارة" title="دليل الخدمات" actions={<button type="button" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="button-catalog-add"><Plus className="size-4" /> إضافة عنصر</button>}><div className="mb-6 flex gap-1 overflow-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm">{tabs.map((item) => <button type="button" key={item.id} onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === item.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`} data-testid={`button-catalog-tab-${item.id}`}><item.icon className="size-4" /> {item.label}</button>)}</div>{tab === 'sectors' && <CatalogSection loading={sectors.isLoading} error={sectors.isError} retry={sectors.refetch} empty="لا توجد مجالات" items={sectors.data ?? []} render={(item: any) => <div className="flex items-center gap-4"><span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary"><Wrench className="size-5" /></span><div><p className="font-bold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.slug}</p></div><span className="mr-auto rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{item.serviceCount} خدمة</span><MoreHorizontal className="size-5 text-muted-foreground" /></div>} />}{tab === 'services' && <CatalogSection loading={services.isLoading} error={services.isError} retry={services.refetch} empty="لا توجد خدمات" items={services.data ?? []} render={(item: any) => <div className="flex items-center gap-4"><span className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><Wrench className="size-5" /></span><div className="min-w-0"><p className="font-bold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.sectorName} · {item.providerCount} مهني</p></div><span className="mr-auto hidden max-w-xs truncate text-xs text-muted-foreground sm:block">{item.description || 'بدون وصف'}</span><MoreHorizontal className="size-5 text-muted-foreground" /></div>} />}{tab === 'cities' && <CatalogSection loading={cities.isLoading} error={cities.isError} retry={cities.refetch} empty="لا توجد مدن" items={cities.data ?? []} render={(item: any) => <div className="flex items-center gap-4"><span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary"><MapPin className="size-5" /></span><div><p className="font-bold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.region}</p></div><span className="mr-auto text-xs font-bold text-muted-foreground">{item.neighborhoods?.length ?? 0} أحياء</span><MoreHorizontal className="size-5 text-muted-foreground" /></div>} />}</PageShell>;
}

function CatalogSection({ loading, error, retry, empty, items, render }: { loading: boolean; error: boolean; retry: () => void; empty: string; items: any[]; render: (item: any) => ReactNode }) {
  if (loading) return <LoadingBlock rows={5} />;
  if (error) return <QueryError onRetry={retry} />;
  if (!items.length) return <EmptyState title={empty} body="ابدأ بإضافة عناصر الدليل لتظهر هنا." />;
  return <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"><div className="hidden grid-cols-[1fr_120px] border-b border-border bg-muted/50 px-6 py-3 text-xs font-bold text-muted-foreground sm:grid"><span>العنصر</span><span className="text-left">الإجراء</span></div>{items.map((item) => <div key={item.id} className="border-b border-border px-4 py-4 last:border-0 sm:px-6"><div className="flex items-center">{render(item)}</div></div>)}</div>;
}

function Auth() {
  const [role, setRole] = useState('customer');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  return <div className="app-shell flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8" dir="rtl"><div className="absolute inset-0 hero-grid opacity-30" /><div className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-border bg-card shadow-lg lg:grid-cols-[.9fr_1.1fr]"><div className="hidden bg-[#10365A] p-10 text-white lg:block"><Logo /><div className="mt-24"><p className="text-sm font-bold text-[#61E2EA]">مرحباً بك في Ujobs</p><h1 className="mt-4 text-4xl font-bold leading-[1.35]">كل مهارة محلية،<br />تصنع فرقاً حقيقياً.</h1><p className="mt-5 max-w-sm text-sm leading-8 text-blue-100/70">منصة مغربية تصل الناس بالمهنيين الذين يمكنهم مساعدتهم فعلاً.</p></div><div className="mt-28 flex items-center gap-3 text-xs text-blue-100/60"><ShieldCheck className="size-4 text-[#61E2EA]" /> هوية وتجربة مهنية في كل خطوة</div></div><div className="p-6 sm:p-12"><div className="flex items-center justify-between"><Logo compact /><Link href="/" className="text-sm font-bold text-muted-foreground hover:text-primary" data-testid="link-auth-home">العودة للرئيسية</Link></div><div className="mx-auto mt-16 max-w-md"><p className="text-sm font-bold text-primary">دخول آمن وسريع</p><h2 className="mt-3 text-3xl font-bold">أهلاً بك من جديد</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">استخدم رقم هاتفك للمتابعة إلى حسابك.</p><div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5"><button type="button" onClick={() => setRole('customer')} className={`rounded-xl py-2.5 text-sm font-bold ${role === 'customer' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`} data-testid="button-role-customer">أنا عميل</button><button type="button" onClick={() => setRole('provider')} className={`rounded-xl py-2.5 text-sm font-bold ${role === 'provider' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`} data-testid="button-role-provider">أنا مهني</button></div>{sent ? <div className="mt-8 rounded-2xl bg-emerald-500/10 p-5 text-center" data-testid="status-otp-sent"><span className="mx-auto flex size-11 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="size-5" /></span><h3 className="mt-4 font-bold">تم إرسال رمز التحقق</h3><p className="mt-1 text-sm text-muted-foreground">تحقق من الرسائل على الرقم {phone}</p><button type="button" onClick={() => setSent(false)} className="mt-4 text-sm font-bold text-primary" data-testid="button-edit-phone">تعديل الرقم</button></div> : <form onSubmit={(event) => { event.preventDefault(); setSent(true); }} className="mt-8" data-testid="form-auth"><label className="block text-sm font-bold">رقم الهاتف<div className="mt-2 flex h-12 overflow-hidden rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"><span className="flex items-center border-l border-border px-3 text-sm font-bold text-muted-foreground" dir="ltr">+212</span><input required minLength={9} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6 00 00 00 00" className="min-w-0 flex-1 bg-transparent px-3 text-left outline-none" dir="ltr" data-testid="input-auth-phone" /></div></label><button type="submit" className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground transition hover:bg-primary/90" data-testid="button-send-otp">إرسال رمز التحقق <ArrowLeft className="size-4" /></button><p className="mt-5 text-center text-xs leading-6 text-muted-foreground">بالمتابعة، أنت توافق على شروط الاستخدام وسياسة الخصوصية.</p></form>}</div></div></div></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/request/new" component={NewRequest} /><Route path="/requests" component={Requests} /><Route path="/requests/:id" component={RequestDetail} /><Route path="/provider/wallet" component={Wallet} /><Route path="/admin" component={Admin} /><Route path="/admin/catalog" component={Catalog} /><Route path="/auth" component={Auth} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;