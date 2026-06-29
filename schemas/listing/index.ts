import { Entity } from '../entity';
import { Location } from '../location';
import { Contact } from '../contact';
import { Signal } from '../signal';

export interface Listing extends Entity, Location, Contact, Signal { }

export interface SearchRequest {
    zip: string;
    radius: number;
    industry: string;
}
