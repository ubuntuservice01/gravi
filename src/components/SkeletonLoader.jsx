import React from 'react';

const SkeletonLoader = ({ type = 'table', rows = 5 }) => {
    const SkeletonPulse = () => (
        <div style={{
            backgroundColor: '#e2e8f0',
            borderRadius: '8px',
            height: '20px',
            width: '100%',
            animation: 'pulse 1.5s infinite ease-in-out'
        }} />
    );

    if (type === 'card') {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="card" style={{ padding: '1.5rem', animation: 'pulse 1.5s infinite ease-in-out' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e2e8f0', marginBottom: '1rem' }} />
                        <div style={{ height: '12px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '12px' }} />
                        <div style={{ height: '24px', width: '70%', backgroundColor: '#e2e8f0', borderRadius: '6px' }} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '12px' }}>
                <div style={{ height: '40px', width: '200px', backgroundColor: '#e2e8f0', borderRadius: '10px' }} />
                <div style={{ height: '40px', width: '100px', backgroundColor: '#e2e8f0', borderRadius: '10px' }} />
            </div>
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem' }}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} style={{ height: '12px', flex: 1, backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
                    ))}
                </div>
                {[...Array(rows)].map((_, i) => (
                    <div key={i} style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem' }}>
                        {[...Array(5)].map((_, j) => (
                            <div key={j} style={{ flex: 1 }}>
                                <SkeletonPulse />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default SkeletonLoader;
