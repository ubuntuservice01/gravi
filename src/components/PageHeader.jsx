import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PageHeader = ({ title, subtitle, breadcrumbs = [], actions }) => {
    return (
        <div style={{ marginBottom: '2.5rem' }}>
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '12px', 
                    fontSize: '0.8rem', 
                    fontWeight: '600' 
                }}>
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={crumb.path || idx}>
                            {crumb.path ? (
                                <Link to={crumb.path} style={{ color: '#64748b', textDecoration: 'none' }}>
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span style={{ color: '#0f172a' }}>{crumb.label}</span>
                            )}
                            {idx < breadcrumbs.length - 1 && (
                                <ChevronRight size={12} color="#94a3b8" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{ 
                        fontSize: '2rem', 
                        fontWeight: '900', 
                        color: '#0f172a', 
                        margin: 0, 
                        letterSpacing: '-0.5px' 
                    }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p style={{ 
                            color: '#64748b', 
                            fontSize: '1rem', 
                            fontWeight: '500', 
                            marginTop: '4px' 
                        }}>
                            {subtitle}
                        </p>
                    )}
                </div>

                {actions && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
