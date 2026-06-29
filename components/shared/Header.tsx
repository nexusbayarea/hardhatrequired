'use client';

import React from 'react';
import { LayoutGrid, Globe, Phone, FileText, Zap } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
    onSearchClick: () => void;
}

export default function Header({ onSearchClick }: HeaderProps) {
    return (
        <nav className="site-nav" id="main-nav">
            <div className="nav-logo">
                <div className="nav-logo-icon nav-logo-icon-red">
                    <Zap size={18} fill="#dc2626" color="#dc2626" />
                </div>
                <span>HHR</span>
            </div>

            <div className="nav-links">
                <a href="#market" className="nav-link">Market Index</a>
                <a href="#outreach" className="nav-link">Outreach</a>
                <a href="#intelligence" className="nav-link">Intelligence</a>
            </div>

            <div className="nav-actions">
                <ThemeToggle />
                <button
                    onClick={onSearchClick}
                    className="btn btn-primary"
                    id="global-search-btn"
                >
                    Explore Market
                </button>
            </div>
        </nav>
    );
}
