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
import LiveSearchProgress from '@/components/landing/LiveSearchProgress';
import CoverageStatistics from '@/components/landing/CoverageStatistics';
import LogisticsSnapshot from '@/components/landing/LogisticsSnapshot';
import EquipmentStrip from '@/components/landing/EquipmentStrip';
import LatestBidCard from '@/components/landing/LatestBidCard';
import ComplianceAlertStrip from '@/components/landing/ComplianceAlertStrip';

/* ─── nav ─────────────────────────────────────────────────────── */
const navLinks = [
  { label: 'Daily Intelligence', href: '#daily' },
  { label: 'Active Bids', href: '#daily' },
  { label: 'Compliance', href: '#daily' },
  { label: 'Lead Generation', href: '#engines' },
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
              className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
              style={{ background: 'var(--color-red)' }}
            >
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="font-display text-lg tracking-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, letterSpacing: '-0.01em' }}
              >
                HHR
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                Hard Hat Required
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center flex-nowrap overflow-hidden min-w-0 flex-1 mx-4">
            {navLinks.map((l, i) => (
              <Fragment key={l.label}>
                {i > 0 && <span className="text-sm shrink-0" style={{ color: 'var(--color-muted)' }}>|</span>}
                <a
                  href={l.href}
                  className="px-2 py-2.5 text-sm font-semibold uppercase tracking-wider rounded-lg transition-colors truncate min-w-0"
                  style={{ color: 'var(--color-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
                >
                  {t(l.label)}
                </a>
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
            <LanguageToggle />
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
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-4 text-base font-semibold rounded-xl transition-colors"
                style={{ color: 'var(--color-muted)' }}
              >
                {t(l.label)}
              </a>
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

      {/* ───── LIVE SEARCH PREVIEW ───── */}
      <section className="py-24 md:py-36">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          <div className="mb-12">
            <p className="section-label mb-4">live search demo</p>
            <h2 className="text-section" style={{ color: 'var(--color-text)' }}>
              see how it works.<br />
              <span style={{ color: 'var(--color-muted)' }}>watch the pipeline in action.</span>
            </h2>
          </div>
          <div className="max-w-md mx-auto">
            <LiveSearchProgress />
          </div>
        </div>
      </section>

      <div className="palantir-rule" />

      {/* ───── DAILY INTELLIGENCE HUB ───── */}
      <section id="daily" className="py-24 md:py-36">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          <DailyIntelligenceHub landing />
        </div>
      </section>

      <div className="palantir-rule" />

      <div className="h-16" />

      {/* ───── LIVE LOGISTICS SNAPSHOT ───── */}
      <LogisticsSnapshot />

      <div className="palantir-rule" />

      <div className="h-16" />

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

      <div className="h-16" />

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
      <footer
        className="py-12 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-[1400px] mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--color-red)' }}
              >
                <HardHat className="w-4 h-4 text-white" />
              </div>
              <span
                className="font-black text-lg"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '-0.01em' }}
              >
                HARD HATS REQUIRED
              </span>
            </Link>

            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
              © 2026 Hard Hat Required. All rights reserved.
            </span>
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
