import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Upload, Scan } from 'lucide-react';
import jsQR from 'jsqr';

const QRCodeScanner = ({ onScanSuccess, onClose }) => {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [scanStatus, setScanStatus] = useState('Pronto para escanear');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastScanTimeRef = useRef(0);

    // Efeito para limpeza quando o componente desmonta
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            setError('');
            setIsVideoReady(false);
            setScanStatus('Iniciando câmera...');
            console.log('🎥 A tentar aceder à câmera...');

            // Parar qualquer stream anterior
            if (streamRef.current) {
                stopCamera();
            }

            // Solicitar acesso à câmera
            const constraints = {
                video: {
                    facingMode: 'environment', // Use 'environment' para câmera traseira
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                }
            };

            // Tenta primeiro com a câmera traseira, depois com a frontal
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                console.log('Tentando câmera frontal...');
                constraints.video.facingMode = 'user';
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            }

            console.log('✅ Câmera obtida!');
            streamRef.current = stream;

            // Atribuir o stream ao vídeo
            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // Esperar o vídeo estar pronto
                await new Promise((resolve) => {
                    if (videoRef.current.readyState >= 3) { // HAVE_FUTURE_DATA
                        resolve();
                        return;
                    }

                    const onReady = () => {
                        videoRef.current.removeEventListener('loadeddata', onReady);
                        videoRef.current.removeEventListener('canplay', onReady);
                        resolve();
                    };

                    videoRef.current.addEventListener('loadeddata', onReady);
                    videoRef.current.addEventListener('canplay', onReady);

                    // Timeout de segurança
                    setTimeout(resolve, 1000);
                });

                // Iniciar o modo de scanning
                setScanning(true);
                setIsVideoReady(true);
                setScanStatus('Aproxime o QR Code da câmera');

                // Iniciar o loop de detecção
                startScanLoop();
            }

        } catch (err) {
            console.error('❌ Erro câmera:', err);
            let errorMessage = 'Erro ao acessar a câmera';

            if (err.name === 'NotAllowedError') {
                errorMessage = 'Permissão para usar a câmera foi negada. Por favor, permita o acesso à câmera nas configurações do navegador.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'Nenhuma câmera encontrada';
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'Câmera não pode ser acessada (pode estar em uso por outro aplicativo)';
            } else if (err.name === 'OverconstrainedError') {
                errorMessage = 'Configuração de câmera não suportada';
            }

            setError(`${errorMessage}`);
        }
    };

    const startScanLoop = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        const scanLoop = () => {
            const now = Date.now();
            // Limitar a taxa de scan para ~15fps para performance
            if (now - lastScanTimeRef.current > 66) { // ~15 FPS
                scanQRCode();
                lastScanTimeRef.current = now;
            }
            animationFrameRef.current = requestAnimationFrame(scanLoop);
        };

        animationFrameRef.current = requestAnimationFrame(scanLoop);
    };

    const scanQRCode = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.readyState < 2) return;

        try {
            const context = canvas.getContext('2d', { willReadFrequently: true });

            // Usar o tamanho real do vídeo
            const videoWidth = video.videoWidth || 640;
            const videoHeight = video.videoHeight || 480;

            if (videoWidth === 0 || videoHeight === 0) return;

            // Definir tamanho do canvas
            canvas.width = videoWidth;
            canvas.height = videoHeight;

            // Desenhar o frame atual
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Obter dados da imagem
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            // Tentar detectar o QR Code
            const code = jsQR(
                imageData.data,
                imageData.width,
                imageData.height,
                {
                    inversionAttempts: 'dontInvert',
                }
            );

            if (code) {
                console.log('✅ QR Code detectado:', code.data);
                setScanStatus('QR Code detectado! Processando...');

                try {
                    // Tentar parsear como JSON
                    const qrData = JSON.parse(code.data);
                    handleScanSuccess(qrData);
                } catch (err) {
                    // Se não for JSON, usar o texto direto
                    console.log('QR Code não é JSON, usando texto direto');
                    handleScanSuccess({ data: code.data, raw: code.data });
                }
            }
        } catch (err) {
            console.warn('Erro ao processar frame:', err);
        }
    };

    const handleScanSuccess = (data) => {
        setScanStatus('QR Code lido com sucesso!');
        stopCamera();
        // Pequeno delay para mostrar a mensagem de sucesso
        setTimeout(() => {
            onScanSuccess(data);
        }, 300);
    };

    const stopCamera = () => {
        // Parar o loop de animação
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Parar a câmera
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }

        // Limpar o vídeo
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setScanning(false);
        setIsVideoReady(false);
        setScanStatus('Câmera parada');
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');
        setScanStatus('Processando imagem...');

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                // Tentar diferentes configurações de detecção
                let code = jsQR(imageData.data, imageData.width, imageData.height);

                if (!code) {
                    // Tentar com inversão
                    code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'attemptBoth'
                    });
                }

                if (code) {
                    try {
                        const qrData = JSON.parse(code.data);
                        onScanSuccess(qrData);
                    } catch (err) {
                        // Se não for JSON, passa o texto direto
                        onScanSuccess({ data: code.data, raw: code.data });
                    }
                } else {
                    setError('Nenhum QR Code encontrado na imagem. Certifique-se de que a imagem está nítida e bem iluminada.');
                    setScanStatus('Falha na detecção');
                }
            };
            img.onerror = () => {
                setError('Erro ao carregar a imagem');
                setScanStatus('Erro no carregamento');
            };
            img.src = event.target.result;
        };
        reader.onerror = () => {
            setError('Erro ao ler o arquivo');
            setScanStatus('Erro na leitura');
        };
        reader.readAsDataURL(file);
    };

    const handleClose = () => {
        stopCamera();
        onClose();
    };

    return (
        <div className="qr-scanner-overlay" onClick={handleClose}>
            <div className="qr-scanner-modal" onClick={(e) => e.stopPropagation()}>
                <div className="scanner-header">
                    <h3>
                        <Scan size={24} style={{ marginRight: '10px' }} />
                        Escanear QR Code
                    </h3>
                    <button className="close-btn" onClick={handleClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="scanner-body">
                    {error && <div className="error-banner">{error}</div>}

                    <div className="scanner-area">
                        {/* Elemento de vídeo */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="video-preview"
                            style={{
                                display: scanning ? 'block' : 'none',
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: 'scaleX(-1)' // Espelhar para parecer mais natural
                            }}
                        />

                        {/* Overlay de ajuda */}
                        {scanning && (
                            <div className="scanner-overlay">
                                <div className="scan-frame">
                                    {/* Moldura para ajudar no enquadramento */}
                                    <div className="frame-corner top-left"></div>
                                    <div className="frame-corner top-right"></div>
                                    <div className="frame-corner bottom-left"></div>
                                    <div className="frame-corner bottom-right"></div>
                                </div>
                                <div className="scan-instructions">
                                    Posicione o QR Code dentro do quadro
                                </div>
                            </div>
                        )}

                        {/* Placeholder quando a câmera não está ativa */}
                        {!scanning && (
                            <div className="scanner-placeholder">
                                <Camera size={80} />
                                <p>Aponte a câmera para o QR Code</p>
                                <p className="placeholder-subtitle">ou carregue uma imagem</p>
                            </div>
                        )}

                        {/* Canvas oculto para processamento */}
                        <canvas
                            ref={canvasRef}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Status do scan */}
                    <div className="scan-status">
                        {scanStatus}
                    </div>

                    {/* Ações */}
                    <div className="scanner-actions">
                        {!scanning ? (
                            <>
                                <button
                                    className="btn-primary scan-btn"
                                    onClick={startCamera}
                                    disabled={scanning}
                                >
                                    <Camera size={20} />
                                    Iniciar Câmera
                                </button>
                                <label className="btn-secondary upload-btn">
                                    <Upload size={20} />
                                    Carregar Imagem
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </>
                        ) : (
                            <button
                                className="btn-danger scan-btn"
                                onClick={stopCamera}
                            >
                                Parar Câmera
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .qr-scanner-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 1rem;
                }
                .qr-scanner-modal {
                    background: var(--bg-primary, #1a1a1a);
                    border-radius: 1.5rem;
                    max-width: 600px;
                    width: 100%;
                    border: 1px solid var(--border-color, #333);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    overflow: hidden;
                }
                .scanner-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color, #333);
                    background: var(--bg-secondary, #2a2a2a);
                }
                .scanner-header h3 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: var(--text-primary, #fff);
                    display: flex;
                    align-items: center;
                }
                .close-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: var(--text-secondary, #aaa);
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: var(--text-primary, #fff);
                }
                .scanner-body {
                    padding: 2rem;
                }
                .error-banner {
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #f87171;
                    padding: 1rem;
                    border-radius: 0.75rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                    font-size: 0.95rem;
                }
                .scanner-area {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 1;
                    background: #000;
                    border-radius: 1rem;
                    overflow: hidden;
                    margin-bottom: 1.5rem;
                    border: 2px solid var(--border-color, #333);
                }
                .video-preview {
                    width: 100%;
                    height: 100%;
                    background: #000;
                }
                .scanner-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                }
                .scan-frame {
                    position: absolute;
                    top: 20%;
                    left: 20%;
                    right: 20%;
                    bottom: 20%;
                    border: 2px solid rgba(59, 130, 246, 0.5);
                    border-radius: 1rem;
                }
                .frame-corner {
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    border-color: #3b82f6;
                    border-width: 4px;
                }
                .frame-corner.top-left {
                    top: -2px;
                    left: -2px;
                    border-top-style: solid;
                    border-left-style: solid;
                    border-right: none;
                    border-bottom: none;
                }
                .frame-corner.top-right {
                    top: -2px;
                    right: -2px;
                    border-top-style: solid;
                    border-right-style: solid;
                    border-left: none;
                    border-bottom: none;
                }
                .frame-corner.bottom-left {
                    bottom: -2px;
                    left: -2px;
                    border-bottom-style: solid;
                    border-left-style: solid;
                    border-right: none;
                    border-top: none;
                }
                .frame-corner.bottom-right {
                    bottom: -2px;
                    right: -2px;
                    border-bottom-style: solid;
                    border-right-style: solid;
                    border-left: none;
                    border-top: none;
                }
                .scan-instructions {
                    position: absolute;
                    bottom: 40px;
                    left: 0;
                    right: 0;
                    text-align: center;
                    color: white;
                    font-size: 0.9rem;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 8px;
                    margin: 0 20px;
                    border-radius: 8px;
                }
                .scanner-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary, #aaa);
                    background: var(--bg-secondary, #2a2a2a);
                }
                .scanner-placeholder svg {
                    margin-bottom: 1.5rem;
                    opacity: 0.7;
                }
                .scanner-placeholder p {
                    margin: 0.25rem 0;
                    font-size: 1.1rem;
                }
                .placeholder-subtitle {
                    font-size: 0.9rem !important;
                    opacity: 0.7;
                }
                .scan-status {
                    text-align: center;
                    padding: 1rem;
                    background: var(--bg-secondary, #2a2a2a);
                    border-radius: 0.75rem;
                    margin-bottom: 1.5rem;
                    color: var(--text-primary, #fff);
                    font-weight: 500;
                    border: 1px solid var(--border-color, #333);
                }
                .scanner-actions {
                    display: flex;
                    gap: 1rem;
                }
                .scan-btn, .upload-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: none;
                    font-size: 1rem;
                }
                .scan-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                .btn-primary:hover:not(:disabled) {
                    background: linear-gradient(135deg, #2563eb, #1e40af);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
                }
                .btn-secondary {
                    background: transparent;
                    border: 2px solid var(--border-color, #444);
                    color: var(--text-primary, #fff);
                }
                .btn-secondary:hover {
                    background: var(--bg-secondary, #2a2a2a);
                    border-color: var(--accent-primary, #3b82f6);
                }
                .btn-danger {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }
                .btn-danger:hover {
                    background: linear-gradient(135deg, #dc2626, #b91c1c);
                    transform: translateY(-2px);
                }
                @media (max-width: 768px) {
                    .scanner-body {
                        padding: 1.5rem;
                    }
                    .scanner-actions {
                        flex-direction: column;
                    }
                    .scanner-header {
                        padding: 1.25rem;
                    }
                }
                @media (max-width: 480px) {
                    .scanner-body {
                        padding: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default QRCodeScanner;