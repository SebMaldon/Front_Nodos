import React, { useState, useEffect } from 'react';
import { Button, Tooltip, TablePagination } from '@mui/material';
import axios from 'axios';

const NodosSustitucion = () => {
    const [selectedNodo, setSelectedNodo] = useState(null); // Estado para almacenar el nodo seleccionado (detalles)
    const [selectedImage, setSelectedImage] = useState(null); // Estado para almacenar la imagen seleccionada
    const [selectedSinAtencionNodo, setSelectedAtencionNodo] = useState(null); // Estado para almacenar información del nodo y sus registros de mantenimiento
    const [selectedSinOtherAtencionNodo, setSelectedOtherAtencionNodo] = useState(null); // Estado para almacenar información del nodo y sus registros de otras atenciones
    const [unidades, setUnidades] = useState([]); // Estado para almacenar las unidades
    const [totalRegistros, setTotalRegistros] = useState(0); // Estado para el total de registros
    const [totalFaltantes, setTotalFaltantes] = useState(0); // Estado para el total de nodos faltantes
    const [totalAtencion, setTotalAtencion] = useState(0); // Estado para el total de nodos faltantes
    const [totalOtroAtendido, setTotalOtroAtendido] = useState(0); // Estado para el total de nodos atendidos de otras atenciones
    const [totalAtendidos, setTotalAtendidos] = useState(0); // Estado para el total de nodos atendidos en mantenimiento
    const [totalOtraAtencion, setTotalOtraAtencion] = useState(0); // Estado para el total de nodos faltantes
    const [filteredNodos, setFilteredNodos] = useState([]); // Estado para almacenar la nueva consulta
    const [filtros, setFiltros] = useState({ // Estado para los filtros
        atencion: '',
        unidad: '',
        otraatencion: '',
        categoria: '',
        anioInstalacion: '',
        longitudRango: '',
        conNodosFaltantes: '',
        ipSwitch: '',
        estadoCable: '',
        conObservaciones: '',
        atendido: '',
    });

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Resetear paginación cuando el filtro cambie
    useEffect(() => {
        setPage(0);
    }, [filtros]);

    // Cargar los registros al cambiar filtros o paginación
    useEffect(() => {
        fetchNodos();
    }, [filtros, page, rowsPerPage]);

    // Función para abrir el modal con los detalles del nodo
    const handleDetailsClick = async (nodoData) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/nodos/${nodoData.Id}`); // Llama a la API para obtener los detalles completos del nodo
            setSelectedNodo(response.data); // Guarda los detalles completos en el estado
        } catch (error) {
            console.error('Error al obtener los detalles del nodo:', error);
            alert('Error al obtener los detalles del nodo');
        }
    };

    // Función para mostrar la imagen en grande
    const handleImageClick = (imageUrl) => {
        setSelectedImage('http://localhost:5000' + imageUrl); // Guarda la imagen seleccionada en el estado
    };

    // Función para obtener los registros desde el backend
    const fetchNodos = async () => {
        try {
            const params = { ...filtros }; // Copiar los filtros actuales

            // Modificar los filtros según el valor de "tipoAtencion"
            switch (filtros.tipoAtencion) {
                case 'mantenimiento':
                    params.atencion = 1; // Requiere mantenimiento
                    params.otraatencion = ''; // Ignorar otro tipo de atención
                    break;
                case 'otraAtencion':
                    params.atencion = ''; // Ignorar mantenimiento
                    params.otraatencion = 1; // Requiere otro tipo de atención
                    break;
                case 'ambos':
                    params.atencion = 1; // Requiere mantenimiento
                    params.otraatencion = 1; // Requiere otro tipo de atención
                    break;
                case 'ninguno':
                    params.atencion = 0; // No requiere mantenimiento
                    params.otraatencion = 0; // No requiere otro tipo de atención
                    params.atendido = 0;
                    break;
                case 'uno':
                    params.atendido = 1;
                    break;
                case 'cero':
                    params.atendido = 0;
                    break;
                default:
                    params.atencion = ''; // Sin filtro de atención
                    params.otraatencion = ''; // Sin filtro de otro tipo de atención
                    break;
            }

            // Eliminar el campo "tipoAtencion" para no enviarlo a la API
            delete params.tipoAtencion;

            // Hacer la solicitud a la API con los filtros modificados
            const response = await axios.get('http://localhost:5000/api/nodos/candidatos', {
                params: { ...params, page: page + 1, limit: rowsPerPage },
            });

            setFilteredNodos(response.data.nodos); // Almacenar los datos filtrados en el estado
            setTotalRegistros(response.data.total); // Almacenar el total de registros en el estado
            setTotalFaltantes(response.data.faltantes); // Almacenar el total de nodos faltantes en el estado
            setTotalAtencion(response.data.totalAtencion); // Almacenar el total de nodos que requieren mantenimiento en el estado
            setTotalOtraAtencion(response.data.totalOtraAtencion); // Almacenar el total de nodos que requieren otro tipo de atención en el estado
            setTotalAtendidos(response.data.totalAtendido); // Almacenar el total de nodos que han recibido atención de mantenimiento en el estado
            setTotalOtroAtendido(response.data.totalOtroAtendido); // Almacenar el total de nodos que han recibido atención de otro tipo en el estado
        } catch (error) {
            console.error('Error al obtener los registros:', error);
        }
    };

    // Obtener las unidades al cargar el componente
    useEffect(() => {
        const fetchUnidades = async () => { // Función para obtener las unidades
            try {
                const response = await axios.get('http://localhost:5000/api/nodos/unidades'); // Hacer una petición GET a la API
                setUnidades(response.data); // Almacenar las unidades en el estado
            } catch (error) {
                console.error('Error al obtener las unidades:', error);
            }
        };

        fetchUnidades(); // Llamar a la función para obtener las unidades
    }, []);

    const handleFiltroChange = (e) => {
        const { name, value } = e.target; // Extrae el nombre y el valor del campo
        setFiltros({ ...filtros, [name]: value }); // Actualiza el estado de los filtros
    };

    // Función para abrir el modal de información del mantenimiento
    const handleAtencionClick = async (nodoData) => {
        try {
            // Obtener las imágenes solventadas desde el backend
            const response = await axios.get(`http://localhost:5000/api/nodos/${nodoData.Id}`);
            const Datos = response.data;

            // Actualizar el nodo con las imágenes solventadas
            setSelectedAtencionNodo(Datos);
        } catch (error) {
            console.error('Error al obtener los datos del nodo:', error);
        }
    };

    // Función para abrir el modal de información otras atenciones
    const handleOtherAtencionClick = async (nodoData) => {
        try {
            // Obtener las imágenes solventadas desde el backend
            const response = await axios.get(`http://localhost:5000/api/nodos/${nodoData.Id}`);
            const Datos = response.data;

            // Actualizar el nodo con las imágenes solventadas
            setSelectedOtherAtencionNodo(Datos);
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    };

    // Función para cerrar los modales
    const handleCloseModal = () => {
        setSelectedNodo(null); // Limpia el estado
        setSelectedImage(null); // Limpia el estado
        setSelectedAtencionNodo(null); // Limpia el estado
        setSelectedOtherAtencionNodo(null); // Limpia el estado
    };

    // Función para verificar si un campo (array) está vacío
    const EstaVacio = (dato) => {
        if (dato.length == 0) {
            return true;
        } else {
            return false;
        }
    };

    return (
        <div>
            {/* Filtros */}
            <div className="filtros">
                <label>
                    Filtros:
                    <select
                        style={{ marginLeft: '5px' }}
                        name="tipoAtencion"
                        value={filtros.tipoAtencion} // Valor del filtro
                        onChange={handleFiltroChange} // Maneja los cambios en los filtros
                    >
                        <option value="">Todos</option> {/* Valor por defecto */}
                        <option value="uno">Recibieron atención</option>
                        <option value="mantenimiento">Requieren mantenimiento</option>
                        <option value="otraAtencion">Requieren otro tipo de atención</option>
                        <option value="ambos">Con mantenimiento y otro tipo de atención</option>
                        <option value="ninguno">Sin mantenimiento y otro tipo de atención</option>
                    </select>
                </label>
                <label style={{ marginLeft: '10px' }}>
                    Unidad:
                    <select
                        style={{ marginLeft: '5px' }}
                        name="unidad"
                        value={filtros.unidad} // Valor del filtro
                        onChange={handleFiltroChange} // Maneja los cambios en los filtros
                    >
                        <option value="">Todas</option> {/* Valor por defecto */}
                        {unidades.map((unidad) => (
                            <option key={unidad.ref} value={unidad.ref}> {/* Mapea las unidades y las muestra */}
                                {unidad.nombre} {/* Muestra el nombre de la unidad */}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div style={{ marginTop: '10px', fontWeight: 'bold', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                <label>Total de registros: {totalRegistros}</label>
                <label> Requieren mantenimiento: {totalAtencion || ' 0'} </label>
                <label> Requieren otro tipo de atención: {totalOtraAtencion || ' 0'} </label>
                <label> Nodos atendidos en mantenimiento: {totalAtendidos || ' 0'} </label>
                <label> Nodos atendidos de otro tipo de atención: {totalOtroAtendido || ' 0'} </label>
                <label> Total faltantes: {totalFaltantes || ' 0'} </label>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Ubicación</th>
                            <th>Unidad</th>
                            <th>Categoría del cable</th>
                            <th>Año de instalación</th>
                            <th>Estado del cable</th>
                            <th>Puerto</th>
                            <th>Área</th>
                            <th>Longitud</th>
                            <th>IP del Switch</th>
                            <th>Observaciones</th>
                            <th>Faltantes</th>
                            <th>M</th>
                            <th>OA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredNodos.map((nodoData, index) => (
                            <tr key={index}> {/* Clave única para cada fila */}
                                <td
                                    onClick={() => handleDetailsClick(nodoData)} // Abre el modal con los detalles del nodo
                                    style={{ cursor: 'pointer' }}
                                >{nodoData.Ubicacion}</td> {/* Muestra la ubicación del nodo */}
                                <td>{nodoData.Unidad}</td> {/* Muestra la unidad del nodo */}
                                <td>{nodoData.CategoriaCable}</td> {/* Muestra la categoría del cable */}
                                <td>{nodoData.AnioInstalacion}</td> {/* Muestra el año de instalación */}
                                <td>{nodoData.EstadoCable}</td> {/* Muestra el estado del cable */}
                                <td>{nodoData.Puerto}</td> {/* Muestra el puerto */}
                                <td>{nodoData.Area}</td> {/* Muestra el área */}
                                <td>{nodoData.Longitud}</td> {/* Muestra la longitud del cable */}
                                <td>{nodoData.IpSwitch}</td> {/* Muestra la IP del switch */}
                                <td>{nodoData.Observaciones}</td> {/* Muestra las observaciones */}
                                <td style={{ textAlign: 'center' }} >{nodoData.Nodos_faltantes ? nodoData.Nodos_faltantes : '0'}</td> {/* Muestra los nodos faltantes */}
                                {/* Muestra el estado de atención del nodo con imagenes*/}
                                <td onClick={() => handleAtencionClick(nodoData)}
                                    style={{ cursor: 'pointer', textAlign: 'center' }}>
                                    {nodoData.Atendido ? '✅' : ''}{nodoData.Atencion ? '⚠️' : ''} {/* Muestra un icono si requiere atención */}
                                </td>
                                {/* Muestra el estado de atención del nodo con imagenes*/}
                                <td onClick={() => handleOtherAtencionClick(nodoData)}
                                    style={{ cursor: 'pointer', textAlign: 'center' }}>
                                    {nodoData.OtroAtendido ? '🟢' : ''}{nodoData.OtraAtencion ? '🔴' : ''} {/* Muestra un icono si requiere atención */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <TablePagination
                component="div"
                count={totalRegistros}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                }}
                labelRowsPerPage="Nodos por página"
            />

            {/* Modal para mostrar historial de mantenimientos para un nodo que no requiere mantenimiento */}
            {selectedSinAtencionNodo && (
                <div
                    className="modal-overlay"
                    onClick={handleCloseModal} // Cierra el modal al hacer clic en el overlay
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                    > {/* Contenedor del modal */}
                        <h3>Información de mantenimiento</h3>
                        <p><strong>Ubicación:</strong> {selectedSinAtencionNodo.Ubicacion}</p> {/* Muestra la ubicación del nodo */}
                        <p><strong>Unidad:</strong> {selectedSinAtencionNodo.Unidad}</p> {/* Muestra la unidad del nodo */}
                        <p><strong>Categoría del Cable:</strong> {selectedSinAtencionNodo.CategoriaCable}</p> {/* Muestra la categoría del cable */}
                        {/* Muestra la observaciones generales del nodo */}
                        {!EstaVacio(selectedSinAtencionNodo.Observaciones) && (
                            <p><strong>Observaciones generales:</strong> {selectedSinAtencionNodo.Observaciones}</p>
                        )}
                        {/* Tabla con los registros de mantenimiento que sólo se muestra si hay registros en la BD */}
                        {!EstaVacio(selectedSinAtencionNodo.mantenimiento) && (
                            <div style={{ overflowX: 'auto', width: '100%' }}>
                                <table>
                                    <thead>
                                        <th>Fecha de registro</th>
                                        <th>Observaciones del usuario</th>
                                    </thead>
                                    <tbody className='content-table-modal'>
                                        {selectedSinAtencionNodo.mantenimiento.map((CamposMantenimiento, index) => (
                                            <tr key={index}> {/* Clave única para cada fila */}
                                                <td>{CamposMantenimiento.FechaCambio}</td> {/* Muestra la fecha de registro */}
                                                <td>{CamposMantenimiento.ObservacionesUsuario}</td> {/* Muestra las observaciones del usuario */}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) || (<p style={{ color: 'grey' }}>No hay registros en la tabla</p>)} {/* Coloca un mensaje en caso de estar sin registros */}
                        <div> {/* Contenedor de las imágenes */}
                            <br />
                            <strong>Imágenes con las que se solventaron:</strong>
                            <br />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selectedSinAtencionNodo?.imagesSolventadas && selectedSinAtencionNodo.imagesSolventadas.length > 0 ? ( // Muestra las imágenes si hay
                                    selectedSinAtencionNodo.imagesSolventadas.map((image, index) => {
                                        // Extraer el timestamp (últimos números antes de .png/.jpg)
                                        const fileName = image.ImagenURL.split('/').pop(); // Obtener "..._UNIDAD_1744139192838.png"
                                        const timestampMatch = fileName.match(/(\d+)\.\w+$/); // Extrae solo los números antes de la extensión
                                        const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : null;

                                        // Validar que el timestamp sea una fecha razonable (posterior a 2010)
                                        const formattedDate = timestamp && new Date(timestamp).getFullYear() >= 2010
                                            ? new Date(timestamp).toLocaleDateString('es-MX', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })
                                            : 'Fecha no disponible';
                                        return ( // Mapea las imágenes y las muestra
                                            <div key={index}>
                                                <div>
                                                    {formattedDate}
                                                </div>
                                                <img
                                                    key={index} // Clave única para cada imagen
                                                    src={'http://localhost:5000' + image.ImagenURL}  // URL de la imagen
                                                    alt={`Imagen ${index + 1}`} // Texto alternativo
                                                    width="200" // Ancho de la imagen
                                                    style={{ margin: '5px', cursor: 'pointer' }} // Estilos
                                                    onClick={() => handleImageClick(image.ImagenURL)} // Mostrar la imagen en grande
                                                />
                                            </div>
                                        );
                                    })
                                ) : ( // Si no hay imágenes
                                    <p>No hay imágenes disponibles.</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <Button onClick={handleCloseModal} variant="outlined">Cerrar</Button> {/* Botón para cancelar la eliminación */}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para mostrar historial de mantenimientos para un nodo que no requiere mantenimiento */}
            {selectedSinOtherAtencionNodo && (
                <div
                    className="modal-overlay"
                    onClick={handleCloseModal} // Cierra el modal al hacer clic en el overlay
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                    > {/* Contenedor del modal */}
                        <h3>Información de otras atenciones</h3>
                        <p><strong>Ubicación:</strong> {selectedSinOtherAtencionNodo.Ubicacion}</p> {/* Muestra la ubicación del nodo */}
                        <p><strong>Unidad:</strong> {selectedSinOtherAtencionNodo.Unidad}</p> {/* Muestra la unidad del nodo */}
                        <p><strong>Categoría del Cable:</strong> {selectedSinOtherAtencionNodo.CategoriaCable}</p> {/* Muestra la categoría del cable */}
                        {/* Muestra la observaciones generales del nodo */}
                        {!EstaVacio(selectedSinOtherAtencionNodo.Observaciones) && (
                            <p><strong>Observaciones generales:</strong> {selectedSinOtherAtencionNodo.Observaciones}</p>
                        )}
                        {/* Tabla con los registros de mantenimiento que sólo se muestra si hay registros en la BD */}
                        {!EstaVacio(selectedSinOtherAtencionNodo.mantenimiento) && (
                            <div style={{ overflowX: 'auto', width: '100%' }}>
                                <table>
                                    <thead>
                                        <th>Fecha de registro</th>
                                        <th>Observaciones del usuario</th>
                                    </thead>
                                    <tbody className='content-table-modal'>
                                        {selectedSinOtherAtencionNodo.otrasAtenciones.map((CamposOtrasAtenciones, index) => (
                                            <tr key={index}>
                                                <td>{CamposOtrasAtenciones.FechaCambio}</td>
                                                <td>{CamposOtrasAtenciones.ObservacionesUsuario}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) || (<p style={{ color: 'grey' }}>No hay registros en la tabla</p>)}
                        <div> {/* Contenedor de las imágenes */}
                            <br />
                            <strong>Imágenes con las que se solventaron:</strong>
                            <br />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selectedSinOtherAtencionNodo?.imagesSolventadas && selectedSinOtherAtencionNodo.imagesSolventadas.length > 0 ? ( // Muestra las imágenes si hay
                                    selectedSinOtherAtencionNodo.imagesSolventadas.map((image, index) => {
                                        // Extraer el timestamp (últimos números antes de .png/.jpg)
                                        const fileName = image.ImagenURL.split('/').pop(); // Obtener "..._UNIDAD_1744139192838.png"
                                        const timestampMatch = fileName.match(/(\d+)\.\w+$/); // Extrae solo los números antes de la extensión
                                        const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : null;

                                        // Validar que el timestamp sea una fecha razonable (posterior a 2010)
                                        const formattedDate = timestamp && new Date(timestamp).getFullYear() >= 2010
                                            ? new Date(timestamp).toLocaleDateString('es-MX', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })
                                            : 'Fecha no disponible';
                                        return ( // Mapea las imágenes y las muestra
                                            <div key={index}>
                                                <div>
                                                    {formattedDate}
                                                </div>
                                                <img
                                                    key={index} // Clave única para cada imagen
                                                    src={'http://localhost:5000' + image.ImagenURL}  // URL de la imagen
                                                    alt={`Imagen ${index + 1}`} // Texto alternativo
                                                    width="200" // Ancho de la imagen
                                                    style={{ margin: '5px', cursor: 'pointer' }} // Estilos
                                                    onClick={() => handleImageClick(image.ImagenURL)} // Mostrar la imagen en grande
                                                />
                                            </div>
                                        );
                                    })
                                ) : ( // Si no hay imágenes
                                    <p>No hay imágenes disponibles.</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <Button onClick={handleCloseModal} variant="outlined">Cerrar</Button> {/* Botón para cancelar la eliminación */}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para mostrar los detalles */}
            {selectedNodo && (
                <div
                    className="modal-overlay"
                    onClick={handleCloseModal} // Cierra el modal al hacer clic en el overlay
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                        style={{ minWidth: '30%' }}
                    > {/* Contenedor del modal */}
                        <h3>Detalles extra del nodo</h3>
                        <div> {/* Contenedor de las imágenes */}
                            <strong>Imágenes:</strong>
                            <br />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selectedNodo?.images && selectedNodo.images.length > 0 ? (
                                    selectedNodo.images.map((image, index) => {
                                        // Extraer el timestamp (últimos números antes de .png/.jpg)
                                        const fileName = image.ImagenURL.split('/').pop(); // Obtener "..._UNIDAD_1744139192838.png"
                                        const timestampMatch = fileName.match(/(\d+)\.\w+$/); // Extrae solo los números antes de la extensión
                                        const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : null;

                                        // Validar que el timestamp sea una fecha razonable (posterior a 2010)
                                        const formattedDate = timestamp && new Date(timestamp).getFullYear() >= 2010
                                            ? new Date(timestamp).toLocaleDateString('es-MX', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })
                                            : 'Fecha no disponible';

                                        return (
                                            <div key={index}>
                                                <div>
                                                    {image.ImagenURL.toLowerCase().includes('solventado') && (
                                                        <span style={{ color: 'green' }}>(Dentro de Solventado) </span>
                                                    ) || <span style={{ color: 'black' }}>(General) </span>}
                                                    <br></br>
                                                    {formattedDate}
                                                </div>
                                                <img
                                                    src={'http://localhost:5000' + image.ImagenURL}
                                                    alt={`Imagen ${index + 1}`}
                                                    width="200"
                                                    style={{ margin: '5px', cursor: 'pointer' }}
                                                    onClick={() => handleImageClick(image.ImagenURL)}
                                                />
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p>No hay imágenes disponibles.</p>
                                )}
                            </div>
                        </div>

                        {/* Contenedor de los materiales */}
                        <div className='content-Materials'>
                            {!EstaVacio(selectedNodo.materiales) && (
                                <div>
                                    <strong>Materiales necesarios:</strong>
                                    <div style={{ overflowX: 'auto', width: '100%' }}>
                                        <table>
                                            <thead>
                                                <th>Material</th>
                                                <th>Cantidad</th>
                                            </thead>
                                            <tbody className='content-table-modal'>
                                                {selectedNodo.materiales.map((CamposMaterialesNecesarios, index) => (
                                                    <tr key={index}> {/* Clave única para cada fila */}
                                                        <td>{CamposMaterialesNecesarios.Nombre}</td> {/* Coloca el nombre del material */}
                                                        <td>{CamposMaterialesNecesarios.Necesarios}</td>  {/* Coloca la cantidad del material */}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) || (<p style={{ color: 'grey' }}>No hay materiales necesarios</p>)} {/* Coloca un mensaje en caso de estar sin materiales utilizados */}

                            {!EstaVacio(selectedNodo.materiales) && (
                                <div>
                                    <strong>Materiales utilizados:</strong>
                                    <div style={{ overflowX: 'auto', width: '100%' }}>
                                        <table>
                                            <thead>
                                                <th>Material</th>
                                                <th>Cantidad</th>
                                            </thead>
                                            <tbody className='content-table-modal'>
                                                {selectedNodo.materiales.map((CamposMaterialesUtilizados, index) => (
                                                    <tr key={index}> {/* Clave única para cada fila */}
                                                        <td>{CamposMaterialesUtilizados.Nombre}</td> {/* Coloca el nombre del material */}
                                                        <td>{CamposMaterialesUtilizados.Utilizados}</td>  {/* Coloca la cantidad del material */}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) || (<p style={{ color: 'grey' }}>No hay materiales Utilizados</p>)} {/* Coloca un mensaje en caso de estar sin materiales utilizados */}
                        </div>
                        <Button onClick={handleCloseModal} variant="outlined">Cerrar</Button> {/* Botón para cerrar el modal */}
                    </div>
                </div>
            )}

            {/* Modal para mostrar la imagen en grande */}
            {selectedImage && (
                <div
                    className="modal-overlay"
                    onClick={() => setSelectedImage(null)} // Cierra el modal al hacer clic en el overlay
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                    > {/* Contenedor del modal */}
                        <img
                            src={selectedImage} // URL de la imagen
                            alt="Imagen en grande" // Texto alternativo
                            style={{ maxWidth: '75%', maxHeight: '75%' }} // Estilos
                        />
                        <br />
                        <br /><br />
                        <a href={selectedImage} target="_blank" rel="noopener noreferrer">
                            URL: {selectedImage}
                        </a>
                        <br /><br />
                        <Button onClick={() => setSelectedImage(null)} variant="outlined">Cerrar</Button> {/* Botón para cerrar el modal */}
                    </div>
                </div>
            )}

        </div>
    );
};

export default NodosSustitucion;