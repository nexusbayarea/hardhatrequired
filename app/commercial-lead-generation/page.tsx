import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Commercial Market Intelligence & Revenue Analysis | Index Intelligence Engine",
  description: "Professional market intelligence services. Fix revenue leakage, qualify high-ticket B2B leads, and optimize your sales pipeline with AI-powered analysis.",
  keywords: ["market intelligence", "B2B lead qualification", "revenue leakage", "lead analysis", "commercial sales"],
};

export default function CommercialLeadGenPage() {
  return (
    <div className="min-h-screen dot-grid-bg">
      {/* Navigation */}
      <nav className="site-nav">
        <div className="nav-logo">
          <div className="nav-logo-icon nav-logo-icon-red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span>IIE</span>
        </div>
        <div className="nav-links">
          <a href="/#workflow" className="nav-link">How It Works</a>
          <a href="/#usecases" className="nav-link">Use Cases</a>
          <a href="/#extension" className="nav-link">Extension</a>
          <a href="/#pilot" className="nav-link">Pilot</a>
          <a href="https://github.com/Btwndlinez/Index-Intelligence-Engine" target="_blank" rel="noopener" className="nav-link">GitHub</a>
        </div>
        <div className="nav-actions">
          <a href="/#pilot" className="btn btn-primary">Pilot Access</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" style={{ paddingTop: "140px" }}>
        <div className="hero-badge">
          <div className="hero-badge-dot" />
          Semantic SEO Optimized
        </div>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: "1.1" }}>
          Professional Commercial Market Intelligence <span>&amp; Revenue Analysis</span>
        </h1>

        <p className="hero-sub" style={{ maxWidth: "720px" }}>
          Acquiring high-quality commercial prospects requires more than volume—it demands
          precision. Our intelligence engine identifies revenue leakage, qualifies high-ticket B2B opportunities,
          and transforms your pipeline into a predictable revenue machine.
        </p>

        <div className="hero-cta">
          <a href="/#engine" className="btn btn-primary">Launch IIE</a>
          <a href="#segments" className="btn btn-secondary">Explore Segments</a>
        </div>
      </section>

      {/* Revenue Leakage Section */}
      <section className="section" id="revenue-leakage">
        <div className="section-label">• Problem Identification</div>
        <h2 className="section-title">Identifying and Fixing Revenue Leakage in B2B Markets</h2>
        <p className="section-desc">
          Revenue leakage occurs when qualified prospects slip through your sales process unnoticed.
          In commercial B2B markets, this typically happens during lead handoff, qualification gaps,
          or delayed follow-up. Our analysis engine detects these friction points before they cost you deals.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginTop: "40px"
        }}>
          <div className="engine-card" style={{ cursor: "default" }}>
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="card-label">LEAK SOURCE</p>
            <h3 className="card-title">Delayed Response</h3>
            <p className="card-desc">
              B2B buyers expect sub-hour response times. Delays beyond 2 hours reduce
              conversion probability by 80%.
            </p>
          </div>

          <div className="engine-card" style={{ cursor: "default" }}>
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="card-label">LEAK SOURCE</p>
            <h3 className="card-title">Poor Qualification</h3>
            <p className="card-desc">
              Without proper lead scoring, sales teams waste cycles on unqualified prospects
              while hot leads go cold.
            </p>
          </div>

          <div className="engine-card" style={{ cursor: "default" }}>
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <p className="card-label">LEAK SOURCE</p>
            <h3 className="card-title">Data Silos</h3>
            <p className="card-desc">
              When lead data lives in disconnected systems, context gets lost and
              personalization becomes impossible.
            </p>
          </div>
        </div>
      </section>

      {/* Specialized Segments Section */}
      <section className="section" id="segments">
        <div className="section-label">• Service Specialization</div>
        <h2 className="section-title">Our Specialized Commercial Lead Segments</h2>
        <p className="section-desc">
          Different industries require different qualification criteria. Our engine adapts
          to segment-specific signals, ensuring your sales team receives pre-qualified
          prospects that match your ideal customer profile.
        </p>

        <div className="card-grid">
          <div className="engine-card" style={{ cursor: "default" }}>
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <p className="card-label">SEGMENT</p>
            <h3 className="card-title">High-Ticket Service Lead Qualification</h3>
            <p className="card-desc">
              For consultancies, agencies, and professional services commanding $50K+ contracts.
              We identify decision-makers with budget authority and immediate need signals.
            </p>
          </div>

          <div className="engine-card" style={{ cursor: "default" }}>
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <p className="card-label">SEGMENT</p>
            <h3 className="card-title">Industrial &amp; Manufacturing Index Intelligence Engine</h3>
            <p className="card-desc">
              B2B manufacturing requires technical qualification. We capture RFI/RFP intent,
              engineering specifications, and procurement timelines for heavy industry sales.
            </p>
          </div>

          <div className="engine-card" style={{ cursor: "default" }}>
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
              </svg>
            </div>
            <p className="card-label">SEGMENT</p>
            <h3 className="card-title">Enterprise SaaS Revenue Recovery</h3>
            <p className="card-desc">
              SaaS churn and expansion revenue require different signals. We identify usage
              patterns that predict upgrades, cross-sells, and renewal risks before they occur.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section" id="faq">
        <div className="section-label">• Common Questions</div>
        <h2 className="section-title">Data-Driven Lead Analysis FAQ</h2>
        <p className="section-desc">
          Understanding commercial lead generation requires clarity on methodology,
          timelines, and ROI measurement.
        </p>

        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {[
            {
              q: "How does lead qualification differ from lead scoring?",
              a: "Lead scoring assigns numerical values to prospect attributes. Lead qualification is the binary determination of sales-readiness. Our engine combines both—using AI to score behavioral signals while applying your specific qualification criteria (BANT, MEDDIC, or custom frameworks) to determine handoff timing."
            },
            {
              q: "What constitutes 'revenue leakage' in lead generation?",
              a: "Revenue leakage refers to potential deals lost due to process inefficiencies—not competition. Examples include leads that never receive follow-up (24% of B2B leads), qualified prospects routed to the wrong sales rep, or hot leads cooling due to SLA breaches. Our engine surfaces these gaps."
            },
            {
              q: "How quickly can we expect qualified leads?",
              a: "Initial setup requires 3-5 business days for integration and qualification rule configuration. Once active, leads flow in real-time. Most clients see their first qualified prospects within 48 hours of launch, with volume scaling based on your traffic and market demand."
            },
            {
              q: "Do you integrate with our existing CRM?",
              a: "Yes. We offer native integrations with Salesforce, HubSpot, Pipedrive, and Zoho. For custom CRMs, our REST API enables two-way sync with webhook support for real-time lead status updates."
            },
            {
              q: "How do you measure lead quality?",
              a: "Quality metrics include: conversion rate to opportunity (target: &gt;25%), sales cycle length reduction, average contract value of qualified leads vs. unqualified, and rep efficiency (deals closed per qualified lead). We provide dashboards tracking these KPIs weekly."
            }
          ].map((faq, i) => (
            <div key={i} style={{
              borderBottom: "1px solid var(--border)",
              padding: "24px 0",
            }}>
              <h3 style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "12px",
                color: "var(--fg)"
              }}>
                {faq.q}
              </h3>
              <p style={{
                fontSize: "0.95rem",
                lineHeight: "1.6",
                color: "var(--fg-secondary)"
              }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" id="contact" style={{ textAlign: "center" }}>
        <div className="section-label">• Ready to Start</div>
        <h2 className="section-title" style={{ marginBottom: "24px" }}>
          Transform Your Commercial Lead Pipeline
        </h2>
        <p className="hero-sub" style={{ margin: "0 auto 32px" }}>
          Join companies using our intelligence engine to eliminate revenue leakage and
          accelerate qualified pipeline velocity.
        </p>
        <div className="hero-cta" style={{ justifyContent: "center" }}>
          <a href="/" className="btn btn-primary">Launch IIE</a>
          <a href="mailto:contact@indexintelligenceengine.com" className="btn btn-secondary">
            Contact Sales
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="nav-logo-icon nav-logo-icon-red" style={{ width: "24px", height: "24px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span>Index Intelligence Engine</span>
          </div>
          <div className="footer-links">
            <a href="/" className="footer-link">Dashboard</a>
            <a href="/commercial-lead-generation" className="footer-link">Commercial</a>
            <a href="https://github.com/Btwndlinez/Index-Intelligence-Engine" target="_blank" rel="noopener" className="footer-link">GitHub</a>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>
            © 2026 • Semantic SEO Optimized
          </div>
        </div>
      </footer>
    </div>
  );
}
