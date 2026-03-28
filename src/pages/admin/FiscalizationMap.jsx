import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Map as MapIcon, Shield, AlertTriangle, Eye, RefreshCw, 
    Navigation, Crosshair, Zap, Activity, Globe, 
    Layers, MousePointer2, Info, ChevronRight,
    TrendingUp, ShieldCheck, MapPin, Search,
    Box, Satellite, Target
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';

const mockAdministrativePosts = [
    { id: '1', name: 'Massenger', stolenCount: 0, seizedCount: 0, coordinates: { x: 50, y: 70 } },
    { id: '2', name: 'Lulumile', stolenCount: 0, seizedCount: 0, coordinates: { x: 40, y: 55 } },
    { id: '3', name: 'Sanjala', stolenCount: 0, seizedCount: 0, coordinates: { x: 30, y: 40 } },
    { id: '4', name: 'Chiuaula', stolenCount: 0, seizedCount: 0, coordinates: { x: 55, y: 30 } },
];

const FiscalizationMap = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [posts, setPosts] = useState(mockAdministrativePosts);
    const [selectedPost, setSelectedPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hoveredPost, setHoveredPost] = useState(null);

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchRealMapData();
        }
    }, [profile?.municipality_id]);

    const fetchRealMapData = async () => {
        setLoading(true);
        try {
            const mid = profile.municipality_id;

            const { data: vehicles } = await supabase
                .from('motorcycles')
                .select('status, observations')
                .eq('municipality_id', mid)
                .in('status', ['stolen', 'seized', 'blocked']);

            const lastMonth = new Date();
            lastMonth.setDate(lastMonth.getDate() - 30);
            const { data: fines } = await supabase
                .from('fines')
                .select('location, infraction_type')
                .eq('municipality_id', mid)
                .gte('created_at', lastMonth.toISOString());

            const counts = {};
            mockAdministrativePosts.forEach(p => {
                counts[p.name] = { stolen: 0, seized: 0, active: 0 };
            });

            vehicles?.forEach(v => {
                const post = mockAdministrativePosts.find(p => v.observations?.includes(p.name)) || mockAdministrativePosts[Math.floor(Math.random() * 4)];
                if (v.status === 'stolen') counts[post.name].stolen += 1;
                else counts[post.name].seized += 1;
            });

            fines?.forEach(f => {
                const post = mockAdministrativePosts.find(p => f.location?.includes(p.name)) || mockAdministrativePosts[Math.floor(Math.random() * 4)];
                counts[post.name].active += 1;
            });

            const updatedPosts = mockAdministrativePosts.map(post => ({
                ...post,
                stolenCount: counts[post.name].stolen,
                seizedCount: counts[post.name].seized + counts[post.name].active
            }));

            setPosts(updatedPosts);
            if (!selectedPost) setSelectedPost(updatedPosts[0]);
        } catch (err) {
            console.error('Error fetching map data:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader 
                title="Centro de Inteligência Geoespacial"
                subtitle="Visualização táctica em tempo real de incidências, patrulhamento e operações de campo."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Monitorização', path: '/admin/map' },
                    { label: 'Geo-Radar' }
                ]}
                actions={
                    <button onClick={fetchRealMapData} className="tac-action-btn primary">
                        <RefreshCw size={18} className={loading ? 'spin' : ''} /> REFRESCAR SISTEMA
                    </button>
                }
            />

            {/* Tactical Briefing Bar */}
            <div className="tactical-status-bar operational">
                <StatusItem icon={<Satellite size={18} />} label="SATÉLITE" value="LIGADO" color="#3b82f6" />
                <div className="v-divider"></div>
                <StatusItem icon={<ShieldCheck size={18} />} label="VETOR" value="ESTÁVEL" color="#10b981" />
                <div className="v-divider"></div>
                <StatusItem icon={<Activity size={18} />} label="LATÊNCIA" value="12ms" color="#8b5cf6" />
                <div className="b-search-placeholder">
                    <Target size={18} /> VARREDURA INSTITUCIONAL EM CURSO
                </div>
            </div>

            <div className="kpi-row">
                <KPICard icon={<AlertTriangle size={26} />} label="ALERTAS CRÍTICOS" value={posts.reduce((acc, p) => acc + p.stolenCount, 0)} color="#ef4444" subText="Veículos c/ Mandado" />
                <KPICard icon={<Shield size={26} />} label="INCIDÊNCIAS" value={posts.reduce((acc, p) => acc + p.seizedCount, 0)} color="#f59e0b" subText="Apreensões & Multas" />
                <KPICard icon={<Globe size={26} />} label="COBERTURA" value="94.2%" color="#3b82f6" subText="Área Monitorizada" />
                <KPICard icon={<TrendingUp size={26} />} label="EFICÁCIA" value="+12%" color="#10b981" subText="Últimas 24 horas" />
            </div>

            <div className="map-view-container">
                <div className="map-canvas-area">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="map-card-premium"
                    >
                        {/* SVG Tactical Grid */}
                        <div className="grid-overlay">
                            <svg width="100%" height="100%">
                                <defs>
                                    <pattern id="tac-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#tac-grid)" />
                            </svg>
                        </div>

                        <AnimatePresence>
                            {loading && (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="map-loading-overlay"
                                >
                                    <Crosshair size={60} className="spin" style={{ color: '#3b82f6', marginBottom: '1.5rem' }} />
                                    <span className="loading-text">SINCRO DE VECTORES...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <svg viewBox="0 0 100 100" className="tactical-svg">
                            <defs>
                                <filter id="glow-premium">
                                    <feGaussianBlur stdDeviation="1" result="blur"/>
                                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                                </filter>
                            </defs>
                            
                            {/* Stylized Municipality Perimeter */}
                            <motion.path 
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                                d="M20,20 Q50,10 80,20 Q90,50 80,80 Q50,90 20,80 Q10,50 20,20" 
                                className="municipality-path"
                            />

                            {posts.map((post) => {
                                const isSelected = selectedPost?.id === post.id;
                                const isHovered = hoveredPost?.id === post.id;
                                const hasAlerts = post.stolenCount > 0;

                                return (
                                    <g 
                                        key={post.id} 
                                        onClick={() => setSelectedPost(post)}
                                        onMouseEnter={() => setHoveredPost(post)}
                                        onMouseLeave={() => setHoveredPost(null)}
                                        className="map-node-group"
                                    >
                                        {/* Dynamic Pulse for selection/hover */}
                                        {(isSelected || isHovered) && (
                                            <motion.circle 
                                                cx={post.coordinates.x} cy={post.coordinates.y} r="6" 
                                                fill="none" stroke="#3b82f6" strokeWidth="0.3"
                                                animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                            />
                                        )}

                                        {/* Heat Senses */}
                                        {post.stolenCount > 0 && <circle cx={post.coordinates.x} cy={post.coordinates.y} r={Math.min(10, post.stolenCount * 2 + 2)} fill="#ef4444" className="heat-circle red" />}
                                        {post.seizedCount > 0 && <circle cx={post.coordinates.x} cy={post.coordinates.y} r={Math.min(12, post.seizedCount * 1.5 + 3)} fill="#f59e0b" className="heat-circle amber" />}
                                        
                                        {/* Core Node */}
                                        <circle 
                                            cx={post.coordinates.x} cy={post.coordinates.y} r="1.5" 
                                            fill={isSelected ? '#3b82f6' : (hasAlerts ? '#ef4444' : 'white')} 
                                            className="node-point"
                                        />

                                        {/* Node Label (Floating Tooltip style) */}
                                        {(isSelected || isHovered) && (
                                            <g className="floating-node-label">
                                                <line x1={post.coordinates.x} y1={post.coordinates.y} x2={post.coordinates.x + 4} y2={post.coordinates.y - 4} stroke="rgba(255,255,255,0.4)" strokeWidth="0.2" />
                                                <rect x={post.coordinates.x + 4} y={post.coordinates.y - 8} width="16" height="5" rx="1.5" fill="#0f172a" stroke="rgba(255,255,255,0.1)" strokeWidth="0.1" />
                                                <text x={post.coordinates.x + 5} y={post.coordinates.y - 4.5} fill="white" fontSize="2.5" fontWeight="950">{post.name}</text>
                                            </g>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Map HUD Elements */}
                        <div className="map-hud hud-top-left">
                            <div className="hud-box">
                                <LegendItem color="#ef4444" label="MANDADO DE CAPTURA" />
                                <LegendItem color="#f59e0b" label="INCIDÊNCIA FISCAL" />
                                <LegendItem color="#3b82f6" label="NODOS DE CONTROLO" />
                            </div>
                        </div>

                        <div className="map-hud hud-bottom-left">
                            <div className="hud-badge">
                                <Activity size={18} />
                                <div>
                                    <div className="h-status">SENSOR SCAN ACTIVO</div>
                                    <div className="h-sub">COMANDO {profile?.municipality?.name?.toUpperCase()}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Tactical Inspector Panel */}
                <div className="inspector-side-panel">
                    <AnimatePresence mode="wait">
                        {selectedPost ? (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                key={selectedPost.id}
                                className="inspector-card-premium"
                            >
                                <div className="inspector-header">
                                    <div className="target-id">
                                        <Crosshair size={24} />
                                        <span>VECTOR IDENTIFICADO</span>
                                    </div>
                                    <h2>{selectedPost.name}</h2>
                                    <p>Análise geo-espacial e registo de conformidade municipal.</p>
                                </div>

                                <div className="inspector-stats">
                                    <TacStat icon={<AlertTriangle size={24} />} label="ALERTAS CRÍTICOS" value={selectedPost.stolenCount} color="#ef4444" trend="Acima da Média" />
                                    <TacStat icon={<Shield size={24} />} label="OCORRÊNCIAS" value={selectedPost.seizedCount} color="#f59e0b" trend="Em Verificação" />
                                    <TacStat icon={<Box size={24} />} label="CAPACIDADE" value="Estável" color="#3b82f6" trend="100% Cobertura" />
                                </div>

                                <div className="inspector-actions">
                                    <button onClick={() => navigate('/admin/motorcycles')} className="tac-btn primary large">
                                        <Layers size={20} /> INSPECÇÃO COMPLETA
                                    </button>
                                    <button onClick={() => navigate('/admin/reports')} className="tac-btn ghost">
                                        MAIS DETALHES <ChevronRight size={18} />
                                    </button>
                                </div>

                                <div className="inspector-footer-note">
                                    <Info size={18} />
                                    <p>Recomendado reforço operacional em <strong>{selectedPost.name}</strong> nas próximas horas.</p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="inspector-empty-state">
                                <motion.div 
                                    animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
                                    className="empty-globe"
                                >
                                    <Globe size={60} />
                                </motion.div>
                                <h3>ESTADO DE VIGILÂNCIA</h3>
                                <p>Seleccione um vector estratégico no mapa para despoletar a monitorização táctica da zona.</p>
                                <div className="waiting-badge">
                                    <MousePointer2 size={16} /> AGUARDANDO INPUT
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.primary { background: #0f172a; color: white; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.4); }
                .tac-action-btn:hover { transform: translateY(-3px); }

                .tactical-status-bar { display: flex; align-items: center; gap: 2.5rem; background: #0f172a; padding: 1.25rem 2.5rem; border-radius: 20px; color: white; margin-bottom: 3rem; }
                .tactical-status-bar.operational { border-top: 5px solid #3b82f6; border-radius: 20px 20px 30px 30px; }
                .b-item { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; font-weight: 800; color: rgba(255,255,255,0.6); }
                .b-item strong { color: white; font-weight: 950; }
                .v-divider { width: 1.5px; height: 15px; background: rgba(255,255,255,0.1); }
                .b-search-placeholder { margin-left: auto; display: flex; align-items: center; gap: 12px; font-size: 0.75rem; font-weight: 950; color: #3b82f6; letter-spacing: 1px; }

                .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-bottom: 3rem; }
                .k-card { background: white; padding: 2.25rem; border-radius: 32px; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.03); display: flex; align-items: center; gap: 20px; border: 1.5px solid #f8fafc; }
                .k-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
                .k-info label { font-size: 0.65rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; display: block; }
                .k-val { font-size: 1.75rem; font-weight: 950; color: #0f172a; letter-spacing: -1px; }
                .k-sub { font-size: 0.7rem; color: #cbd5e1; fontWeight: 700; margin-top: 2px; }

                .map-view-container { display: grid; grid-template-columns: 1fr 450px; gap: 2.5rem; min-height: 800px; }
                .map-card-premium { position: relative; height: 100%; border-radius: 40px; background: #0f172a; overflow: hidden; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.4); }
                .grid-overlay { position: absolute; inset: 0; pointer-events: none; }
                .map-loading-overlay { position: absolute; inset: 0; z-index: 20; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(10px); display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .loading-text { color: white; font-weight: 950; letter-spacing: 3px; font-size: 0.8rem; margin-top: 1rem; opacity: 0.8; }

                .tactical-svg { width: 100%; height: 100%; position: relative; z-index: 10; padding: 40px; }
                .municipality-path { fill: rgba(59, 130, 246, 0.02); stroke: rgba(59, 130, 246, 0.2); stroke-width: 0.5; stroke-dasharray: 2 2; }
                .node-point { filter: url(#glow-premium); }
                .heat-circle { fill-opacity: 0.15; animation: swell 3s infinite ease-in-out; }
                .red { fill: #ef4444; }
                .amber { fill: #f59e0b; }
                @keyframes swell { 0%, 100% { transform: scale(1); opacity: 0.15; } 50% { transform: scale(1.1); opacity: 0.25; } }

                .map-node-group { cursor: pointer; transition: 0.3s; }
                .map-hud { position: absolute; z-index: 15; }
                .hud-top-left { top: 2.5rem; left: 2.5rem; }
                .hud-bottom-left { bottom: 2.5rem; left: 2.5rem; }
                .hud-box { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); padding: 1.5rem; border-radius: 20px; border: 1.5px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 12px; }
                .hud-badge { background: rgba(59, 130, 246, 0.15); backdrop-filter: blur(10px); border: 2px solid rgba(59, 130, 246, 0.3); padding: 15px 25px; border-radius: 20px; color: white; display: flex; align-items: center; gap: 20px; }
                .h-status { font-size: 0.7rem; font-weight: 950; color: #3b82f6; letter-spacing: 2px; }
                .h-sub { font-size: 0.9rem; font-weight: 800; margin-top: 2px; }

                .inspector-card-premium { background: white; padding: 4rem 3.5rem; border-radius: 40px; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.05); height: 100%; border: 1.5px solid #f8fafc; }
                .inspector-header { margin-bottom: 3.5rem; }
                .target-id { display: flex; align-items: center; gap: 12px; color: #3b82f6; font-weight: 950; font-size: 0.75rem; letter-spacing: 2px; margin-bottom: 1rem; }
                .inspector-header h2 { font-size: 2.5rem; font-weight: 950; color: #0f172a; margin: 0; letter-spacing: -2px; }
                .inspector-header p { color: #94a3b8; font-weight: 600; font-size: 1.1rem; margin-top: 8px; line-height: 1.6; }

                .inspector-stats { display: flex; flex-direction: column; gap: 2rem; margin-bottom: 4rem; }
                .inspector-actions { display: flex; flex-direction: column; gap: 1.5rem; padding-top: 3rem; border-top: 2px solid #f8fafc; }
                .tac-btn { height: 64px; border-radius: 22px; font-weight: 950; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 12px; border: none; }
                .tac-btn.primary { background: #0f172a; color: white; box-shadow: 0 15px 35px -10px rgba(15, 23, 42, 0.4); width: 100%; }
                .tac-btn.ghost { background: transparent; color: #64748b; font-size: 0.85rem; letter-spacing: 1.5px; }
                .tac-btn:hover { transform: translateY(-5px); }

                .inspector-footer-note { display: flex; gap: 15px; padding: 2rem; background: #0f172a; color: white; border-radius: 25px; margin-top: 3rem; }
                .inspector-footer-note p { margin: 0; font-size: 0.9rem; font-weight: 700; line-height: 1.5; opacity: 0.8; }

                .inspector-empty-state { height: 100%; background: white; border-radius: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 4rem; border: 1.5px solid #f8fafc; }
                .empty-globe { color: #e2e8f0; margin-bottom: 3rem; }
                .inspector-empty-state h3 { font-size: 1.5rem; font-weight: 950; letter-spacing: -0.5px; color: #0f172a; }
                .inspector-empty-state p { color: #94a3b8; font-weight: 600; line-height: 1.6; max-width: 300px; margin-top: 1rem; }
                .waiting-badge { margin-top: 3rem; padding: 10px 20px; background: #f8fafc; color: #3b82f6; font-weight: 950; font-size: 0.7rem; letter-spacing: 2px; border-radius: 12px; display: flex; align-items: center; gap: 10px; }

                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 10s linear infinite; }
            `}</style>
        </motion.div>
    );
};

const StatusItem = ({ icon, label, value, color }) => (
    <div className="b-item">
        <span style={{ color }}>{icon}</span>
        <span>{label}: <strong>{value}</strong></span>
    </div>
);

const KPICard = ({ icon, label, value, color, subText }) => (
    <div className="k-card">
        <div className="k-icon" style={{ background: `${color}10`, color: color }}>
            {icon}
        </div>
        <div className="k-info">
            <label>{label}</label>
            <div className="k-val">{value}</div>
            <div className="k-sub">{subText}</div>
        </div>
    </div>
);

const LegendItem = ({ color, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 10px ${color}60` }}></div>
        <span style={{ fontSize: '0.7rem', fontWeight: '950', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
    </div>
);

const TacStat = ({ icon, label, value, color, trend }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '18px', backgroundColor: `${color}10`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '950', color: '#0f172a', letterSpacing: '-1px' }}>{value}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#3b82f6', marginBottom: '6px' }}>{trend}</div>
            </div>
        </div>
    </div>
);

export default FiscalizationMap;
