import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="text-center py-20">
          <h1 className="text-xl font-bold mb-2">Company Profile</h1>
          <p className="text-sm text-muted mb-6 break-all">ID: {id}</p>
          <p className="text-sm text-muted">Full company details coming soon.</p>
        </div>
      </div>
    </div>
  );
}
