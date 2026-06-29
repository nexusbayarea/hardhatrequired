import { Listing } from '../../schemas/listing';

export interface MarketReport {
    name: string;
    searchDate: string;
    totalCompanies: number;
    priorityA: number;
    priorityB: number;
    priorityC: number;
    coverage: {
        phone: number;
        website: number;
        email: number;
    };
}

export class ReportingEngine {
    generate(name: string, listings: Listing[]): MarketReport {
        const total = listings.length;
        if (total === 0) {
            return {
                name,
                searchDate: new Date().toISOString().split('T')[0],
                totalCompanies: 0,
                priorityA: 0,
                priorityB: 0,
                priorityC: 0,
                coverage: { phone: 0, website: 0, email: 0 }
            };
        }

        const priorityA = listings.filter(c => c.priority === 'A').length;
        const priorityB = listings.filter(c => c.priority === 'B').length;
        const priorityC = listings.filter(c => c.priority === 'C').length;

        const hasPhone = listings.filter(c => !!c.phone).length;
        const hasWebsite = listings.filter(c => !!c.website).length;
        const hasEmail = listings.filter(c => !!c.email).length;

        return {
            name,
            searchDate: new Date().toISOString().split('T')[0],
            totalCompanies: total,
            priorityA,
            priorityB,
            priorityC,
            coverage: {
                phone: Math.round((hasPhone / total) * 100),
                website: Math.round((hasWebsite / total) * 100),
                email: Math.round((hasEmail / total) * 100)
            }
        };
    }
}
