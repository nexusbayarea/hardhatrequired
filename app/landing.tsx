"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  ArrowRight,
  Sun,
  Moon,
  Phone,
  Mail,
  Menu,
  X,
  Wrench,
  Gauge,
  Shield,
  RefreshCw,
  GitBranch,
  BarChart3,
  Truck,
  HardHat,
  Briefcase,
  Users,
  Radio,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("hhr-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored === "dark" || (!stored && prefersDark) ? "dark" : "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("hhr-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Verticals", href: "#verticals" },
    { label: "Indexes", href: "#indexes" },
    { label: "Intelligence", href: "#intelligence" },
    { label: "Products", href: "#products" },
    { label: "Pricing", href: "#pricing" },
  ];

  useEffect(() => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const href = anchor.getAttribute("href");
        if (href) {
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: "smooth" });
            setMobileMenuOpen(false);
          }
        }
      });
    });
  }, []);

  const verticals = [
    "Asbestos Abatement",
    "Elevator Inspection",
    "Generator Load Bank",
    "Marine Construction",
    "Hydro Excavation",
    "Industrial Demolition",
    "Industrial Wastewater",
    "Medical Waste",
    "Slurry Processing",
    "Stormwater SWPPP",
    "Tank Testing UST",
    "High Voltage Electrical",
    "Trench Shoring",
    "Industrial Sandblasting",
    "Dewatering",
    "Hazardous Soil",
    "Fire Sprinklers",
    "HVAC",
    "Solar + BESS",
    "Wind Energy",
  ];

  const indexes = [
    { title: "Labor Index", icon: Users, desc: "Certified contractors, operators, specialty crews, inspectors, and engineers." },
    { title: "Disposal Index", icon: Truck, desc: "Landfills, recyclers, treatment facilities, waste processors, EPA sites." },
    { title: "Equipment Rental Index", icon: Wrench, desc: "Vac trucks, hydrovacs, generators, shoring, lifts, heavy equipment." },
    { title: "Equipment Purchase Index", icon: Briefcase, desc: "Dealers, used equipment, auctions, manufacturers." },
    { title: "Bid Intelligence Index", icon: FileText, desc: "City, county, state DOT, utilities, private contracts." },
    { title: "Compliance Index", icon: Shield, desc: "OSHA, EPA, state regs, local code, permits." },
  ];

  const engineFeatures = [
    { title: "Signal Engine", icon: Radio, desc: "Ingest and normalize signals from all data sources." },
    { title: "Scoring Engine", icon: Gauge, desc: "Compute Signal, Distance, Regulatory, Trust, and Feedback scores." },
    { title: "Ranking Engine", icon: BarChart3, desc: "Sort results by relevance, proximity, and trust." },
    { title: "Recommendation Engine", icon: GitBranch, desc: "Suggest the best next step based on workflow graph." },
    { title: "Compliance Engine", icon: Shield, desc: "Automatically check regulatory requirements." },
    { title: "Feedback Learning Engine", icon: RefreshCw, desc: "Improve results from user feedback (accurate, incorrect, trusted)." },
  ];

  const scores = [
    { label: "Signal Score", desc: "Strength of business signals from multiple sources." },
    { label: "Distance Score", desc: "Proximity to your project site." },
    { label: "Regulatory Score", desc: "Compliance health and permit status." },
    { label: "Trust Score", desc: "Based on past performance and user ratings." },
    { label: "Feedback Score", desc: "Aggregated from user corrections and approvals." },
  ];

  const products = [
    { title: "Contractor Search", icon: Users, desc: "Find qualified contractors across 20 verticals." },
    { title: "Disposal Search", icon: Truck, desc: "Locate disposal facilities and recycling options." },
    { title: "Rental Marketplace", icon: Wrench, desc: "Rent equipment from local providers." },
    { title: "Equipment Marketplace", icon: Briefcase, desc: "Buy new or used equipment." },
    { title: "Bid Intelligence Hub", icon: FileText, desc: "Track and win public and private bids." },
    { title: "Compliance AI Assistant", icon: Shield, desc: "Get real-time compliance guidance." },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans selection:bg-red-600 selection:text-white">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-gray-200 dark:border-gray-800"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">HHR</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <a
              href="#demo"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all"
            >
              Book Demo
            </a>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800 px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block text-sm font-medium text-gray-600 dark:text-gray-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sign In
              </Link>
              <a href="#demo" className="block text-center px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg">
                Book Demo
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-600/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                HardHatRequired &ndash; Construction Intelligence Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Find the Right{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500">
                  Contractor, Equipment, or Disposal
                </span>{" "}
                in Seconds
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
                HardHatRequired is the all-in-one intelligence engine for construction professionals &ndash; search 20 verticals, score vendors, win bids, and stay compliant.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/30"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#verticals"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-semibold rounded-xl transition-all border border-gray-200 dark:border-gray-800"
                >
                  Explore Verticals
                </a>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Trusted by <span className="font-semibold text-gray-900 dark:text-white">200+ contractors</span> nationwide
                </p>
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-3xl blur-2xl opacity-50" />
              <div className="relative bg-gray-50 dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d0d0d]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 text-center text-xs text-gray-400 font-mono">HHR Dashboard &mdash; Search Results</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Matches</div>
                      <div className="text-2xl font-bold">3,412</div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                      +18% this week
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 text-xs font-bold">
                          {String.fromCharCode(64 + i)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">ABC Demolition Co.</div>
                          <div className="text-xs text-gray-500">Industrial Demolition &bull; 3.2 mi &bull; Trust Score 94</div>
                        </div>
                        <div className="text-xs font-semibold text-red-600">High Match</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 text-center">&hellip; and 3,409 more results</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 20 Verticals */}
      <section id="verticals" className="py-24 bg-gray-50/50 dark:bg-white/[0.02] border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">Core Verticals</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              20 Specialized Construction Verticals
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              From asbestos abatement to wind energy &ndash; we cover the full spectrum of industrial services.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {verticals.map((v) => (
              <span
                key={v}
                className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] text-sm font-medium hover:border-red-500 dark:hover:border-red-500 transition-colors cursor-default"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Index Search */}
      <section id="indexes" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">Search Indexes</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              One Platform, Six Indexes
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Search across labor, disposal, equipment, bids, and compliance &ndash; all in one place.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {indexes.map((idx) => (
              <div
                key={idx.title}
                className="group p-6 rounded-2xl bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-900/50 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 mb-4 group-hover:scale-110 transition-transform">
                  <idx.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-2">{idx.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{idx.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligence Engine */}
      <section id="intelligence" className="py-24 bg-gray-50/50 dark:bg-white/[0.02] border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">Intelligence Engine</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              The Brain Behind HardHatRequired
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Six engines power the intelligence: signal ingestion, scoring, ranking, recommendation, compliance, and feedback learning.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {engineFeatures.map((feat) => (
              <div
                key={feat.title}
                className="p-6 rounded-2xl bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 hover:border-red-500/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                    <feat.icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-lg">{feat.title}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">Scoring System</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Five Scores, One Trusted Result
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Each vendor, facility, or piece of equipment is rated on multiple dimensions.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {scores.map((s) => (
              <div key={s.label} className="text-center p-4 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800">
                <div className="text-xl font-extrabold text-red-600 mb-1">{s.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge Graph & Workflow */}
      <section className="py-24 bg-gray-50/50 dark:bg-white/[0.02] border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">Knowledge Graph</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Connecting the Construction Ecosystem
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Our knowledge graph links verticals, labor, disposal, equipment, bids, and compliance &ndash; and recommends the right next step.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Need Labor?", icon: Users, desc: "Find certified contractors, operators, and inspectors." },
              { title: "Need Disposal?", icon: Truck, desc: "Locate landfills, recyclers, and treatment facilities." },
              { title: "Need Rental Equipment?", icon: Wrench, desc: "Rent vac trucks, generators, shoring, and more." },
              { title: "Need Equipment Purchase?", icon: Briefcase, desc: "Buy new or used from dealers and auctions." },
              { title: "Need Bid Help?", icon: FileText, desc: "Discover public and private bid opportunities." },
              { title: "Need Compliance Guidance?", icon: Shield, desc: "Navigate OSHA, EPA, and local regulations." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800">
                <item.icon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">Data Sources</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Powered by Curated &amp; Public Data
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We aggregate from TomTom, Overpass API, state regulatory databases, EPA, Apollo, bid sources, and manual curation.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
            <span className="px-4 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-full">TomTom</span>
            <span className="px-4 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-full">Overpass API</span>
            <span className="px-4 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-full">State Reg Databases</span>
            <span className="px-4 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-full">EPA Data</span>
            <span className="px-4 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-full">Apollo</span>
            <span className="px-4 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-full">Bid Sources</span>
            <span className="px-4 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-full">Manual Curated Data</span>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-24 bg-gray-50/50 dark:bg-white/[0.02] border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">Products</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              What You Can Build With HHR
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Six powerful applications, all driven by the same intelligence engine.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.title} className="p-6 rounded-2xl bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 hover:border-red-500/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                    <p.icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-lg">{p.title}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Ecosystem */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">Coming Soon</div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            The Future of Construction Intelligence
          </h2>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="px-6 py-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-xl font-semibold">OrderSyncAgent</div>
            <div className="px-6 py-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-xl font-semibold">Wiring Code</div>
            <div className="px-6 py-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-xl font-semibold">Intelligence Index Engine</div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50/50 dark:bg-white/[0.02] border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">Pricing</div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Simple, Transparent Plans</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-12">Pilot, Pro, and Enterprise &ndash; coming soon. Contact us for early access.</p>
          <a href="#demo" className="inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-600/20">
            Request Pilot Access
          </a>
        </div>
      </section>

      {/* Final CTA */}
      <section id="demo" className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to Transform Your Construction Workflow?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Book a 20-minute demo. We&rsquo;ll show you how to find the right contractor, equipment, or disposal in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:demo@hardhatrequired.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-600/20"
            >
              <Mail className="w-4 h-4" />
              Book Demo
            </a>
            <a
              href="tel:+18005551234"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-[#111] text-gray-900 dark:text-white font-semibold rounded-xl transition-all border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            >
              <Phone className="w-4 h-4" />
              Call Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-600 rounded-md flex items-center justify-center">
                <HardHat className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight">HARDHATREQUIRED</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-600">
              &copy; 2026 HardHatRequired. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
