import { useState, useEffect } from 'react'; // Importar las funciones useState y useEffect
import axios from 'axios'; // Importar axios para realizar peticiones HTTP
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom'; // Importar React Router
import './App.css'; // Importar el archivo de estilos
import NodeForm from './components/NodeFrom'; // Importar el componente NodeForm
import NodeTable from './components/NodeTable'; // Importar el componente NodeTable
import TablaRegistros from './pages/tablaRegistros'; // Importar la página con la tabla de registros
import NodosSustitucion from './pages/NodosSustitucion'; // Importar la página con la tabla de los nodos candidatos a sustitución
import PantallaInicio from './pages/inicio';

function App() {
    const [nodos, setNodos] = useState([]); // Estado para almacenar los nodos
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Función para obtener los nodos desde el backend
    const fetchNodos = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/nodos'); // Hacer una petición GET a la API
            setNodos(response.data.nodos); // Almacenar los nodos en el estado
        } catch (error) {
            console.error('Error al obtener los nodos:', error);
        }
    };

    // Cargar los nodos al iniciar la aplicación
    useEffect(() => {
        fetchNodos(); // Llamar a la función para obtener los nodos
    }, []);

    // Función para agregar un nuevo nodo
    const handleAddNodo = async () => {
        try {
            await fetchNodos(); // Actualizar la lista de nodos después de agregar uno nuevo
        } catch (error) {
            console.error('Error al agregar el nodo:', error);
        }
    };

    const Navigation = () => {
        const location = useLocation();

        return (
            <header className="imss-header">
                <div className="header-container">
                    <div className="header-logo">
                        <img src="/IMSS_Logosímbolo.png" alt="Logo IMSS" />
                        <span>Sistema de Gestión de Nodos</span>
                    </div>

                    <div
                        className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}>
                        <ul className="nav-links">
                            <li className={location.pathname === '/' ? 'active' : ''}>
                                <NavLink to="/" exact>
                                    <i className="fas fa-home"></i> Inicio
                                </NavLink>
                            </li>
                            <li className={location.pathname.includes('/catalogo-nodos') ? 'active' : ''}>
                                <NavLink to="/catalogo-nodos">
                                    <i className="fas fa-list"></i> Catálogo
                                </NavLink>
                            </li>
                            <li className={location.pathname.includes('/gestion-nodos') ? 'active' : ''}>
                                <NavLink to="/gestion-nodos">
                                    <i className="fas fa-cog"></i> Gestión
                                </NavLink>
                            </li>
                            <li className={location.pathname.includes('/catalogo-prioritarios') ? 'active' : ''}>
                                <NavLink to="/catalogo-prioritarios">
                                    <i className="fas fa-exclamation-triangle"></i> Prioritarios
                                </NavLink>
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>
        );
    };

    return (
        <Router>
            <div className="App">
                <Navigation />

                <main className="app-content">
                    <Routes>
                        <Route
                            path="/gestion-nodos"
                            element={
                                <div className="page-container">
                                    <h1 className="page-title">Gestión y Registro de Nodos</h1>
                                    <div className="content-container">
                                        <div className="form-container">
                                            <NodeForm onAddNodo={handleAddNodo} />
                                        </div>
                                        <div className="table-container">
                                            <NodeTable nodos={nodos} fetchNodos={fetchNodos} />
                                        </div>
                                    </div>
                                </div>
                            }
                        />
                        <Route
                            path="/catalogo-prioritarios"
                            element={
                                <div className="page-container">
                                    <h1 className="page-title">Nodos Prioritarios</h1>
                                    <div className="table-container">
                                        <NodosSustitucion />
                                    </div>
                                </div>
                            }
                        />
                        <Route
                            path="/catalogo-nodos"
                            element={
                                <div className="page-container">
                                    <h1 className="page-title">Catálogo de Nodos</h1>
                                    <div className="table-container">
                                        <TablaRegistros />
                                    </div>
                                </div>
                            }
                        />
                        <Route
                            path="/"
                            element={
                                <div className="page-container">
                                    <PantallaInicio />
                                </div>
                            }
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App; // Exportar el componente App