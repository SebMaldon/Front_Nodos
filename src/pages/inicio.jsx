import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Inicio.css';

const Inicio = () => {
    const navigate = useNavigate();

    return (
        <div className="imss-container">
            {/* Hero Banner */}
            <header className="imss-hero">
                <div className="hero-overlay">
                    <div className="hero-content">
                        <img src="/IMSS_Logosímbolo.png" alt="Logo IMSS" className="logo-imss" />
                        <h1>Sistema de Gestión de Nodos</h1>
                        <p>Plataforma integral para el monitoreo y administración de la infraestructura tecnológica del IMSS</p>
                    </div>
                </div>
            </header>

            {/* Servicios destacados */}
            <section className="services-section">
                <h2 className="section-title">Nuestros Servicios</h2>
                <div className="services-grid">
                    <div
                        className="service-card"
                        onClick={() => navigate('/catalogo-nodos')}
                        title="Ver catálogo completo de nodos"
                    >
                        <div className="card-icon">📋</div>
                        <h3>Explorar Catálogo de Nodos</h3>
                        <p>Visualice el inventario completo de nodos activos con toda su información técnica y estado actual</p>
                        <div className="card-link">Ver todos los nodos →</div>
                    </div>

                    <div
                        className="service-card"
                        onClick={() => navigate('/gestion-nodos')}
                        title="Administrar nodos del sistema"
                    >
                        <div className="card-icon">⚙️</div>
                        <h3>Gestionar Nodos</h3>
                        <p>Registre nuevos nodos, actualice información existente o elimine registros obsoletos del sistema</p>
                        <div className="card-link">Acceder al panel →</div>
                    </div>

                    <div
                        className="service-card"
                        onClick={() => navigate('/catalogo-prioritarios')}
                        title="Nodos que requieren atención"
                    >
                        <div className="card-icon">⚠️</div>
                        <h3>Nodos Prioritarios</h3>
                        <p>Identifique los nodos que requieren mantenimiento, actualización o reemplazo inmediato</p>
                        <div className="card-link">Ver prioridades →</div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="imss-footer">
                <div className="footer-content">
                    <img src="/IMSS_Logosímbolo.png" alt="Logo IMSS" className="footer-logo" />
                    <p>© {new Date().getFullYear()} Instituto Mexicano del Seguro Social. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default Inicio;