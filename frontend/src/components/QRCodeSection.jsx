import React, { useState } from 'react';
import { QrCode, X, AlertCircle, Check } from 'lucide-react';
import api from '../services/api';

const QRCodeSection = ({ user, addNotification }) => {
    const [showQR, setShowQR] = useState(false);
    const [qrCodeImage, setQrCodeImage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerateQR = async () => {
        setLoading(true);
        try {
            const res = await api.post('/users/me/qrcode/generate');
            setQrCodeImage(res.data.qrCode);
            setShowQR(true);

            // ✅ Só mostra notificação se era a primeira vez
            if (!user.qrCodeEnabled) {
                addNotification('success', 'QR Code gerado com sucesso!');
            }
        } catch (error) {
            addNotification('error', 'Erro ao gerar QR Code');
        } finally {
            setLoading(false);
        }
    };

    const handleDisableQR = async () => {
        if (!window.confirm('Tem certeza que deseja desativar o login com QR Code?')) {
            return;
        }

        setLoading(true);
        try {
            await api.delete('/users/me/qrcode');
            setShowQR(false);
            setQrCodeImage('');
            addNotification('success', 'QR Code desativado!');
        } catch (error) {
            addNotification('error', 'Erro ao desativar QR Code');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadQR = () => {
        const link = document.createElement('a');
        link.href = qrCodeImage;
        link.download = `qrcode-${user.username}.png`;
        link.click();
    };

    return (
        <div className="qr-section">
            <div className="qr-header">
                <div className="qr-title">
                    <QrCode size={24} />
                    <div>
                        <h3>Login com QR Code</h3>
                        <p>Acesso rápido sem password</p>
                    </div>
                </div>
                {user.qrCodeEnabled && (
                    <span className="qr-badge active">
                        <Check size={14} /> Ativo
                    </span>
                )}
            </div>

            <div className="qr-info">
                <AlertCircle size={18} />
                <p>
                    Gere um QR Code único para fazer login rapidamente.
                    Guarde o QR Code num local seguro.
                </p>
            </div>

            {!user.qrCodeEnabled ? (
                <button
                    className="btn-primary qr-btn"
                    onClick={handleGenerateQR}
                    disabled={loading}
                >
                    <QrCode size={18} />
                    {loading ? 'A gerar...' : 'Gerar QR Code'}
                </button>
            ) : (
                <div className="qr-actions">
                    <button
                        className="btn-secondary qr-btn"
                        onClick={handleGenerateQR}  // ✅ Mudei de setShowQR para handleGenerateQR
                        disabled={loading}
                    >
                        <QrCode size={18} />
                        {loading ? 'A gerar...' : 'Ver QR Code'}
                    </button>
                    <button
                        className="btn-danger qr-btn"
                        onClick={handleDisableQR}
                        disabled={loading}
                    >
                        <X size={18} />
                        Desativar
                    </button>
                </div>
            )}

            {showQR && qrCodeImage && (
                <div className="qr-display">
                    <div className="qr-image-wrapper">
                        <img src={qrCodeImage} alt="QR Code" />
                    </div>
                    <button
                        className="btn-download"
                        onClick={handleDownloadQR}
                    >
                        Guardar QR Code
                    </button>
                    <p className="qr-warning">
                        ⚠️ Não partilhe este QR Code com ninguém!
                    </p>
                </div>
            )}

            <style>{`
                .qr-section {
                    margin-top: 2rem;
                    padding: 2rem;
                    background: var(--bg-primary);
                    border-radius: 0.75rem;
                    border: 1px solid var(--border-color);
                }
                .qr-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.5rem;
                }
                .qr-title {
                    display: flex;
                    gap: 1rem;
                    align-items: flex-start;
                }
                .qr-title svg {
                    color: var(--accent-primary);
                    flex-shrink: 0;
                    margin-top: 0.25rem;
                }
                .qr-title h3 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1.25rem;
                }
                .qr-title p {
                    margin: 0;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }
                .qr-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 2rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                }
                .qr-badge.active {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }
                .qr-info {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 0.5rem;
                    margin-bottom: 1.5rem;
                }
                .qr-info svg {
                    color: #3b82f6;
                    flex-shrink: 0;
                    margin-top: 0.125rem;
                }
                .qr-info p {
                    margin: 0;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    color: var(--text-secondary);
                }
                .qr-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    font-size: 0.95rem;
                }
                .btn-primary {
                    background: var(--accent-primary);
                    color: white;
                    width: 100%;
                }
                .btn-primary:hover:not(:disabled) {
                    background: var(--accent-hover);
                    transform: translateY(-2px);
                }
                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .qr-actions {
                    display: flex;
                    gap: 1rem;
                }
                .btn-secondary {
                    flex: 1;
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                }
                .btn-secondary:hover {
                    background: var(--bg-secondary);
                }
                .btn-danger {
                    background: transparent;
                    border: 1px solid #ef4444;
                    color: #ef4444;
                }
                .btn-danger:hover:not(:disabled) {
                    background: rgba(239, 68, 68, 0.1);
                }
                .qr-display {
                    margin-top: 1.5rem;
                    padding: 1.5rem;
                    background: var(--bg-secondary);
                    border-radius: 0.5rem;
                    text-align: center;
                }
                .qr-image-wrapper {
                    display: inline-block;
                    padding: 1rem;
                    background: white;
                    border-radius: 0.5rem;
                    margin-bottom: 1rem;
                }
                .qr-image-wrapper img {
                    display: block;
                    width: 256px;
                    height: 256px;
                }
                .btn-download {
                    background: var(--accent-primary);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 1rem;
                }
                .btn-download:hover {
                    background: var(--accent-hover);
                }
                .qr-warning {
                    margin: 0;
                    font-size: 0.875rem;
                    color: #f59e0b;
                    font-weight: 600;
                }
                @media (max-width: 768px) {
                    .qr-section { padding: 1.5rem; }
                    .qr-actions { flex-direction: column; }
                    .qr-image-wrapper img {
                        width: 200px;
                        height: 200px;
                    }
                }
            `}</style>
        </div>
    );
};

export default QRCodeSection;