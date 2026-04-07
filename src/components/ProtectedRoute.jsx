import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
    }

    // Si no hay usuario, redirigir a la página de login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // El sistema es exclusivo para administradores, lo verificamos en el AuthContext o Backend, 
    // pero podemos hacer un chequeo adicional aquí por seguridad:
    if (user.role && user.role.toLowerCase() !== 'administrador') {
        return <div>Acceso Denegado. Se requieren permisos de administrador.</div>;
    }

    // Si está autenticado y es admin, renderiza la ruta correspondiente
    return children;
};

export default ProtectedRoute;
