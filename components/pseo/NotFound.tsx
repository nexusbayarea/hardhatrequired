'use client';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
        Page Not Found
      </h1>
      <p className="text-lg mb-8" style={{ color: 'var(--color-muted)' }}>
        We couldn&apos;t find a directory page for this location and service.
      </p>
      <a
        href="/dashboard"
        className="px-6 py-2 rounded-lg font-semibold transition-colors"
        style={{
          background: 'var(--color-accent)',
          color: 'var(--color-button-text)',
        }}
      >
        Search Contractors
      </a>
    </div>
  );
}
