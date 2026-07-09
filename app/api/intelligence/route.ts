import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch } from '@/lib/db';

export const runtime = 'edge';

interface MockCompliance {
  id: string;
  title: string;
  authority: string;
  penaltyRisk: string;
  effectiveDate: string;
}

interface MockNews {
  id: string;
  title: string;
  source: string;
  impact: 'High' | 'Medium' | 'Low';
  publishedAt: string;
}

const VERTICAL_DATA: Record<string, { compliance: MockCompliance[]; news: MockNews[] }> = {
  slurry_processing: {
    compliance: [
      {
        id: "c-slurry-01",
        title: "NPDES Stormwater Part B: Concrete Slurry Handling Permit",
        authority: "California Regional Water Board",
        penaltyRisk: "$15,000 per-day violation",
        effectiveDate: "2026-10-01"
      },
      {
        id: "c-slurry-02",
        title: "EPA Title 22 Hazardous Materials Tracking Manifest",
        authority: "California Department of Toxic Substances Control",
        penaltyRisk: "$25,000 flat administrative fee plus citations",
        effectiveDate: "2026-11-15"
      }
    ],
    news: [
      {
        id: "n-slurry-01",
        title: "EPA signals stricter field audits for Bay Area road grind operations",
        source: "Industrial EnviroNews",
        impact: "High",
        publishedAt: "2 days ago"
      },
      {
        id: "n-slurry-02",
        title: "Caltrans implements slurry recycling mandate for local micro-surfacing pilots",
        source: "Western Logistics & Roads Journal",
        impact: "Medium",
        publishedAt: "Yesterday"
      }
    ]
  },
  industrial_wastewater: {
    compliance: [
      {
        id: "c-water-01",
        title: "Clean Water Act Section 402: Liquid Hydrocarbon discharge limits",
        authority: "Federal EPA Region 9",
        penaltyRisk: "$32,500 daily assessment",
        effectiveDate: "2026-09-01"
      }
    ],
    news: [
      {
        id: "n-water-01",
        title: "Oakland Port expansion drives double-digit demand for high-volume vacuum transport",
        source: "Bay Logistix Weekly",
        impact: "High",
        publishedAt: "3 days ago"
      }
    ]
  },
  dewatering: {
    compliance: [
      {
        id: "c-dew-01",
        title: "SWPPP Construction Runoff Monitoring & Siltation Controls",
        authority: "Local Municipal Environmental Division",
        penaltyRisk: "$5,000 daily citation",
        effectiveDate: "2026-08-15"
      }
    ],
    news: [
      {
        id: "n-dew-01",
        title: "Heavy winter run-offs double municipal groundwater remediation requirements",
        source: "NorCal Water Digest",
        impact: "Medium",
        publishedAt: "4 days ago"
      }
    ]
  },
  default: {
    compliance: [
      {
        id: "c-def-01",
        title: "General Industrial SWPPP Discharge & Runoff Mandate",
        authority: "Environmental Protection Agency",
        penaltyRisk: "$10,000 potential citation",
        effectiveDate: "2026-12-01"
      }
    ],
    news: [
      {
        id: "n-def-01",
        title: "Steel prices and fleet lease adjustments ease contractor overhead projections",
        source: "Equipment Staging Weekly",
        impact: "Low",
        publishedAt: "5 days ago"
      }
    ]
  }
};

export async function POST(req: NextRequest) {
  try {
    const vertical = req.headers.get('x-iie-client-context') || 'default';
    let body: { state?: string } = {};
    
    try {
      body = await req.json();
    } catch {
      // Graceful fallback for empty or malformed request payloads
    }

    const filterState = body.state ? body.state.toUpperCase() : null;

    let queryPath = "/rest/v1/bid_results?select=id,title,agency,estimated_value,due_at,state,city,bid_source,status,description,created_at&status=in.(open,closing_soon)";
    
    if (filterState) {
      queryPath += `&state=eq.${filterState}`;
    }
    
    queryPath += "&order=due_at.asc&limit=10";

    let bids = [];
    try {
      const res = await supabaseFetch(queryPath);
      if (res.ok) {
        bids = await res.json();
      } else {
        console.warn(`Supabase endpoint responded with HTTP status ${res.status}. Falling back to general query...`);
        // Fallback: Query all states to guarantee database results are available
        const fallbackRes = await supabaseFetch(
          "/rest/v1/bid_results?select=id,title,agency,estimated_value,due_at,state,city,bid_source,status,description,created_at&status=in.(open,closing_soon)&order=due_at.asc&limit=10"
        );
        if (fallbackRes.ok) {
          bids = await fallbackRes.json();
        }
      }
    } catch (dbErr) {
      console.warn("Supabase database fetch failed. Using fallback empty stack:", dbErr);
    }

    const selectedData = VERTICAL_DATA[vertical] || VERTICAL_DATA.default;
    
    return NextResponse.json({
      success: true,
      bids: bids || [],
      compliance: selectedData.compliance,
      news: selectedData.news
    });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to compile the intelligence hub stream." },
      { status: 500 }
    );
  }
}