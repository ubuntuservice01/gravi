import React from 'react';

const EmptyState = ({ icon, title, description, action }) => {
    return (
        <div style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '24px',
            border: '2px dashed #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            margin: '1rem 0'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8'
            }}>
                {React.cloneElement(icon, { size: 40 })}
            </div>
            
            <div style={{ maxWidth: '400px' }}>
                <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '800', 
                    color: '#0f172a',
                    marginBottom: '8px'
                }}>
                    {title}
                </h3>
                <p style={{ 
                    color: '#64748b', 
                    fontSize: '0.95rem', 
                    fontWeight: '500',
                    lineHeight: '1.5'
                }}>
                    {description}
                </p>
            </div>

            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
