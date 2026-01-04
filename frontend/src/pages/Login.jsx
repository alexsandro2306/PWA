import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, QrCode } from "lucide-react";
import QRCodeScanner from "../components/QRCodeScanner";
import api from "../services/api";

const Login = () => {
	const [formData, setFormData] = useState({ username: "", password: "" });
	const [error, setError] = useState("");
	const [showQRScanner, setShowQRScanner] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();

	const searchParams = new URLSearchParams(window.location.search);
	const redirect = searchParams.get("redirect");
	const fromTrainers = redirect === "/trainers";

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		try {
			await login(formData);
			navigate(redirect || "/");
		} catch (err) {
			setError(err.response?.data?.message || "Erro ao fazer login");
		}
	};

	const handleQRLogin = async (qrData) => {
		setError("");
		console.log("📤 Dados do QR Code:", qrData);

		try {
			// ✅ Envia userId e secret (não token/user!)
			const res = await api.post("/auth/login-qr", {
				userId: qrData.userId,
				secret: qrData.secret,
			});

			console.log("✅ Resposta do backend:", res.data);

			// ✅ AGORA sim, usa o token/user da resposta
			await login({ token: res.data.token, user: res.data.user });
			navigate(redirect || "/");
		} catch (err) {
			console.error("❌ Erro login QR:", err.response?.data);
			setError(err.response?.data?.message || "QR Code inválido ou expirado");
		} finally {
			setShowQRScanner(false);
		}
	};

	return (
		<div className="login-container animate-fade">
			<div className="glass login-card">
				<h1>Fitness+</h1>
				<p className="subtitle">Bem-vindo de volta!</p>

				{fromTrainers && (
					<div className="info-banner">
						<span>💪</span>
						<p>Faça login para enviar o seu pedido ao Personal Trainer</p>
					</div>
				)}

				{error && <div className="error-message">{error}</div>}

				<form onSubmit={handleSubmit}>
					<div className="input-group">
						<label>Username</label>
						<input
							type="text"
							value={formData.username}
							onChange={(e) =>
								setFormData({ ...formData, username: e.target.value })
							}
							required
						/>
					</div>
					<div className="input-group">
						<label>Senha</label>
						<input
							type="password"
							value={formData.password}
							onChange={(e) =>
								setFormData({ ...formData, password: e.target.value })
							}
							required
						/>
					</div>

					{/* ✅ Link para Reset Password */}
					<div className="forgot-link">
						<Link to="/reset-password" className="link-button">
							Esqueci-me da password
						</Link>
					</div>

					{/* ⚠️ REMOVI O BOTÃO DUPLICADO AQUI - Mantive apenas um */}
					<button type="submit" className="btn-primary full-width">
						<LogIn size={20} /> Entrar
					</button>

					{/* ✅ Botão de Login com QR Code */}
					<button
						type="button"
						className="btn-qr full-width"
						onClick={() => setShowQRScanner(true)}
					>
						<QrCode size={20} /> Login com QR Code
					</button>
				</form>

				<p className="footer-text">
					Não tem uma conta?{" "}
					<Link to={`/register${redirect ? `?redirect=${redirect}` : ""}`}>
						Registe-se agora
					</Link>
				</p>

				{showQRScanner && (
					<QRCodeScanner
						onScanSuccess={handleQRLogin}
						onClose={() => setShowQRScanner(false)}
					/>
				)}
			</div>

			<style>{`
                .login-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 2rem;
                }
                .login-card {
                    width: 100%;
                    max-width: 400px;
                    padding: 2.5rem;
                    text-align: center;
                }
                h1 { margin-bottom: 0.5rem; }
                .subtitle { color: var(--text-secondary); margin-bottom: 2rem; }
                
                .info-banner {
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    padding: 1rem;
                    border-radius: 0.75rem;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    text-align: left;
                }
                
                .info-banner span {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }
                
                .info-banner p {
                    margin: 0;
                    font-size: 0.9rem;
                    line-height: 1.4;
                    color: var(--text-primary);
                }
                
                .input-group { text-align: left; margin-bottom: 1.5rem; }
                .input-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
                .input-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    border: 1px solid var(--border-color);
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }

                /* ✅ Forgot Password Link */
                .forgot-link {
                    text-align: right;
                    margin-top: -0.75rem;
                    margin-bottom: 1rem;
                }

                .link-button {
                    color: var(--accent-primary);
                    font-size: 0.85rem;
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .link-button:hover {
                    color: var(--accent-secondary);
                    text-decoration: underline;
                }
                
                .full-width { 
                    width: 100%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    gap: 0.5rem; 
                    margin-top: 1rem; 
                }
                .error-message { 
                    color: #ef4444; 
                    background: #fee2e2; 
                    padding: 0.75rem; 
                    border-radius: 0.5rem; 
                    margin-bottom: 1.5rem; 
                    font-size: 0.9rem; 
                }
                .footer-text { 
                    margin-top: 2rem; 
                    font-size: 0.9rem; 
                    color: var(--text-secondary); 
                }
                .footer-text a { 
                    color: var(--accent-primary); 
                    text-decoration: none; 
                    font-weight: 600; 
                }

                /* REMOVI CSS DUPLICADO AQUI - Tinha duas classes .full-width idênticas */
                
                /* ✅ Botão QR Code */
                .btn-qr {
                    background: transparent;
                    border: 2px solid var(--accent-primary);
                    color: var(--accent-primary);
                    transition: all 0.3s;
                }
                .btn-qr:hover {
                    background: var(--accent-primary);
                    color: white;
                }

                /* Botão principal */
                .btn-primary {
                    background: var(--accent-primary);
                    color: white;
                    border: none;
                    padding: 0.875rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .btn-primary:hover {
                    background: var(--accent-hover);
                }
            `}</style>
		</div>
	);
};

export default Login;
