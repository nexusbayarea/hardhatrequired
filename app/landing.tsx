'use client';

import { useState, useEffect, Fragment } from 'react';
import {
  Search, Database, Target, TrendingUp, Menu, X,
  ArrowRight, ChevronRight, Layers, MapPin, HardHat,
  Zap, Phone, FileText, BarChart2,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import ThemeToggle from '@/components/shared/ThemeToggle';
import DailyIntelligenceHub from '@/components/dashboard/DailyIntelligenceHub';
import LiveActivityTicker from '@/components/landing/LiveActivityTicker';
import CoverageStatistics from '@/components/landing/CoverageStatistics';
import EquipmentStrip from '@/components/landing/EquipmentStrip';
import LatestBidCard from '@/components/landing/LatestBidCard';
import ComplianceAlertStrip from '@/components/landing/ComplianceAlertStrip';
import ForemanDrawer from '@/components/ai/ForemanDrawer';

/* ─── nav ─────────────────────────────────────────────────────── */
const navLinks = [
  { label: 'Intelligence Feed', href: '/dashboard' },
];

/* ─── steps ───────────────────────────────────────────────────── */
const steps = [
  {
    n: '01',
    icon: MapPin,
    titleKey: 'search your market',
    bodyKey: 'enter a zip code. pick a vertical. we scan every company within your radius — contractors, subs, suppliers.',
  },
  {
    n: '02',
    icon: Target,
    titleKey: 'score every lead',
    bodyKey: 'our ai ranks companies by revenue signals, fleet size, and buying intent. you see who\'s ready to spend.',
  },
  {
    n: '03',
    icon: Phone,
    titleKey: 'close the job',
    bodyKey: 'one-tap calling, auto-enriched contacts, and ai-drafted bid proposals. done before the next pour.',
  },
];

/* ─── engines ─────────────────────────────────────────────────── */
const engines = [
  {
    icon: Search,
    titleKey: 'discovery engine',
    descKey: 'search 8+ verticals with geo-intelligence and industry signals. find companies your competitors don\'t know exist.',
  },
  {
    icon: Database,
    titleKey: 'enrichment engine',
    descKey: 'auto-populate verified contacts, phones, emails, and decision-maker data for every company found.',
  },
  {
    icon: Target,
    titleKey: 'scoring engine',
    descKey: 'priority rankings based on revenue, fleet, permit activity, and buying signals. know who to call first.',
  },
  {
    icon: TrendingUp,
    titleKey: 'campaign engine',
    descKey: 'deploy targeted outreach and track every touchpoint from first call to signed contract.',
  },
];

/* ─── verticals ────────────────────────────────────────────────── */
const verticals = [
  { name: 'Industry Index', status: 'Live', detail: 'Slurry, Concrete, Asbestos, Medical Waste Disposal' },
  { name: 'Construction', status: 'Beta', detail: 'General, earthworks, framing, specialty' },
  { name: 'Industrial', status: 'Beta', detail: 'Manufacturing, heavy equipment, logistics' },
  { name: 'Energy', status: 'Q3 2026', detail: 'Utilities, renewables, pipeline' },
  { name: 'Hospitality', status: 'Q4 2026', detail: 'Hotels, restaurants, facilities' },
  { name: 'Equipment', status: 'Beta', detail: 'Equipment rentals' },
];

/* ─── lang toggle ──────────────────────────────────────────────── */
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';

/* ─── component ────────────────────────────────────────────────── */
function LandingInner() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
      {/* ───── NAVBAR ───── */}
      <nav
        className={`h-20 transition-all duration-300 ${
          scrolled ? 'border-b' : 'border-b border-transparent'
        }`}
        style={{
          borderColor: scrolled ? 'var(--color-border)' : 'transparent',
          backgroundColor: scrolled ? 'color-mix(in srgb, var(--color-bg) 85%, transparent)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 h-20 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg"
              style={{ background: 'var(--color-red)' }}
            >
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="font-display text-2xl tracking-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, letterSpacing: '-0.01em' }}
              >
                HHR
              </span>
              <span className="text-[15px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                Hard Hat Required
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center flex-nowrap overflow-hidden min-w-0 flex-1 mx-4">
            {navLinks.map((l, i) => (
              <Fragment key={l.label}>
                {i > 0 && <span className="text-sm shrink-0" style={{ color: 'var(--color-muted)' }}>|</span>}
                <Link
                  href={l.href}
                  className="px-2 py-2.5 text-sm font-semibold uppercase tracking-wider rounded-lg transition-colors truncate min-w-0"
                  style={{ color: 'var(--color-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
                >
                  {t(l.label)}
                </Link>
              </Fragment>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="px-5 py-2.5 text-sm font-semibold uppercase tracking-wider rounded-lg transition-colors"
              style={{ color: 'var(--color-muted)' }}
            >
              {t('Login')}
            </Link>
            <a
              href="#cta"
              className="btn-primary"
              style={{ height: '44px', fontSize: '0.875rem', padding: '0 24px' }}
            >
              {t('Get Access')}
            </a>
          </div>

          {/* Mobile: lang toggle + theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageToggle mobile />
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="p-3 rounded-xl transition-all"
              style={{ background: 'var(--color-surface2)' }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden px-5 pt-2 pb-6 space-y-1 border-t animate-slide-down"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            {navLinks.map(l => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-4 text-base font-semibold rounded-xl transition-colors"
                style={{ color: 'var(--color-muted)' }}
              >
                {t(l.label)}
              </Link>
            ))}
            <div
              className="pt-4 mt-4 border-t flex flex-col gap-3"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <LanguageToggle mobile />
              <Link
                href="/dashboard"
                className="btn-secondary"
                style={{ width: '100%', height: '56px' }}
                onClick={() => setMobileOpen(false)}
              >
                {t('Login')}
              </Link>
              <a
                href="#cta"
                className="btn-primary"
                style={{ width: '100%', height: '56px' }}
                onClick={() => setMobileOpen(false)}
              >
                {t('Get Access')} →
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ───── HERO ───── */}
      <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
        {/* Background — vertical grid lines + red orb + tape measure on left */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical grid lines */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${(i + 1) * (100 / 7)}%`,
                background: 'var(--color-border)',
                opacity: 0.4,
              }}
            />
          ))}
          {/* Red glow orb */}
          <div
            className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              top: '-10%',
              right: '-5%',
              background: 'radial-gradient(circle, color-mix(in srgb, var(--color-red) 15%, transparent) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          {/* Vertical tape measure on left */}
          <div className="tape-measure">
            <div className="tape-measure-ticks" />
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num, i) => (
              <span key={i} className="tape-measure-num" style={{ top: `${(i + 1) * (100 / 9)}%` }}>
                {num}′
              </span>
            ))}
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-5 md:px-8 w-full py-12 md:py-20 relative z-10">
          <div className="max-w-5xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-8">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse-dot"
                style={{ background: 'var(--color-red)' }}
              />
              <span className="section-label tracking-widest">
                {t('Construction Market Intelligence')}
              </span>
            </div>

            {/* Headline — Palantir-scale */}
            <h1
              className="text-hero mb-8"
              style={{ color: 'var(--color-text)' }}
            >
              {t('Find Every Job')}.<br />
              <span style={{ color: 'var(--color-red)' }}>{t('Win Every Bid')}.</span>
            </h1>

            {/* Sub — large, legible in sunlight */}
            <p
              className="mb-10 max-w-2xl"
              style={{
                fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
                lineHeight: 1.5,
                color: 'var(--color-muted)',
                fontWeight: 500,
              }}
            >
              {t('AI-powered market intelligence built for the field.')}
              {t('Search by ZIP. Score companies. Close more contracts —')}
              {t('whether you\'re on a job site at noon or running a night crew.')}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mb-12">
              {[
                { icon: HardHat, label: t('Built for Construction') },
                { icon: MapPin, label: t('Geo-Targeted Search') },
                { icon: FileText, label: t('AI Bid Proposals') },
                { icon: BarChart2, label: t('Live Lead Scoring') },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-5 py-3 rounded-full text-xl font-bold"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: 'var(--color-red)' }} />
                  {label}
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="btn-primary"
                style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)', height: '64px', padding: '0 40px' }}
              >
                {t('Open Dashboard')} <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="mailto:demo@indexintelligence.io"
                className="btn-secondary"
                style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)', height: '64px', padding: '0 40px' }}
              >
                {t('Book a Demo')}
              </a>
            </div>
          </div>
        </div>

        {/* Foreman */}
        <ForemanDrawer />

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>
            {t('scroll')}
          </span>
          <div
            className="w-px h-12"
            style={{ background: 'linear-gradient(to bottom, var(--color-muted), transparent)' }}
          />
        </div>
      </section>

      {/* ───── LIVE ACTIVITY TICKER ───── */}
      <LiveActivityTicker />

      {/* ───── PALANTIR-STYLE DIVIDER ───── */}
      <div className="palantir-rule" />

      {/* ───── COVERAGE STATISTICS ───── */}
      <CoverageStatistics />

      <div className="palantir-rule" />

      {/* ───── DAILY INTELLIGENCE HUB ───── */}
      <section id="daily" className="py-24 md:py-36">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          <DailyIntelligenceHub landing />
        </div>
      </section>

      <div className="palantir-rule" />

      {/* ───── ENGINES ───── */}
      <section id="engines" className="py-24 md:py-36">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* Left: copy */}
            <div className="lg:sticky lg:top-28">
              <p className="section-label mb-4">{t('core engines')}</p>
              <h2 className="text-section mb-6" style={{ color: 'var(--color-text)' }}>
                {t('four engines.')}<br />
                <span style={{ color: 'var(--color-muted)' }}>{t('one platform.')}</span>
              </h2>
              <p style={{ fontSize: '1.125rem', color: 'var(--color-muted)', lineHeight: 1.7, fontWeight: 500, maxWidth: '480px' }}>
                  {t('every function you need to prospect, enrich, score, and close — unified in a single field-hardened interface built for construction teams.')}
              </p>
              <div className="mt-10">
                <Link href="/dashboard" className="btn-primary" style={{ width: '100%', maxWidth: '320px' }}>
                {t('Open Dashboard')} <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Right: engine cards */}
            <div className="space-y-4">
                {engines.map((e, i) => (
                <div
                  key={e.titleKey}
                  className="group p-7 rounded-xl transition-all duration-200"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    animationDelay: `${i * 80}ms`,
                  }}
                  onMouseEnter={e2 => {
                    (e2.currentTarget as HTMLDivElement).style.borderColor =
                      'color-mix(in srgb, var(--color-red) 50%, var(--color-border))';
                    (e2.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={e2 => {
                    (e2.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
                    (e2.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
                  }}
                >
                  <div className="flex items-start gap-5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
                    >
                      <e.icon className="w-6 h-6" style={{ color: 'var(--color-red)' }} />
                    </div>
                    <div>
                      <h3
                        className="font-bold mb-2"
                        style={{ fontSize: '1.25rem', fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text)' }}
                      >
                        {t(e.titleKey)}
                      </h3>
                      <p style={{ fontSize: '1rem', color: 'var(--color-muted)', lineHeight: 1.65, fontWeight: 500 }}>
                        {t(e.descKey)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="palantir-rule" />

      {/* ───── HOW IT WORKS ───── */}
      <section id="how-it-works" className="py-24 md:py-36">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          <div className="mb-16 md:mb-24">
            <p className="section-label mb-4">{t('how it works')}</p>
            <h2 className="text-section" style={{ color: 'var(--color-text)' }}>
              {t('three steps.')}<br />
              <span style={{ color: 'var(--color-muted)' }}>{t('zero guesswork.')}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className="relative p-8 md:p-10"
                style={{
                  borderRight: i < steps.length - 1 ? '1px solid var(--color-border)' : 'none',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                {/* Step number — huge, faded */}
                <div
                  className="font-display text-8xl font-black mb-6 select-none"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: 'color-mix(in srgb, var(--color-red) 20%, transparent)',
                    lineHeight: 1,
                  }}
                >
                  {step.n}
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: 'color-mix(in srgb, var(--color-red) 12%, var(--color-surface2))' }}
                >
                  <step.icon className="w-6 h-6" style={{ color: 'var(--color-red)' }} />
                </div>
                <h3
                  className="font-bold mb-4"
                  style={{
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.625rem)',
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: 'var(--color-text)',
                  }}
                >
                  {t(step.titleKey)}
                </h3>
                <p style={{ fontSize: '1.0625rem', lineHeight: 1.6, color: 'var(--color-muted)', fontWeight: 500 }}>
                  {t(step.bodyKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="palantir-rule" />

      <div className="h-16" />

      {/* ───── EQUIPMENT STRIP ───── */}
      <EquipmentStrip />

      <div className="palantir-rule" />

      {/* ───── LATEST BID CARD ───── */}
      <LatestBidCard />

      <div className="palantir-rule" />

      <div className="h-16" />

      {/* ───── COMPLIANCE ALERT STRIP ───── */}
      <ComplianceAlertStrip />

      <div className="palantir-rule" />

      <div className="h-16" />

      {/* ───── VERTICALS ───── */}
      <section id="verticals" className="py-24 md:py-36">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          <div className="mb-16">
            <p className="section-label mb-4">{t('industry verticals')}</p>
            <h2 className="text-section" style={{ color: 'var(--color-text)' }}>
              {t('built for your industry.')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {verticals.map((v) => {
              const isLive = v.status === 'Live';
              const isBeta = v.status === 'Beta';
              return (
                <div
                  key={v.name}
                  className="p-7 rounded-xl transition-all"
                  style={{
                    background: isLive ? 'color-mix(in srgb, var(--color-red) 6%, var(--color-surface))' : 'var(--color-surface)',
                    border: isLive
                      ? '1px solid color-mix(in srgb, var(--color-red) 35%, var(--color-border))'
                      : '1px solid var(--color-border)',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3
                      className="font-bold"
                      style={{
                        fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
                        fontFamily: "'Space Grotesk', sans-serif",
                        color: 'var(--color-text)',
                      }}
                    >
                      {v.name}
                    </h3>
                    <span
                      className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: isLive
                          ? 'var(--color-red)'
                          : isBeta
                          ? 'color-mix(in srgb, var(--color-yellow) 15%, var(--color-surface2))'
                          : 'var(--color-surface2)',
                        color: isLive ? 'white' : isBeta ? 'var(--color-yellow)' : 'var(--color-muted)',
                        border: isBeta ? '1px solid color-mix(in srgb, var(--color-yellow) 30%, transparent)' : 'none',
                      }}
                    >
                      {v.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted)', fontWeight: 500 }}>
                    {v.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="palantir-rule" />

      <div className="h-16" />

      {/* ───── CTA ───── */}
      <section id="cta" className="py-24 md:py-40 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--color-red) 12%, transparent) 0%, transparent 60%)',
          }}
        />
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 relative z-10">
          <div className="max-w-3xl">
            <p className="section-label mb-4">{t('get started today')}</p>
            <h2 className="text-section mb-8" style={{ color: 'var(--color-text)' }}>
              {t('your market.')}<br />
              <span style={{ color: 'var(--color-red)' }}>{t('mapped in minutes.')}</span>
            </h2>
            <p
              className="mb-12 max-w-xl"
              style={{ fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)', color: 'var(--color-muted)', lineHeight: 1.6, fontWeight: 500 }}
            >
              {t('book a 20-minute demo. we\'ll map your market live and show you exactly where the revenue is — before your competitors find it.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:demo@indexintelligence.io"
                className="btn-primary"
                style={{ height: '68px', fontSize: '1.125rem', width: '100%', maxWidth: '320px' }}
              >
                {t('Book a Demo')} <ArrowRight className="w-5 h-5" />
              </a>
              <Link
                href="/dashboard"
                className="btn-secondary"
                style={{ height: '68px', fontSize: '1.125rem', width: '100%', maxWidth: '280px' }}
              >
                {t('Open Dashboard')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer style={{ background: 'var(--color-bg)', borderTop: '2px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '72px 32px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 64 }}>
            
            {/* Brand column */}
            <div style={{ gridColumn: 'span 1' }}>
              <Link href="/" className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HardHat className="w-5 h-5 text-white" />
                </div>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 33, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                  HHR
                </span>
              </Link>
              <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.8, marginBottom: 24, maxWidth: 240, fontWeight: 500 }}>
                {t('Find every job. Win every bid. — AI-powered market intelligence built for the field.')}
              </p>

              {/* App store badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                <button className="btn-primary" style={{ width: 'fit-content', height: 48, padding: '0 20px', fontSize: 13, gap: 8, borderRadius: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  App Store
                </button>
                <button className="btn-primary" style={{ width: 'fit-content', height: 48, padding: '0 20px', fontSize: 13, gap: 8, borderRadius: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.595-2.09.91-3.21.9C10.18 21.17 7 18 7 14c0-3.31 2.69-6 6-6 1.52 0 2.87.57 3.9 1.49L14.57 12H20v-2h-6.14c-.48-.77-1.24-1.36-2.14-1.65C10.73 8.12 9.35 8 8 8.14 5.63 8.43 3.74 9.94 3.14 12c-.73 2.47.43 5.13 2.86 6.26.53.24 1.09.4 1.66.46-1.69-.39-3.16-1.64-3.66-3.31C3.39 12.85 4.74 10.14 7.31 9.19c1.04-.4 2.17-.5 3.25-.24 1.11.27 2.07.89 2.74 1.77.67.88 1 1.98.94 3.11-.05 1.06-.45 2.06-1.15 2.83-.7.77-1.66 1.26-2.7 1.37-1.04.11-2.1-.16-2.97-.76-.87-.6-1.49-1.53-1.72-2.57-.5-2.19.93-4.39 3.11-4.89.49-.11 1-.14 1.5-.07-.7.28-1.26.79-1.61 1.45-.35.66-.44 1.43-.25 2.15.37 1.38 1.7 2.22 3.09 1.97.66-.12 1.25-.47 1.67-.99.42-.52.65-1.17.62-1.84C12.05 11.69 11 10.91 9.84 10.91h-.37c.82-.54 1.83-.71 2.78-.47 2.08.53 3.39 2.55 3.14 4.71-.12 1.04-.61 2.01-1.41 2.71-.8.7-1.84 1.09-2.91 1.11-.52.01-1.04-.06-1.54-.22-.19.23-.39.45-.59.66.57.19 1.16.3 1.76.3 1.49 0 2.96-.56 4.06-1.55l.29.28z"/></svg>
                  Google Play
                </button>
              </div>

              {/* Social icons */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 12 }}>Follow Us</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { label: 'X', href: '#', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                    { label: 'LinkedIn', href: '#', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                    { label: 'Instagram', href: '#', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                    { label: 'YouTube', href: '#', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
                  ].map(s => (
                    <a key={s.label} href={s.href} aria-label={s.label}
                      style={{
                        width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-muted)',
                        transition: 'all 0.2s', cursor: 'pointer',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-red)'; e.currentTarget.style.borderColor = 'var(--color-red)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={s.path}/></svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Product links */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 20 }}>Product</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Company Discovery','Lead Scoring','Contact Enrichment','Campaign Engine','Market Intelligence','API Access','Pricing'].map(link => (
                  <li key={link}>
                    <Link href="#" style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
                    >{link}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 20 }}>Company</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['About Us','Blog','Careers','Press','Partners','Contact'].map(link => (
                  <li key={link}>
                    <Link href="#" style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
                    >{link}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 20 }}>Legal</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Privacy Policy','Terms of Service','Cookie Policy','Accessibility','Security','Sitemap'].map(link => (
                  <li key={link}>
                    <Link href="#" style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
                    >{link}</Link>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => alert('Cookie preferences panel would open here')}
                style={{
                  marginTop: 20, display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border)',
                  background: 'transparent', color: 'var(--color-muted)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-red)'; e.currentTarget.style.color = 'var(--color-red)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-muted)'; }}
              >
                🍪 Cookie Preferences
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 28 }} />

          {/* Bottom bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>© 2026 Hard Hat Required. All rights reserved.</span>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Made 🏗️ in the USA</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-muted)', maxWidth: 400, textAlign: 'center' }}>
              Data sourced from public records, permits, and licensed business registries. Verify independently for final decisions.
            </span>
            <LanguageToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Wrap with ThemeProvider so the toggle works on the landing page */
export default function LandingPage() {
  return (
    <ThemeProvider>
      <LandingInner />
    </ThemeProvider>
  );
}
