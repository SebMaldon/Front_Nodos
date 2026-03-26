import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TablePagination } from '@mui/material';

const UnidadesModal = ({ open, onClose, onUnidadesChange }) => {
    const [unidades, setUnidades] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Pagination State
    const [page, setPage] = useState(0); // MUI is 0-indexed
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [currentOldData, setCurrentOldData] = useState(null);
    const [formData, setFormData] = useState({
        ref: '',
        nombre: '',
        ip: '',
        tipo_unidad: 'Médica',
        vlan: ''
    });

    const [selectedUnidad, setSelectedUnidad] = useState(null);

    // Fetch Unidades Detail
    const fetchUnidadesDetalle = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/nodos/unidades/detalle', {
                params: {
                    page: page + 1, // backend is 1-indexed
                    limit: limit
                }
            });
            // Update to use the new object structure from the paginated endpoint
            setUnidades(response.data.unidades || []);
            setTotal(response.data.total || 0);
            setSelectedUnidad(null); // Reset selection
        } catch (error) {
            console.error('Error al obtener el detalle de las unidades:', error);
            alert('Hubo un error al intentar obtener las unidades.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchUnidadesDetalle();
            resetForm();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, page, limit]); // Re-fetch when modal opens or pagination changes

    const resetForm = () => {
        setFormData({
            ref: '',
            nombre: '',
            ip: '',
            tipo_unidad: 'Médica',
            vlan: ''
        });
        setIsEditing(false);
        setCurrentOldData(null);
        setSelectedUnidad(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSelectRow = (unidad) => {
        // Toggle selection
        if (selectedUnidad && selectedUnidad.ref === unidad.ref && selectedUnidad.ip === unidad.ip && selectedUnidad.vlan === unidad.vlan) {
            setSelectedUnidad(null);
            resetForm();
        } else {
            setSelectedUnidad(unidad);
        }
    };

    const onClickEditar = () => {
        if (!selectedUnidad) return;
        setIsEditing(true);
        setCurrentOldData({
            ref: selectedUnidad.ref,
            ip: selectedUnidad.ip,
            vlan: selectedUnidad.vlan
        });
        setFormData({
            ref: selectedUnidad.ref || '',
            nombre: selectedUnidad.nombre || '',
            ip: selectedUnidad.ip || '',
            tipo_unidad: selectedUnidad.tipo_unidad || 'Médica',
            vlan: selectedUnidad.vlan || ''
        });
    };

    const onClickEliminar = async () => {
        if (!selectedUnidad) return;
        if (!window.confirm(`¿Estás seguro que deseas eliminar el segmento ${selectedUnidad.ref} (${selectedUnidad.ip} - VLAN: ${selectedUnidad.vlan})?`)) return;

        try {
            await axios.delete(`http://localhost:5000/api/nodos/unidades`, {
                params: {
                    ref: selectedUnidad.ref,
                    ip: selectedUnidad.ip,
                    vlan: selectedUnidad.vlan
                }
            });
            alert('Unidad eliminada correctamente.');
            fetchUnidadesDetalle();
            if (onUnidadesChange) onUnidadesChange();
            resetForm();
        } catch (error) {
            console.error('Error al eliminar la unidad:', error);
            alert('Error al intentar eliminar la unidad.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validations
        if (!formData.ref || !formData.nombre || !formData.ip || !formData.vlan) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        try {
            if (isEditing) {
                // PUT Request
                await axios.put('http://localhost:5000/api/nodos/unidades', {
                    oldData: currentOldData,
                    newData: {
                        ...formData,
                        vlan: parseInt(formData.vlan, 10)
                    }
                });
                alert('Unidad actualizada correctamente.');
            } else {
                // POST Request
                await axios.post('http://localhost:5000/api/nodos/unidades', {
                    ref: formData.ref,
                    nombre: formData.nombre,
                    ip: formData.ip,
                    tipo_unidad: formData.tipo_unidad,
                    vlan: parseInt(formData.vlan, 10)
                });
                alert('Unidad registrada correctamente.');
            }

            resetForm();
            fetchUnidadesDetalle();
            if (onUnidadesChange) onUnidadesChange();
        } catch (error) {
            console.error('Error al guardar la unidad:', error);
            alert(error.response?.data?.message || 'Error al intentar guardar la unidad. Verifica los datos e intenta nuevamente.');
        }
    };

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ padding: '10px', overflowY: 'auto' }}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '20px', margin: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ margin: 0 }}>Administrar Unidades</h3>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Formulario alineado a la izquierda */}
                    <div style={{ flex: '1 1 300px', minWidth: 0, maxWidth: '100%', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', boxSizing: 'border-box' }}>
                        <h4 style={{ marginBottom: '15px' }}>{isEditing ? 'Editar Registro' : 'Nuevo Registro'}</h4>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ fontWeight: 'bold' }}>Referencia (ref):</label>
                                <input style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} type="text" name="ref" value={formData.ref} onChange={handleChange} required />
                            </div>
                            <div>
                                <label style={{ fontWeight: 'bold' }}>Nombre:</label>
                                <input style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                            </div>
                            <div>
                                <label style={{ fontWeight: 'bold' }}>IP:</label>
                                <input style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} type="text" name="ip" value={formData.ip} onChange={handleChange} required />
                            </div>
                            <div>
                                <label style={{ fontWeight: 'bold' }}>VLAN:</label>
                                <input style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} type="number" name="vlan" value={formData.vlan} onChange={handleChange} required />
                            </div>
                            <div>
                                <label style={{ fontWeight: 'bold' }}>Tipo Unidad:</label>
                                <select style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} name="tipo_unidad" value={formData.tipo_unidad} onChange={handleChange} required>
                                    <option value="Médica">Médica</option>
                                    <option value="Administrativa">Administrativa</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '5px', border: 'none', cursor: 'pointer', backgroundColor: 'var(--imss-green)', color: 'white' }}>
                                    <i className="fas fa-save"></i> {isEditing ? 'Guardar' : 'Agregar'}
                                </button>
                                {isEditing && (
                                    <button type="button" onClick={resetForm} style={{ flex: 1, padding: '10px', borderRadius: '5px', border: 'none', cursor: 'pointer', backgroundColor: 'gray', color: 'white' }}>
                                        <i className="fas fa-times"></i> Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Tabla y botones alineados a la derecha */}
                    <div style={{ flex: '2 1 300px', minWidth: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Action buttons (won't scroll horizontally with the table) */}
                        <div style={{ display: 'flex', gap: '10px', height: '40px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                                onClick={onClickEditar}
                                disabled={!selectedUnidad}
                                style={{
                                    flex: 1,
                                    maxWidth: '180px',
                                    maxHeight: '40px',
                                    padding: '5px 15px', borderRadius: '5px', border: 'none',
                                    cursor: selectedUnidad ? 'pointer' : 'not-allowed',
                                    opacity: selectedUnidad ? 1 : 0.5,
                                    backgroundColor: 'var(--imss-blue)', color: 'white'
                                }}
                            >
                                <i className="fas fa-edit"></i> Editar
                            </button>
                            <button
                                onClick={onClickEliminar}
                                disabled={!selectedUnidad}
                                className="delete-button"
                                style={{
                                    flex: 1,
                                    maxWidth: '180px',
                                    maxHeight: '40px',
                                    padding: '5px 15px', borderRadius: '5px', border: 'none',
                                    cursor: selectedUnidad ? 'pointer' : 'not-allowed',
                                    opacity: selectedUnidad ? 1 : 0.5,
                                    color: 'white'
                                }}
                            >
                                <i className="fas fa-trash"></i> Eliminar
                            </button>
                        </div>

                        {/* Table wrapper that isolates horizontal scrolling */}
                        <div style={{ overflowX: 'auto', width: '100%' }}>
                            <table className="content-table-modal" style={{ width: '100%', margin: 0, textAlign: 'center' }}>
                                <thead>
                                    <tr>
                                        <th>Ref</th>
                                        <th>Nombre</th>
                                        <th>IP</th>
                                        <th>Tipo</th>
                                        <th>VLAN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '20px' }}>Cargando unidades...</td>
                                        </tr>
                                    ) : unidades.map((unidad, idx) => {
                                        const isSelected = selectedUnidad && selectedUnidad.ref === unidad.ref && selectedUnidad.ip === unidad.ip && selectedUnidad.vlan === unidad.vlan;
                                        return (
                                            <tr
                                                key={`${unidad.ref}-${unidad.ip}-${unidad.vlan}-${idx}`}
                                                onClick={() => handleSelectRow(unidad)}
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelected ? '#aaddba' : undefined
                                                }}
                                            >
                                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd', whiteSpace: 'nowrap' }}>{unidad.ref}</td>
                                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{unidad.nombre}</td>
                                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{unidad.ip}</td>
                                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{unidad.tipo_unidad}</td>
                                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{unidad.vlan}</td>
                                            </tr>
                                        );
                                    })}
                                    {!isLoading && unidades.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '20px' }}>No se encontraron registros.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination control below the table array */}
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={(event, newPage) => setPage(newPage)}
                            rowsPerPage={limit}
                            onRowsPerPageChange={(event) => {
                                setLimit(parseInt(event.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[5, 10, 25]}
                            labelRowsPerPage="Filas por página"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                            style={{ margin: 0, padding: 0 }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <button type="button" onClick={onClose} style={{ padding: '10px 30px', borderRadius: '5px', border: 'none', cursor: 'pointer', backgroundColor: 'var(--imss-dark)', color: 'white' }}>
                        Cerrar Menú
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnidadesModal;
