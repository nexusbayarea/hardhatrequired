import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch } from '@/lib/db';

export const runtime = 'edge';

interface LocalizedString {
  en: string;
  zh: string;
}

interface MockCompliance {
  id: string;
  title: LocalizedString;
  authority: LocalizedString;
  penaltyRisk: LocalizedString;
  effectiveDate: string;
}

interface MockNews {
  id: string;
  title: LocalizedString;
  source: LocalizedString;
  impact: 'High' | 'Medium' | 'Low';
  publishedAt: string;
}

const VERTICAL_DATA: Record<string, { compliance: MockCompliance[]; news: MockNews[] }> = {
  slurry_processing: {
    compliance: [
      {
        id: "c-slurry-01",
        title: {
          en: "NPDES Stormwater Part B: Concrete Slurry Handling Permit",
          zh: "NPDES 雨水 B 部分：混凝土泥浆处理许可证"
        },
        authority: {
          en: "California Regional Water Board",
          zh: "加利福尼亚区域水务局"
        },
        penaltyRisk: {
          en: "$15,000 per-day violation",
          zh: "每天违规处罚 $15,000"
        },
        effectiveDate: "2026-10-01"
      },
      {
        id: "c-slurry-02",
        title: {
          en: "EPA Title 22 Hazardous Materials Tracking Manifest",
          zh: "EPA Title 22 有害物质跟踪清单"
        },
        authority: {
          en: "California Department of Toxic Substances Control",
          zh: "加利福尼亚有毒物质控制部"
        },
        penaltyRisk: {
          en: "$25,000 flat administrative fee plus citations",
          zh: "$25,000 固定行政费外加罚单"
        },
        effectiveDate: "2026-11-15"
      }
    ],
    news: [
      {
        id: "n-slurry-01",
        title: {
          en: "EPA signals stricter field audits for Bay Area road grind operations",
          zh: "环保署暗示将对湾区道路打磨作业实施更严格的外场审计"
        },
        source: {
          en: "Industrial EnviroNews",
          zh: "工业环境新闻网"
        },
        impact: "High",
        publishedAt: "2 days ago"
      },
      {
        id: "n-slurry-02",
        title: {
          en: "Caltrans implements slurry recycling mandate for local micro-surfacing pilots",
          zh: "加州交通厅对当地微表处试点项目实施泥浆循环利用强制令"
        },
        source: {
          en: "Western Logistics & Roads Journal",
          zh: "西部物流与公路杂志"
        },
        impact: "Medium",
        publishedAt: "Yesterday"
      }
    ]
  },
  industrial_wastewater: {
    compliance: [
      {
        id: "c-water-01",
        title: {
          en: "Clean Water Act Section 402: Liquid Hydrocarbon discharge limits",
          zh: "清洁水法案第 402 条：液态烃排放限制"
        },
        authority: {
          en: "Federal EPA Region 9",
          zh: "联邦环保署第 9 区分署"
        },
        penaltyRisk: {
          en: "$32,500 daily assessment",
          zh: "每日罚款评估 $32,500"
        },
        effectiveDate: "2026-09-01"
      }
    ],
    news: [
      {
        id: "n-water-01",
        title: {
          en: "Oakland Port expansion drives double-digit demand for high-volume vacuum transport",
          zh: "奥克兰港扩建推动大容量真空转运需求实现两位数增长"
        },
        source: {
          en: "Bay Logistix Weekly",
          zh: "湾区物流周刊"
        },
        impact: "High",
        publishedAt: "3 days ago"
      }
    ]
  },
  dewatering: {
    compliance: [
      {
        id: "c-dew-01",
        title: {
          en: "SWPPP Construction Runoff Monitoring & Siltation Controls",
          zh: "SWPPP 施工径流监测与淤积控制"
        },
        authority: {
          en: "Local Municipal Environmental Division",
          zh: "地方市政环境处"
        },
        penaltyRisk: {
          en: "$5,000 daily citation",
          zh: "每日罚款 $5,000"
        },
        effectiveDate: "2026-08-15"
      }
    ],
    news: [
      {
        id: "n-dew-01",
        title: {
          en: "Heavy winter run-offs double municipal groundwater remediation requirements",
          zh: "冬季强径流导致市政地下水修复需求增加一倍"
        },
        source: {
          en: "NorCal Water Digest",
          zh: "北加水务文摘"
        },
        impact: "Medium",
        publishedAt: "4 days ago"
      }
    ]
  },
  default: {
    compliance: [
      {
        id: "c-def-01",
        title: {
          en: "General Industrial SWPPP Discharge & Runoff Mandate",
          zh: "通用工业 SWPPP 排放和径流指令"
        },
        authority: {
          en: "Environmental Protection Agency",
          zh: "国家环境保护署"
        },
        penaltyRisk: {
          en: "$10,000 potential citation",
          zh: "面临高达 $10,000 的罚单风险"
        },
        effectiveDate: "2026-12-01"
      }
    ],
    news: [
      {
        id: "n-def-01",
        title: {
          en: "Steel prices and fleet lease adjustments ease contractor overhead projections",
          zh: "钢材价格和车队租赁调整缓解了承包商的管理费用预期"
        },
        source: {
          en: "Equipment Staging Weekly",
          zh: "设备准备周刊"
        },
        impact: "Low",
        publishedAt: "5 days ago"
      }
    ]
  }
};

export async function POST(req: NextRequest) {
  try {
    const vertical = req.headers.get('x-iie-client-context') || 'default';
    const lang = req.headers.get('Accept-Language') === 'zh' ? 'zh' : 'en';
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

    const rawSelected = VERTICAL_DATA[vertical] || VERTICAL_DATA.default;
    
    const compliance = rawSelected.compliance.map(c => ({
      id: c.id,
      title: c.title[lang],
      authority: c.authority[lang],
      penaltyRisk: c.penaltyRisk[lang],
      effectiveDate: c.effectiveDate
    }));

    const news = rawSelected.news.map(n => ({
      id: n.id,
      title: n.title[lang],
      source: n.source[lang],
      impact: n.impact,
      publishedAt: n.publishedAt
    }));

    return NextResponse.json({
      success: true,
      bids: bids || [],
      compliance,
      news
    });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to compile the intelligence hub stream." },
      { status: 500 }
    );
  }
}