import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Download, X, FileText, Printer, CheckCircle } from 'lucide-react';

const ConsolidatedReportModal = ({ transactions, selectedMonth, selectedYear, onClose }) => {
    const { settings } = useSettings();

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const totalAmount = transactions.reduce((acc, curr) => acc + Number(curr.value || curr.amount), 0);
    const count = transactions.length;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px', backdropFilter: 'blur(4px)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '800px', padding: 0, overflow: 'hidden', animation: 'fadeInUp 0.3s ease-out' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={20} color="var(--primary)" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>Relatório Consolidado de Receita</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                </div>

                <div style={{ padding: '2rem', maxHeight: '75vh', overflowY: 'auto' }}>
                    <div id="print-area" style={{ padding: '30px', border: '1px solid #f1f5f9', borderRadius: '12px', backgroundColor: 'white' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <h1 style={{ fontSize: '1.4rem', color: '#1e293b', textTransform: 'uppercase', marginBottom: '5px', fontWeight: '900' }}>{settings.municipalityName}</h1>
                            <h2 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '700', margin: 0 }}>MAPA MENSAL DE COBRANÇA — {monthNames[selectedMonth - 1].toUpperCase()} {selectedYear}</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                <p style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', marginBottom: '5px' }}>Total de Transações</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>{count}</p>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                                <p style={{ fontSize: '0.65rem', color: '#16a34a', textTransform: 'uppercase', fontWeight: '800', marginBottom: '5px' }}>Receita Bruta</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: '900', color: '#16a34a', margin: 0 }}>{totalAmount.toLocaleString()} MT</p>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '10px', border: '1px solid #dbeafe' }}>
                                <p style={{ fontSize: '0.65rem', color: '#2563eb', textTransform: 'uppercase', fontWeight: '800', marginBottom: '5px' }}>Emissão de Licenças</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2563eb', margin: 0 }}>
                                    {transactions.filter(t => (t.payment_type || t.type) === 'Licença').length}
                                </p>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #1e293b' }}>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>DATA</th>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>REF</th>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>CONTRIBUINTE</th>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>OPERACAO</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>VALOR (MT)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '8px' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '8px', fontFamily: 'monospace' }}>{tx.reference || 'N/A'}</td>
                                        <td style={{ padding: '8px' }}>{tx.owners?.full_name || tx.owner || 'N/A'}</td>
                                        <td style={{ padding: '8px' }}>{tx.payment_type || tx.type}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>{Number(tx.value || tx.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ borderTop: '2px solid #1e293b', fontWeight: '900' }}>
                                    <td colSpan={4} style={{ padding: '12px', textAlign: 'right' }}>TOTAL GERAL:</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>{totalAmount.toLocaleString()} MT</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                            <div style={{ textAlign: 'center', width: '200px' }}>
                                <div style={{ borderBottom: '1px solid #333', marginBottom: '5px' }}></div>
                                <p>O Tesoureiro Municipal</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p>Gerado por MotoGest® em {new Date().toLocaleString()}</p>
                                <p style={{ color: '#94a3b8' }}>ID: MG-REP-{Date.now().toString().slice(-8)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f8fafc', display: 'flex', gap: '1rem', borderTop: '1px solid #f1f5f9', justifyContent: 'flex-end' }}>
                    <button
                        className="btn"
                        style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}
                        onClick={onClose}
                    >
                        Fechar
                    </button>
                    <button 
                        className="btn btn-primary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }} 
                        onClick={handlePrint}
                    >
                        <Printer size={18} /> Imprimir Mapa
                    </button>
                </div>
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
                    .card { box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
};

export default ConsolidatedReportModal;
