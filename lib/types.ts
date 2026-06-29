export interface Facility {
    id: string;
    name: string;
    facilityType: string;
    city: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    acceptsConcreteSlurry: boolean;
    acceptsAsphaltSlurry: boolean;
    acceptsMixedSlurry: boolean;
    nightReceiving: boolean;
    earlyMorningReceiving: boolean;
    distanceMiles: number;
    pricePerLoad?: number;
    verified: boolean;
    notes?: string;
}


