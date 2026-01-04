import React from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import "./Navbar.css";

const Navbar = () => {
	const navigate = useNavigate();

	return (
		<nav className="navbar">
			<div className="nav-container">
				<div className="logo" onClick={() => navigate("/welcome")}>
					<Dumbbell size={28} />
					<span>Fitness+</span>
				</div>
				<div className="nav-links">
					<button
						className="nav-link"
						onClick={() => navigate("/trainers-public")}
					>
						Personal Trainers
					</button>
					<button className="nav-link" onClick={() => navigate("/login")}>
						Entrar
					</button>
					<button
						className="btn-register-nav"
						onClick={() => navigate("/register")}
					>
						Registar
					</button>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
