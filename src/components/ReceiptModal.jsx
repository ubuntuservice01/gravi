import React, { useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Bike, Printer, Download, X } from 'lucide-react';

const ReceiptModal = ({ data, onClose }) => {
    const { settings } = useSettings();
    const receiptRef = useRef(null);

    const handlePrint = () => {
        const printContent = receiptRef.current;
        const windowUrl = 'about:blank';
        const uniqueName = new Date().getTime();
        const windowName = `Print_${uniqueName}`;
        const printWindow = window.open(windowUrl, windowName, 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');

        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Recibo MotoGest</title>
                        <style>
                            body { font-family: 'Inter', system-ui, sans-serif; padding: 20px; color: #333; }
                            .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; border-radius: 8px; }
                            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
                            .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #eee; padding-bottom: 5px; }
                            .label { color: #666; font-size: 0.9rem; }
                            .value { font-weight: 600; }
                            .total-box { background: #f9f9f9; padding: 20px; text-align: center; margin-top: 30px; border-radius: 12px; }
                            .total-amount { font-size: 2rem; font-weight: 800; color: ${settings.primaryColor}; }
                            .footer { margin-top: 40px; text-align: center; font-size: 0.8rem; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="receipt">
                            ${printContent?.innerHTML}
                        </div>
                        <script>window.onload = function() { window.print(); window.close(); }</script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px', backdropFilter: 'blur(4px)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden', animation: 'fadeInUp 0.3s ease-out' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>Recibo de Pagamento</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                </div>

                <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
                    <div ref={receiptRef} style={{ padding: '20px', border: '1px solid #f1f5f9', borderRadius: '12px', backgroundColor: 'white' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            {settings.logoUrl ? (
                                <img src={settings.logoUrl} alt="Logo" style={{ height: '40px', marginBottom: '10px', maxWidth: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ marginBottom: '10px' }}>
                                    <Bike size={32} color={settings.primaryColor} />
                                </div>
                            )}
                            <h2 style={{ fontSize: '1rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: '800' }}>{settings.municipalityName}</h2>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{settings.address || 'Conselho Municipal'}</p>
                        </div>

                        <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px', fontWeight: '700' }}>Nr. Referência</p>
                                <p style={{ fontWeight: '800', margin: 0, fontSize: '0.9rem', color: '#1e293b' }}>{data.reference || `PAY-${Date.now().toString().slice(-6)}`}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px', fontWeight: '700' }}>Data</p>
                                <p style={{ fontWeight: '800', margin: 0, fontSize: '0.9rem', color: '#1e293b' }}>{new Date(data.created_at || new Date()).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            {[
                                { label: 'Contribuinte', value: data.owners?.full_name || data.owner || 'N/A' },
                                { label: 'Veículo/Matrícula', value: data.motorcycles?.plate || data.plate || data.vehicle || '-' },
                                { label: 'Tipo de Serviço', value: data.payment_type || data.type || 'Emolumentos' },
                                { label: 'Método Pagamento', value: data.method || 'M-Pesa / POS' },
                                { label: 'Status', value: 'CONFIRMADO' }
                            ].map((row, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #f1f5f9' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.label}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b' }}>{row.value}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                            <p style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>Total Liquidado</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: settings.primaryColor, margin: 0 }}>
                                {Number(data.value || data.amount).toLocaleString()} MT
                            </h2>
                        </div>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <div style={{ margin: '0 auto 10px', width: '80px', height: '80px' }}>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=MOTOGEST-RECEIPT-${data.id || Date.now()}`}
                                    alt="QR Code"
                                    style={{ width: '100%', height: '100%', border: '1px solid #f1f5f9', padding: '4px', borderRadius: '8px', backgroundColor: 'white' }}
                                />
                            </div>
                            <p style={{ fontSize: '0.6rem', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>Autenticado digitalmente pelo Sistema MotoGest.</p>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f8fafc', display: 'flex', gap: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <button
                        className="btn"
                        style={{ flex: 1, backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}
                        onClick={handlePrint}
                    >
                        <Download size={16} /> Exportar
                    </button>
                    <button 
                        className="btn btn-primary" 
                        style={{ flex: 1, fontWeight: '700', fontSize: '0.85rem' }} 
                        onClick={handlePrint}
                    >
                        <Printer size={16} /> Imprimir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
