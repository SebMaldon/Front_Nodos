import { useState, useEffect } from 'react';
import { Button, Tooltip, TextField, ListItemText, ListItem, List, Typography, TablePagination } from '@mui/material';
import axios from 'axios';

const NodeTable = ({ nodos, fetchNodos, totalRegistrosApp, pageApp, setPageApp, rowsPerPageApp, setRowsPerPageApp }) => { // Recibe los nodos y la función para obtenerlos
    const [pageNode, setPageNode] = useState(0); 
    const [rowsPerPageNode, setRowsPerPageNode] = useState(10); 
    const [selectedRowId, setSelectedRowId] = useState(null); // Estado para la fila seleccionada
    const [hoveredRow, setHoveredRow] = useState(null);
    const [showMaterialesModal, setShowMaterialesModal] = useState(false); // Estado para mostrar el modal de materiales
    const [materiales, setMateriales] = useState([]); // Estado para almacenar los materiales
    const [selectedNodo, setSelectedNodo] = useState(null); // Estado para almacenar el nodo seleccionado (detalles)
    const [nodoToDelete, setNodoToDelete] = useState(null); // Estado para almacenar el nodo a eliminar
    const [nodoToEdit, setNodoToEdit] = useState(null); // Estado para almacenar el nodo a editar
    const [editFormData, setEditFormData] = useState({}); // Estado para almacenar los datos del formulario de edición
    const [selectedImage, setSelectedImage] = useState(null); // Estado para almacenar la imagen seleccionada
    const [unidades, setUnidades] = useState([]); // Estado para almacenar las unidades
    const [selectedAtencionNodo, setSelectedAtencionNodo] = useState(null); // Estado para almacenar el nodo a quitar la atención
    const [selectedOtherAtencionNodo, setSelectedOtherAtencionNodo] = useState(null); // Estado para almacenar el nodo a quitar otras atenciones
    const [selectedSinAtencionNodo, setSelectedSinAtencionNodo] = useState(null); // Estado para almacenar el nodo a quitar la atención
    const [selectedSinOtherAtencionNodo, setSelectedSinOtherAtencionNodo] = useState(null); // Estado para almacenar el nodo a quitar otras atenciones
    const [filteredNodos, setFilteredNodos] = useState([]); // Estado para almacenar la nueva consulta
    const [totalRegistros, setTotalRegistros] = useState(0); // Estado para el total de registros
    const [totalFaltantes, setTotalFaltantes] = useState(0); // Estado para el total de nodos faltantes
    const [totalAtendidos, setTotalAtendidos] = useState(0); // Estado para el total de nodos atendidos
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
    const [newImageFiles, setNewImageFiles] = useState([]); // Estado para las nuevas imágenes
    const [showObservacionesModal, setShowObservacionesModal] = useState(false); // Estado para mostrar la modal de observaciones en la modal de edición
    const [showObservacionesModalTable, setShowObservacionesModalTable] = useState(false); // Estado para mostrar la modal de observaciones en la tabla
    const [showObservacionesModalParcialTable, setShowObservacionesModalParcialTable] = useState(false); // Estado para mostrar la modal de observaciones en la tabla
    const [observacionesUsuario, setObservacionesUsuario] = useState(''); // Estado para almacenar las observaciones
    const [campoCambiado, setCampoCambiado] = useState(''); // Para saber si el cambio fue en Atencion o OtraAtencion
    const [tipoAtencion, setTipoAtencion] = useState(''); // Estado para almacenar el tipo de atención (Atencion u OtraAtencion)
    const [materialesEditados, setMaterialesEditados] = useState([]); // Para rastrear cambios
    const [editMateriales, setEditMateriales] = useState([]); // Estado para edición temporal
    const [pagination, setPagination] = useState({
        page: 0,
        rowsPerPage: 5,
        searchTerm: ''
    });


    // Filtrar y paginar materiales
    const filteredMaterials = editMateriales.filter(material =>
        material.Nombre.toLowerCase().includes(pagination.searchTerm.toLowerCase()) ||
        material.Categoria.toLowerCase().includes(pagination.searchTerm.toLowerCase())
    );

    const paginatedMaterials = filteredMaterials.slice(
        pagination.page * pagination.rowsPerPage,
        (pagination.page + 1) * pagination.rowsPerPage
    );

    // Filtros vacios check
    const filtrosEstanVacios = () => Object.values(filtros).every((filtro) => filtro === '');

    // Obtener los nodos al cargar el componente o cuando cambien los filtros
    useEffect(() => {
        setPageNode(0); // Reiniciar pagina de los filtros al modificar un filtro
        fetchNewNodos(); 
    }, [filtros]); 

    // Re-fetch cuando cambiamos la pagina o el limite (solo si hay filtros activos, de lo contrario App.jsx se encarga)
    useEffect(() => {
        if (!filtrosEstanVacios()) {
            fetchNewNodos();
        }
    }, [pageNode, rowsPerPageNode]);

    // Función para manejar cambios en los filtros
    const handleFiltroChange = (e) => {
        const { name, value } = e.target; // Extrae el nombre y el valor del campo
        setFiltros({ ...filtros, [name]: value }); // Actualiza el estado de los filtros
    };

    // Función para hacer la nueva consulta GET y actualizar el estado
    const fetchNewNodos = async () => {
        // Si todos los filtros están vacíos, no hacer la consulta local
        if (filtrosEstanVacios()) {
            // App.jsx controls fetchNodos when filters are empty
            setFilteredNodos([]);
            setTotalFaltantes(0); 
            setTotalAtendidos(0);
            return;
        }

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

            // Hacer la solicitud a la API con los filtros modificados y paginación
            const response = await axios.get('http://localhost:5000/api/nodos', {
                params: { ...params, page: pageNode + 1, limit: rowsPerPageNode },
            });

            setFilteredNodos(response.data.nodos); // Almacenar los datos filtrados en el estado
            setTotalRegistros(response.data.total); // Almacenar el total de registros en el estado
            setTotalFaltantes(response.data.faltantes); // Almacenar el total de nodos faltantes en el estado
            setTotalAtendidos(response.data.totalAtendido);// Almacenar el total de nodos atendidos en el estado
        } catch (error) {
            console.error('Error al obtener los nuevos nodos:', error);
        }
    };
    const fetchUOtrosNodos = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/nodos/unidades'); // Hacer una petición GET a la API

            setUnidades(response.data); // Almacenar las unidades en el estado
        } catch (error) {
            console.error('Error al obtener las unidades:', error);
        }
    };

    // Obtener las unidades y los materiales al cargar el componente
    useEffect(() => {
        const fetchUnidades = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/nodos/unidades'); // Hacer una petición GET a la API

                setUnidades(response.data); // Almacenar las unidades en el estado
            } catch (error) {
                console.error('Error al obtener las unidades:', error);
            }
        };
        fetchUnidades(); // Llamar a la función para obtener las unidades
    }, []);

    // Obtener los materiales al cargar el componente
    const fetchMateriales = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/nodos/materiales'); // Hacer una petición GET a la API

            setMateriales(response.data); // Almacenar los materiales en el estado
        } catch (error) {
            console.log('Error al obtener los materiales: ', error);
        }
    };

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

    // Función para abrir el modal de confirmación de eliminación
    const handleDeleteClick = (nodoData) => {
        setNodoToDelete(nodoData); // Guarda el nodo a eliminar en el estado
    };

    // Función para abrir el modal de confirmación para quitar la atención
    const handleAtencionClick = async (nodoData) => {
        if (nodoData.Atencion == true) { // Si el nodo requiere atención
            try {
                // Obtener las imágenes solventadas desde el backend
                const response = await axios.get(`http://localhost:5000/api/nodos/${nodoData.Id}`);
                const Datos = response.data;

                // Actualizar el nodo con las imágenes solventadas
                setSelectedAtencionNodo(Datos);
            } catch (error) {
                console.error('Error al obtener los datos del nodo:', error);
            }
        } else { // Si el nodo no requiere atención
            try {
                // Obtener las imágenes solventadas desde el backend
                const response = await axios.get(`http://localhost:5000/api/nodos/${nodoData.Id}`);
                const Datos = response.data;

                // Actualizar el nodo con las imágenes solventadas
                setSelectedSinAtencionNodo(Datos);
            } catch (error) {
                console.error('Error al obtener los datos del nodo:', error);
            }
        }
    };

    // Función para abrir el modal de confirmación para quitar otras atenciones
    const handleOtherAtencionClick = async (nodoData) => {
        if (nodoData.OtraAtencion == true) { // Si el nodo requiere atención
            try {
                // Obtener las imágenes solventadas desde el backend
                const response = await axios.get(`http://localhost:5000/api/nodos/${nodoData.Id}`);
                const Datos = response.data;

                // Actualizar el nodo con las imágenes solventadas
                setSelectedOtherAtencionNodo(Datos);
            } catch (error) {
                console.error('Error al obtener los datos:', error);
            }
        } else { // Si el nodo no requiere atención
            try {
                // Obtener las imágenes solventadas desde el backend
                const response = await axios.get(`http://localhost:5000/api/nodos/${nodoData.Id}`);
                const Datos = response.data;

                // Actualizar el nodo con las imágenes solventadas
                setSelectedSinOtherAtencionNodo(Datos);
            } catch (error) {
                console.error('Error al obtener los datos:', error);
            }
        }
    };

    // Manejar cambios en la selección de archivos
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        // Filtrar archivos duplicados por nombre y tamaño
        const uniqueFiles = files.reduce((acc, file) => {
            const isDuplicate = acc.some(
                f => f.name === file.name && f.size === file.size // Verifica si el archivo ya existe en el array
            );
            if (!isDuplicate) { // Si no es un duplicado, lo agrega al array
                acc.push(file);
            }
            return acc;
        }, []);

        setNewImageFiles(uniqueFiles); // Actualiza el estado con los archivos únicos
    };

    // Función para cerrar los modales
    const handleCloseModal = () => {
        setSelectedNodo(null); // Limpia el estado
        setNodoToDelete(null); // Limpia el estado
        setNodoToEdit(null); // Limpia el estado
        setSelectedImage(null); // Limpia la imagen seleccionada
        setSelectedAtencionNodo(null); // Limpia el estado
        setSelectedOtherAtencionNodo(null); // Limpia el estado
        setSelectedSinAtencionNodo(null); // Limpia el estado
        setSelectedSinOtherAtencionNodo(null); // Limpia el estado
        setObservacionesUsuario(''); //limpiar los datos
        setShowObservacionesModalTable(null); // Cierra la modal
        setShowObservacionesModalParcialTable(null); // Cierra la modal
        setShowObservacionesModal(null); // Cierra la modal
        setNewImageFiles([]); // Vaciar las imágenes
    };

    // Función para manejar cambios en el formulario de edición
    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target; // Extrae el nombre, valor, tipo y estado del campo

        if (name === 'Unidad') {
            const unidadSeleccionada = unidades.find(u => u.nombre === value); // Almacena los datos de la unidad almacenada
            setEditFormData({
                ...editFormData, // Datos del formulario
                Unidad: value, // Registra el nombre de la unidad
                Referencia: unidadSeleccionada ? unidadSeleccionada.ref : '' // Registra la referencia de la unidad
            });
            return;
        }

        // Si el campo es Atencion o OtraAtencion, mostrar la modal de observaciones
        if (name === 'Atencion' || name === 'OtraAtencion') {
            setCampoCambiado(name); // Guardar el campo que se está cambiando
            setShowObservacionesModal(true); // Mostrar la modal de observaciones
        }

        setEditFormData({ // Actualiza el estado del formulario
            ...editFormData, // Mantiene los datos actuales
            [name]: type === 'checkbox' ? checked : value, // Actualiza el campo con el nuevo valor
        });
    };

    // Función que maneja la actualización de los datos cuando se guardan los cambios
    const handleSaveChangesAtenciones = async () => {
        try {
            const formDataToSend = new FormData(); // Crea un nuevo objeto FormData

            const longitud = parseFloat(editFormData.Longitud) || 0; // Convertir a valor decimal
            const nodosFaltantes = parseInt(editFormData.Nodos_faltantes) || 0; // Convertir a valor entero

            formDataToSend.append('esAtencionParcialMante', false);
            formDataToSend.append('esAtencionParcialOtro', false);
            formDataToSend.append('Ubicacion', editFormData.Ubicacion); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Unidad', editFormData.Unidad); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('CategoriaCable', editFormData.CategoriaCable); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('AnioInstalacion', editFormData.AnioInstalacion); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('EstadoCable', editFormData.EstadoCable); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Puerto', editFormData.Puerto); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Area', editFormData.Area); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Longitud', longitud); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('IpSwitch', editFormData.IpSwitch); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Observaciones', editFormData.Observaciones); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Atencion', editFormData.Atencion ? 1 : 0); // Agrega los datos del formulario al objeto FormData (como 1 o 0)
            formDataToSend.append('OtraAtencion', editFormData.OtraAtencion ? 1 : 0); // Agrega los datos del formulario al objeto FormData (como 1 o 0)
            formDataToSend.append('Referencia', editFormData.Referencia); // Agregar los datos del formulario al FormData
            formDataToSend.append('Nodos_faltantes', nodosFaltantes); // Agregar los datos del formulario al FormData

            // Agregar las observaciones del usuario (si existen)
            if (editFormData.ObservacionesUsuarioAtencion) {
                formDataToSend.append('ObservacionesUsuarioAtencion', editFormData.ObservacionesUsuarioAtencion);
            }
            if (editFormData.ObservacionesUsuarioOtraAtencion) {
                formDataToSend.append('ObservacionesUsuarioOtraAtencion', editFormData.ObservacionesUsuarioOtraAtencion);
            }

            // Enviar los datos al backend
            const response = await axios.put(
                `http://localhost:5000/api/nodos/${nodoToEdit.Id}`, // URL de la API para actualizar el nodo
                formDataToSend, // Datos a enviar
                {
                    headers: { // Cabeceras de la petición
                        'Content-Type': 'multipart/form-data', // Tipo de contenido (multipart/form-data)
                    },
                }
            );

            alert('Cambios guardados correctamente');
            handleCloseModal(); // Cerrar el modal
            fetchNewNodos(); // Actualizar la lista de nodos
            setNewImageFiles([]); // Limpiar el estado de las nuevas imágenes
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            alert('Error al guardar los cambios');
        }
    };

    // Función que maneja la actualización de los datos cuando se guardan los cambios
    const handleSaveChanges = async () => {
        try {
            const formDataToSend = new FormData(); // Crea un nuevo objeto FormData

            const longitud = parseFloat(editFormData.Longitud) || 0; // Convertir a valor decimal
            const nodosFaltantes = parseInt(editFormData.Nodos_faltantes) || 0; // Convertir a valor entero

            formDataToSend.append('esAtencionParcialMante', false);
            formDataToSend.append('esAtencionParcialOtro', false);
            formDataToSend.append('Ubicacion', editFormData.Ubicacion); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Unidad', editFormData.Unidad); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('CategoriaCable', editFormData.CategoriaCable); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('AnioInstalacion', editFormData.AnioInstalacion); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('EstadoCable', editFormData.EstadoCable); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Puerto', editFormData.Puerto); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Area', editFormData.Area); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Longitud', longitud); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('IpSwitch', editFormData.IpSwitch); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Observaciones', editFormData.Observaciones); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Atencion', editFormData.Atencion ? 1 : 0); // Agrega los datos del formulario al objeto FormData (como 1 o 0)
            formDataToSend.append('OtraAtencion', editFormData.OtraAtencion ? 1 : 0); // Agrega los datos del formulario al objeto FormData (como 1 o 0)
            formDataToSend.append('Referencia', editFormData.Referencia); // Agregar los datos del formulario al FormData
            formDataToSend.append('Nodos_faltantes', nodosFaltantes); // Agregar los datos del formulario al FormData

            // Agregar las observaciones del usuario (si existen)
            if (editFormData.ObservacionesUsuarioAtencion) {
                formDataToSend.append('ObservacionesUsuarioAtencion', editFormData.ObservacionesUsuarioAtencion);
            }
            if (editFormData.ObservacionesUsuarioOtraAtencion) {
                formDataToSend.append('ObservacionesUsuarioOtraAtencion', editFormData.ObservacionesUsuarioOtraAtencion);
            }

            // Agregar las nuevas imágenes (solo si se seleccionan)
            if (newImageFiles.length > 0) {
                newImageFiles.forEach((file) => { // Iterar sobre las nuevas imágenes
                    formDataToSend.append('newImages', file); // Agregar las nuevas imágenes al objeto FormData
                });
            }

            // Enviar los datos al backend
            const response = await axios.put(
                `http://localhost:5000/api/nodos/${nodoToEdit.Id}`, // URL de la API para actualizar el nodo
                formDataToSend, // Datos a enviar
                {
                    headers: { // Cabeceras de la petición
                        'Content-Type': 'multipart/form-data', // Tipo de contenido (multipart/form-data)
                    },
                }
            );

            alert('Cambios guardados correctamente');
            handleCloseModal(); // Cerrar el modal
            fetchNewNodos(); // Actualizar la lista de nodos
            setNewImageFiles([]); // Limpiar el estado de las nuevas imágenes
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            alert('Error al guardar los cambios');
        }
    };

    // Función para quitar la atención de un nodo
    const handleDeleteAtencion = async () => {
        setTipoAtencion('Atencion'); // Establecer el tipo de atención
        setShowObservacionesModalTable(true); // Mostrar la modal de observaciones
    };

    // Función para quitar otra atención de un nodo
    const handleDeleteOtherAtencion = async () => {
        setTipoAtencion('OtraAtencion'); // Establecer el tipo de atención
        setShowObservacionesModalTable(true); // Mostrar la modal de observaciones
    };

    // Función para quitar la atención de un nodo
    const handleParcialAtencion = async () => {
        setTipoAtencion('Atencion'); // Establecer el tipo de atención
        setShowObservacionesModalParcialTable(true); // Mostrar la modal de observaciones
    };

    // Función para quitar otra atención de un nodo
    const handleParcialOtherAtencion = async () => {
        setTipoAtencion('OtraAtencion'); // Establecer el tipo de atención
        setShowObservacionesModalParcialTable(true); // Mostrar la modal de observaciones
    };

    // Función para eliminar el nodo
    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`http://localhost:5000/api/nodos/${nodoToDelete.Id}`); // URL de la API para eliminar el nodo
            fetchNewNodos(); // Actualizar la lista de nodos
            alert('Nodo eliminado exitosamente');
            handleCloseModal(); // Cerrar el modal
            fetchNewNodos(); // Actualizar los registros de la tabla
        } catch (error) {
            console.error('Error al eliminar el nodo:', error);
        }
    };

    // Función para mostrar la imagen en grande
    const handleImageClick = (imageUrl) => {
        setSelectedImage('http://localhost:5000' + imageUrl); // Guarda la imagen seleccionada en el estado
    };

    // Función para abrir el modal de edición
    const handleEditClick = async (nodoData) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/nodos/${nodoData.Id}`); // Obtener los detalles completos del nodo
            setNodoToEdit(nodoData); // Guardar el nodo a editar en el estado
            setEditFormData({
                ...nodoData, // Llenar el formulario con los datos actuales del nodo
                images: response.data.images || [], // Agregar las imágenes al formulario (si hay)
                imagesSolventadas: response.data.imagesSolventadas || [], // Agregar las imágenes al formulario (si hay)
            });
        } catch (error) {
            console.error('Error al obtener los detalles del nodo:', error);
            alert('Error al obtener los detalles del nodo');
        }
    };


    // Función para eliminar una imagen de la base de datos
    const handleDeleteImage = async (imageId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta imagen?')) return;

        try {
            await axios.delete(`http://localhost:5000/api/nodos/images/${imageId}`);

            // Versión segura que verifica la existencia de selectedNodo e images
            setSelectedNodo(prevState => {
                if (!prevState) {
                    console.error('selectedNodo es null');
                    return null;
                }

                return {
                    ...prevState,
                    images: Array.isArray(prevState.images)
                        ? prevState.images.filter(img => img.Id !== imageId)
                        : []
                };
            });

            // Mostrar feedback al usuario
            alert('Imagen eliminada con éxito');

            // No cerrar el modal automáticamente para permitir más acciones
            handleCloseModal();

            // Recargar datos
            fetchNewNodos();

        } catch (error) {
            console.error('Error al eliminar la imagen:', error);
            alert('Hubo un error al eliminar la imagen');
        }
    };

    const datosAMostrar = Object.values(filtros).some((filtro) => filtro !== '') ? filteredNodos : nodos; // Si hay filtros, mostrar los nodos filtrados, de lo contrario mostrar todos los nodos

    // Eliminado filtrosEstanVacios duplicado

    // Función para verificar si un campo (array) está vacío
    const EstaVacio = (dato) => {
        // console.log(dato,' - ',dato.length);
        if (dato.length == 0) {
            return true;
        } else {
            return false;
        }
    };

    const handleOpenMaterialesModal = async () => {
        try {
            // Obtener todos los materiales disponibles
            const materialesResponse = await axios.get('http://localhost:5000/api/nodos/materiales');
            const todosMateriales = materialesResponse.data;
            // Obtener materiales específicos del nodo (si existen)
            const nodoMaterialesResponse = await axios.get(`http://localhost:5000/api/nodos/${nodoToEdit.Id}`);
            const materialesDelNodo = nodoMaterialesResponse.data.materiales;
            // Combinar ambos conjuntos de datos
            const materialesCombinados = todosMateriales.map(material => {
                const materialEnNodo = materialesDelNodo.find(m => m.MaterialId === material.Id);
                return {
                    ...material,
                    Necesarios: materialEnNodo ? parseFloat(materialEnNodo.Necesarios) || 0 : 0,
                    Utilizados: materialEnNodo ? parseFloat(materialEnNodo.Utilizados) || 0 : 0,
                    editado: false,
                    MaterialId: material.Id
                };
            });
            setEditMateriales(materialesCombinados); // Guardar los materiales en el estado
            setMaterialesEditados([]); // Limpiar la lista de editados
            setShowMaterialesModal(true); // Mostrar el modal de materiales
        } catch (error) {
            console.error('Error al obtener materiales:', error);
            alert('Error al cargar materiales');
        }
    };

    // Función para manejar cambios en los inputs de materiales
    const handleMaterialChange = (materialId, field, value, unidadMedida) => {
        // Validación basada en la unidad de medida
        let valorNumerico;

        if (unidadMedida === 'piezas') {
            // Para piezas: solo enteros positivos
            valorNumerico = Math.max(0, parseInt(value) || 0);
        } else {
            // Para otras unidades: permitir decimales
            valorNumerico = Math.max(0, parseFloat(value) || 0);
        }

        setEditMateriales(prev => prev.map(mat => { // Actualiza el estado de los materiales
            if (mat.Id === materialId) { // Si el material coincide con el ID
                const valorCambiado = mat[field] !== valorNumerico;

                return {
                    ...mat,
                    [field]: valorNumerico,
                    editado: valorCambiado ? true : mat.editado
                };
            }
            return mat;
        }));

        // Actualizar lista de materiales editados
        setMaterialesEditados(prev => {
            if (!prev.includes(materialId)) { // Si el material no está en la lista de editados
                return [...prev, materialId];
            }
            return prev;
        });
    };

    // Función para guardar cambios
    const handleSaveMateriales = async () => {
        try {
            // Filtrar solo materiales que fueron editados
            const materialesAEnviar = editMateriales
                .filter(mat => materialesEditados.includes(mat.Id)) // Filtrar los materiales editados
                .map(({ MaterialId, Necesarios, Utilizados }) => ({ // Mapear los datos necesarios
                    MaterialId,
                    Necesarios,
                    Utilizados
                }));

            if (materialesAEnviar.length === 0) { // Si no hay cambios, mostrar alerta
                alert('No hay cambios para guardar');
                return;
            }

            // Enviar los cambios al backend
            const response = await axios.put(
                `http://localhost:5000/api/nodos/materiales/${nodoToEdit.Id}`,
                { materiales: materialesAEnviar }
            );
            if (response.data.success) {
                alert('Materiales actualizados correctamente');
                setShowMaterialesModal(false); // Cerrar la modal de materiales
                setMaterialesEditados([]); // Limpiar la lista de editados
            }
        } catch (error) {
            console.error('Error al guardar materiales:', error);
            alert('Error al guardar materiales');
        }
    };

    // Función para validar la entrada de materiales
    const validarEntradaMaterial = (value, unidadMedida) => {
        if (unidadMedida === 'piezas') {
            // Solo permitir números enteros positivos
            const intValue = parseInt(value);
            return isNaN(intValue) ? 0 : Math.max(0, intValue);
        }
        // Para otras unidades (metros), permitir decimales
        const floatValue = parseFloat(value);
        return isNaN(floatValue) ? 0 : Math.max(0, floatValue);
    };

    return ( // Renderiza la tabla con los nodos
        <div>
            <h2>Nodos Registrados</h2>

            {/* Filtros */}
            <div className="filtros">
                <label>
                    Filtros:
                    <select
                        style={{ marginLeft: '5px' }}
                        name="tipoAtencion" // Nombre del campo
                        value={filtros.tipoAtencion} // Valor del campo
                        onChange={handleFiltroChange} // Manejar cambios en el campo
                    >
                        <option value="">Ninguno</option>
                        <option value="uno">Recibieron atención</option>
                        <option value="mantenimiento">Requieren mantenimiento</option>
                        <option value="otraAtencion">Requieren otro tipo de atención</option>
                        <option value="ambos">Con mantenimiento y otro tipo de atención</option>
                        <option value="ninguno">Sin mantenimiento y otro tipo de atención</option>
                    </select>
                </label>
                <label style={{ marginLeft: '10px' }}>
                    Unidad:
                    <select // Selector para filtrar por unidad
                        style={{ marginLeft: '5px' }}
                        name="unidad" // Nombre del campo
                        value={filtros.unidad} // Valor del campo
                        onChange={handleFiltroChange} // Manejar cambios en el campo
                    >
                        <option value="">Todas</option> {/* Opción por defecto */}
                        {unidades.map((unidad) => ( // Mapear las unidades para mostrarlas en el select
                            <option key={unidad.ref} value={unidad.ref}> {/* Opción de la unidad con su referencia */}
                                {unidad.nombre} {/* Nombre de la unidad */}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {/* Botones de Acción Globales */}
            <div className="acciones-globales" style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <Button
                    onClick={() => {
                        const node = nodos.find(n => n.Id === selectedRowId);
                        if (node) handleDetailsClick(node);
                    }}
                    variant='contained'
                    size='small'
                    disabled={!selectedRowId}
                    color="primary"
                >
                    <i className="fas fa-eye" style={{ marginRight: '5px' }}></i> Detalles
                </Button>
                <Button
                    onClick={() => {
                        const node = nodos.find(n => n.Id === selectedRowId);
                        if (node) handleEditClick(node);
                    }}
                    variant='contained'
                    size='small'
                    disabled={!selectedRowId}
                    color="warning"
                    style={{ backgroundColor: !selectedRowId ? undefined : '#ed6c02', color: 'white' }}
                >
                    <i className="fas fa-edit" style={{ marginRight: '5px' }}></i> Editar
                </Button>
                <Button
                    onClick={() => {
                        const node = nodos.find(n => n.Id === selectedRowId);
                        if (node) handleDeleteClick(node);
                    }}
                    variant='contained'
                    size='small'
                    disabled={!selectedRowId}
                    color="error"
                >
                    <i className="fas fa-trash" style={{ marginRight: '5px' }}></i> Eliminar
                </Button>
            </div>

            {/* Etiqueta con el total de registros (solo si los filtros no están vacíos) */}
            {!filtrosEstanVacios() && (
                <div style={{ marginTop: '10px', fontWeight: 'bold', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <label>Total de registros: {totalRegistros}</label>
                    <label> Nodos faltantes:{totalFaltantes || ' 0'} </label>
                    <label> Nodos atendidos:{totalAtendidos || ' 0'} </label>
                </div>

            )}

            <div style={{ overflowX: 'auto', width: '100%' }}>
            <table> {/* Tabla para mostrar los nodos */}
                <thead>
                    <tr> {/* Encabezados de la tabla */}
                        <th>Ubicación</th>
                        <th>Unidad</th>
                        <th>Puerto</th>
                        <th>IP del Switch</th>
                        <th>Observaciones</th>
                        {/* Column removed: Acciones */}
                        <th>Faltantes</th>
                        <th>M</th>
                        <th>OA</th>
                    </tr>
                </thead>
                <tbody> {/* Cuerpo de la tabla */}
                    {/* Si filteredNodos tiene datos, usa esos, de lo contrario usa nodos */}
                    {datosAMostrar.map((nodoData, index) => {
                        // Determinar el color basado en si tiene imágenes y si la fila es par/impar
                        const isEven = index % 2 === 0;

                        // Colores base (solo para nodos sin imágenes)
                        const baseColor = nodoData.TieneImagenes ? '' :
                            (isEven ? '#fb99a8' : '#f76d82');

                        // Color hover (solo para nodos sin imágenes)
                        const hoverColor = nodoData.TieneImagenes ? '' :
                            (isEven ? '#ffdade' : '#ffc0cb');

                        // Determinar el color actual
                        const currentColor = (hoveredRow === index && !nodoData.TieneImagenes)
                            ? hoverColor
                            : baseColor;


                        return (
                            <tr
                                key={index}
                                onClick={() => setSelectedRowId(nodoData.Id)}
                                style={{
                                    backgroundColor: selectedRowId === nodoData.Id ? '#e3f2fd' : currentColor,
                                    cursor: 'pointer',
                                    border: selectedRowId === nodoData.Id ? '2px solid #1976d2' : 'none'
                                }}
                                // Eventos para manejar el coloreado de la fila al sobreponer el puntero
                                onMouseEnter={() => setHoveredRow(index)}
                                onMouseLeave={() => setHoveredRow(null)}
                            >
                                <td>{nodoData.Ubicacion}</td> {/* Muestra la ubicación del nodo */}
                                <td>{nodoData.Unidad}</td> {/* Muestra la unidad del nodo */}
                                <td style={{ textAlign: 'center' }}>{nodoData.Puerto}</td> {/* Muestra el puerto */}
                                <td style={{ textAlign: 'center' }}>{nodoData.IpSwitch}</td> {/* Muestra la IP del switch */}
                                <td>{nodoData.Observaciones}</td> {/* Muestra el año de instalación */}
                                {/* Column cell removed: Acciones */}
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
                        );
                    })}
                </tbody>
            </table>
            </div>

            <TablePagination
                component="div"
                count={filtrosEstanVacios() ? totalRegistrosApp : totalRegistros}
                page={filtrosEstanVacios() ? pageApp : pageNode}
                onPageChange={(event, newPage) => {
                    if (filtrosEstanVacios()) setPageApp(newPage);
                    else setPageNode(newPage);
                }}
                rowsPerPage={filtrosEstanVacios() ? rowsPerPageApp : rowsPerPageNode}
                rowsPerPageOptions={[5, 10, 25, 50]}
                onRowsPerPageChange={(event) => {
                    const newRows = parseInt(event.target.value, 10);
                    if (filtrosEstanVacios()) {
                        setRowsPerPageApp(newRows);
                        setPageApp(0);
                    } else {
                        setRowsPerPageNode(newRows);
                        setPageNode(0);
                    }
                }}
                labelRowsPerPage="Nodos por página"
            />

            {/* Modal para quitar la atención del mantenimiento */}
            {selectedAtencionNodo && (
                <div
                    className="modal-overlay"
                    onClick={handleCloseModal} // Cierra el modal al hacer clic en el overlay
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                    > {/* Contenedor del modal */}
                        <h3>¿Estás seguro de que este nodo ya no requiere mantenimiento?</h3>
                        <p><strong>Ubicación:</strong> {selectedAtencionNodo.Ubicacion}</p> {/* Muestra la ubicación del nodo */}
                        <p><strong>Unidad:</strong> {selectedAtencionNodo.Unidad}</p> {/* Muestra la unidad del nodo */}
                        <p><strong>Categoría del Cable:</strong> {selectedAtencionNodo.CategoriaCable}</p> {/* Muestra la categoría del cable */}
                        {/* Muestra la observaciones generales del nodo */}
                        {!EstaVacio(selectedAtencionNodo.Observaciones) && (
                            <p><strong>Observaciones generales:</strong> {selectedAtencionNodo.Observaciones}</p>
                        )}
                        {/* Tabla con los registros de mantenimiento que sólo se muestra si hay registros en la BD */}
                        {!EstaVacio(selectedAtencionNodo.mantenimiento) && (
                            <div style={{ overflowX: 'auto', width: '100%' }}>
                            <table>
                                <thead>
                                    <th>Fecha de registro</th>
                                    <th>Observaciones del usuario</th>
                                </thead>
                                <tbody className='content-table-modal'>
                                    {selectedAtencionNodo.mantenimiento.map((CamposMantenimiento, index) => ( // Mapea los registros de mantenimiento y los muestra
                                        <tr key={index}> {/* Clave única para cada fila */}
                                            <td>{CamposMantenimiento.FechaCambio}</td>
                                            <td>{CamposMantenimiento.ObservacionesUsuario}</td>
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
                                {selectedAtencionNodo?.imagesSolventadas && selectedAtencionNodo.imagesSolventadas.length > 0 ? ( // Muestra las imágenes si hay
                                    selectedAtencionNodo.imagesSolventadas.map((image, index) => {
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
                            <Button onClick={handleParcialAtencion} variant="contained">Solventado parcialmente</Button> {/* Botón para confirmar la eliminación */}
                            <Button onClick={handleDeleteAtencion} className='delete-button'>Ya no requiere mantenimiento</Button> {/* Botón para confirmar la eliminación */}
                            <Button onClick={handleCloseModal} variant="outlined">Cancelar</Button> {/* Botón para cancelar la eliminación */}
                        </div>
                    </div>
                </div>
            )}

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
                        <h3>Este nodo no requiere mantenimiento</h3>
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
                                    {selectedSinAtencionNodo.mantenimiento.map((CamposMantenimiento, index) => ( // Mapea los registros de mantenimiento
                                        <tr key={index}> {/* Clave única para cada fila */}
                                            <td>{CamposMantenimiento.FechaCambio}</td>
                                            <td>{CamposMantenimiento.ObservacionesUsuario}</td>
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

            {/* Modal para quitar otra atención */}
            {selectedOtherAtencionNodo && (
                <div
                    className="modal-overlay"
                    onClick={handleCloseModal} // Cierra el modal al hacer clic en el overlay
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                    > {/* Contenedor del modal */}
                        <h3>¿Estás seguro de que este nodo ya no requiere de otra atención?</h3>
                        <p><strong>Ubicación:</strong> {selectedOtherAtencionNodo.Ubicacion}</p> {/* Muestra la ubicación del nodo */}
                        <p><strong>Unidad:</strong> {selectedOtherAtencionNodo.Unidad}</p> {/* Muestra la unidad del nodo */}
                        <p><strong>Categoría del Cable:</strong> {selectedOtherAtencionNodo.CategoriaCable}</p> {/* Muestra la categoría del cable */}
                        {/* Muestra la observaciones generales del nodo */}
                        {!EstaVacio(selectedOtherAtencionNodo.Observaciones) && (
                            <p><strong>Observaciones generales:</strong> {selectedOtherAtencionNodo.Observaciones}</p>
                        )}
                        {/* Tabla con los registros de otras atenciones que sólo se muestra si hay registros en la BD */}
                        {!EstaVacio(selectedOtherAtencionNodo.otrasAtenciones) && (
                            <div style={{ overflowX: 'auto', width: '100%' }}>
                            <table>
                                <thead>
                                    <th>Fecha de registro</th>
                                    <th>Observaciones del usuario</th>
                                </thead>
                                <tbody className='content-table-modal'>
                                    {selectedOtherAtencionNodo.otrasAtenciones.map((CamposOtrasAtenciones, index) => ( // Mapea los registros de otras atenciones y los muestra
                                        <tr key={index}> {/* Clave única para cada fila */}
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
                                {selectedOtherAtencionNodo?.imagesSolventadas && selectedOtherAtencionNodo.imagesSolventadas.length > 0 ? ( // Muestra las imágenes si hay
                                    selectedOtherAtencionNodo.imagesSolventadas.map((image, index) => {
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
                            <Button onClick={handleParcialOtherAtencion} variant="contained">Solventado parcialmente</Button> {/* Botón para confirmar la eliminación */}
                            <Button onClick={handleDeleteOtherAtencion} className='delete-button'>Ya no requiere atención</Button> {/* Botón para confirmar la eliminación */}
                            <Button onClick={handleCloseModal} variant="outlined">Cancelar</Button> {/* Botón para cancelar la eliminación */}
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
                        <h3>Este nodo no requiere otras atenciones</h3>
                        <p><strong>Ubicación:</strong> {selectedSinOtherAtencionNodo.Ubicacion}</p> {/* Muestra la ubicación del nodo */}
                        <p><strong>Unidad:</strong> {selectedSinOtherAtencionNodo.Unidad}</p> {/* Muestra la unidad del nodo */}
                        <p><strong>Categoría del Cable:</strong> {selectedSinOtherAtencionNodo.CategoriaCable}</p> {/* Muestra la categoría del cable */}
                        {/* Muestra la observaciones generales del nodo */}
                        {!EstaVacio(selectedSinOtherAtencionNodo.Observaciones) && (
                            <p><strong>Observaciones generales:</strong> {selectedSinOtherAtencionNodo.Observaciones}</p>
                        )}
                        {/* Tabla con los registros de mantenimiento que sólo se muestra si hay registros en la BD */}
                        {!EstaVacio(selectedSinOtherAtencionNodo.otrasAtenciones) && (
                            <div style={{ overflowX: 'auto', width: '100%' }}>
                            <table>
                                <thead>
                                    <th>Fecha de registro</th>
                                    <th>Observaciones del usuario</th>
                                </thead>
                                <tbody className='content-table-modal'>
                                    {selectedSinOtherAtencionNodo.otrasAtenciones.map((CamposOtrasAtenciones, index) => ( // Mapea los registros de otras atenciones
                                        <tr key={index}> {/* Clave única para cada fila */}
                                            <td>{CamposOtrasAtenciones.FechaCambio}</td>
                                            <td>{CamposOtrasAtenciones.ObservacionesUsuario}</td>
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
                        <h3>Detalles del Nodo</h3>
                        <div className='content-modal-details'>
                            <div className='content-details'>

                                <p style={{ color: '#fe0000' }}>{selectedNodo.OtraAtencion ? '⚠️⚠️ESTE NODO REQUIERE OTRO TIPO DE ATENCIÓN⚠️⚠️' : ''}</p> {/* Muestra si requiere atencion el nodo*/}
                                <p style={{ color: '#ff0000' }}>{selectedNodo.Atencion ? '⚠️⚠️ESTE NODO REQUIERE MANTENIMIENTO⚠️⚠️' : ''}</p> {/* Muestra si requiere atencion el nodo*/}
                                <p><strong>Ubicación:</strong> {selectedNodo.Ubicacion}</p> {/* Muestra la ubicación del nodo */}
                                <p><strong>Unidad:</strong> {selectedNodo.Unidad}</p> {/* Muestra la unidad del nodo */}
                                <p><strong>Categoría del Cable:</strong> {selectedNodo.CategoriaCable}</p> {/* Muestra la categoría del cable */}
                                <p><strong>Año de Instalación:</strong> {selectedNodo.AnioInstalacion}</p> {/* Muestra el año de instalación */}
                                <p><strong>Estado del Cable:</strong> {selectedNodo.EstadoCable}</p> {/* Muestra el estado del cable */}
                                <p><strong>Puerto:</strong> {selectedNodo.Puerto}</p> {/* Muestra el puerto */}
                                {/* Muestra el área */}
                                {!EstaVacio(selectedNodo.Area) && (
                                    <p><strong>Área:</strong> {selectedNodo.Area}</p>
                                )}
                                {/* Muestra la longitud */}
                                {!EstaVacio(selectedNodo.Longitud) && (
                                    <p><strong>Longitud:</strong> {selectedNodo.Longitud}</p>
                                )}
                                {/* Muestra la IP del nodo */}
                                {!EstaVacio(selectedNodo.IpSwitch) && (
                                    <p><strong>IP del Nodo:</strong> {selectedNodo.IpSwitch}</p>
                                )}
                                {/* Muestra las observaciones del nodo*/}
                                {!EstaVacio(selectedNodo.Observaciones) && (
                                    <p><strong>Observaciones:</strong> {selectedNodo.Observaciones}</p>
                                )}
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
                                                {selectedNodo.materiales.map((CamposMaterialesNecesarios, index) => ( // Mapea los materiales necesarios y los muestra
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
                        </div>

                        <br />

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
                        <br /><br />
                        <a href={selectedImage} target="_blank" rel="noopener noreferrer">
                            URL: {selectedImage}
                        </a>
                        <br /><br />
                        <Button onClick={() => setSelectedImage(null)} variant="outlined">Cerrar</Button> {/* Botón para cerrar el modal */}
                    </div>
                </div>
            )}

            {/* Modal de confirmación para eliminar */}
            {nodoToDelete && (
                <div
                    className="modal-overlay"
                    onClick={handleCloseModal} // Cierra el modal al hacer clic en el overlay
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                    > {/* Contenedor del modal */}
                        <h3>¿Estás seguro de eliminar este Nodo?</h3>
                        <p><strong>Ubicación:</strong> {nodoToDelete.Ubicacion}</p> {/* Muestra la ubicación del nodo */}
                        <p><strong>Unidad:</strong> {nodoToDelete.Unidad}</p> {/* Muestra la unidad del nodo */}
                        <p><strong>Categoría del Cable:</strong> {nodoToDelete.CategoriaCable}</p> {/* Muestra la categoría del cable */}
                        <p><strong>Año de Instalación:</strong> {nodoToDelete.AnioInstalacion}</p> {/* Muestra el año de instalación */}
                        <div>
                            <Button onClick={handleConfirmDelete} className='delete-button'>Sí, eliminar</Button> {/* Botón para confirmar la eliminación */}
                            <Button onClick={handleCloseModal} variant="outlined">Cancelar</Button> {/* Botón para cancelar la eliminación */}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para editar el nodo */}
            {nodoToEdit && (
                <div
                    className="modal-overlay"
                    onClick={handleCloseModal} // Cierra el modal al hacer clic en el overlay
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                    > {/* Contenedor del modal */}
                        <h3>Editar Nodo</h3>
                        <form>
                            {/* Campos del formulario */}
                            <div>
                                <label>Ubicación:</label>
                                <input
                                    name="Ubicacion" // Nombre del campo
                                    value={editFormData.Ubicacion || ''} // Valor del campo
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                />
                            </div>
                            <div>
                                <label>Unidad:</label>
                                <select
                                    name="Unidad" // Nombre del campo
                                    value={editFormData.Unidad || ''} // Valor del campo
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                >
                                    <option value="">Seleccione una unidad</option>
                                    {unidades.map((unidad) => ( // Mapear las unidades para mostrarlas en el select
                                        <option key={unidad.nombre} value={unidad.nombre}> {/* Opción de la unidad con su referencia */}
                                            {unidad.nombre} {/* Nombre de la unidad */}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>Categoría del Cable:</label>
                                <select
                                    name='CategoriaCable' // Nombre del campo
                                    value={editFormData.CategoriaCable || ''} // Valor del campo
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                >
                                    <option value=''>Seleccione una categoría</option> {/* Opción por defecto */}
                                    <option value='5'>Categoría 5</option> {/* Opciones de categoría */}
                                    <option value='5e'>Categoría 5e</option> {/* Opciones de categoría */}
                                    <option value='6'>Categoría 6</option> {/* Opciones de categoría */}
                                    <option value='6A'>Categoría 6A</option> {/* Opciones de categoría */}
                                </select>
                            </div>
                            <div>
                                <label>Año de Instalación:</label>
                                <input
                                    name="AnioInstalacion" // Nombre del campo
                                    type="number" // Tipo de campo
                                    min="0"
                                    max={new Date().getFullYear()} // Año actual
                                    value={editFormData.AnioInstalacion || '0'} // Valor del campo
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                />
                            </div>
                            <div>
                                <label>Estado del Cable:</label>
                                <select
                                    name='EstadoCable' // Nombre del campo
                                    value={editFormData.EstadoCable || ''} // Valor del campo
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                >
                                    <option value='Bueno'>Bueno</option> {/* Opciones de estado */}
                                    <option value='Regular'>Regular</option> {/* Opciones de estado */}
                                    <option value='Malo'>Malo</option> {/* Opciones de estado */}
                                </select>
                            </div>
                            <div>
                                <label>Puerto:</label>
                                <input
                                    name="Puerto" // Nombre del campo
                                    value={editFormData.Puerto || ''} // Valor del campo
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                />
                            </div>
                            <div>
                                <label>Área:</label>
                                <input
                                    name="Area" // Nombre del campo
                                    value={editFormData.Area || ''} // Valor del campo
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                />
                            </div>
                            <div>
                                <label>Longitud:</label>
                                <input
                                    name="Longitud" // Nombre del campo
                                    type="number"  // Tipo de dato
                                    min="0" // Valor mínimo
                                    step="0.01"   // Permite decimales
                                    value={editFormData.Longitud || 0}  // Valor por defecto 0
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                />
                            </div>
                            <div>
                                <label>IP del Nodo:</label>
                                <input
                                    name="IpSwitch" // Nombre del campo
                                    value={editFormData.IpSwitch || ''} // Valor del campo
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                />
                            </div>
                            <div>
                                <label>Nodos faltantes:</label>
                                <input
                                    name="Nodos_faltantes" // Nombre del campo
                                    type="number"  // Cambiado a type="number"
                                    min="0" // Valor mínimo
                                    value={editFormData.Nodos_faltantes || 0}  // Valor por defecto 0
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                />
                            </div>
                            <div>
                                <label>Observaciones:</label>
                                <textarea
                                    name="Observaciones" // Nombre del campo
                                    value={editFormData.Observaciones} // Valor del campo
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                    style={{ height: '65px', width: '99%', resize: 'none', borderRadius: '5px' }}
                                    required
                                />
                            </div>
                            <div>
                                <Tooltip title='Editar materiales del nodo'>
                                    <Button
                                        size="large"
                                        variant="contained"
                                        onClick={handleOpenMaterialesModal} // Abrir el modal de materiales
                                    >
                                        Materiales
                                    </Button>
                                </Tooltip>
                            </div>
                            <div>
                                <label>Requiere Mantenimiento:</label>
                                <input
                                    type="checkbox" // Tipo de campo
                                    name="Atencion" // Nombre del campo
                                    checked={editFormData.Atencion || false} // Valor del campo
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                    style={{ width: '40px', height: '40px' }}
                                />
                            </div>
                            <div>
                                <label>Requiere otro tipo de atención:</label>
                                <input
                                    type="checkbox" // Tipo de campo
                                    name="OtraAtencion" // Nombre del campo
                                    checked={editFormData.OtraAtencion || false} // Valor del campo
                                    onChange={handleEditFormChange} // Manejar cambios en el campo
                                    style={{ width: '40px', height: '40px' }}
                                />
                            </div>
                            <div>
                                <label>Agregar Nuevas Imágenes:</label>
                                <input
                                    type="file" // Tipo de campo
                                    name="newImages" // Nombre del campo
                                    multiple // Permitir la selección de múltiples archivos
                                    onChange={handleFileChange} // Guardar las nuevas imágenes en el estado
                                />
                            </div>
                            <div>
                                <h4>Imágenes Existentes:</h4>
                                <div className="image-grid">
                                    {editFormData.images && editFormData.images.length > 0 ? ( // Muestra las imágenes si hay
                                        editFormData.images.map((img, index) => {
                                            // Extraer el timestamp (últimos números antes de .png/.jpg)
                                            const fileName = img.ImagenURL.split('/').pop(); // Obtener "..._UNIDAD_1744139192838.png"
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
                                                <div key={index} className="image-item">
                                                    <div>
                                                        {img.ImagenURL.toLowerCase().includes('solventado') && (
                                                            <span style={{ color: 'green' }}>(Dentro de Solventado) </span>
                                                        ) || <span style={{ color: 'black' }}>(General) </span>}
                                                        <br></br>
                                                        {formattedDate}
                                                    </div>
                                                    <img
                                                        src={'http://localhost:5000' + img.ImagenURL}
                                                        alt={`Imagen ${index + 1}`}
                                                        className="image-thumbnail"
                                                    />
                                                    <Button
                                                        onClick={() => handleDeleteImage(img.Id)} // Eliminar la imagen
                                                        className='delete-button'
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            );
                                        })
                                    ) : ( // Si no hay imágenes
                                        <p>No hay imágenes disponibles.</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Button variant="contained" onClick={handleSaveChanges} style={{ marginRight: '10px' }}> {/* Guardar los cambios */}
                                    Guardar Cambios
                                </Button>
                                <Button variant="outlined" onClick={handleCloseModal}> {/* Cancelar la edición */}
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para ingresar observaciones (showObservacionesModal) */}
            {showObservacionesModal && (
                <div
                    className="modal-overlay"
                    onClick={() => {
                        // Revertir el cambio si el usuario cancela
                        setEditFormData({
                            ...editFormData,
                            [campoCambiado]: !editFormData[campoCambiado],
                        });
                        setShowObservacionesModal(false);
                    }}
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                    > {/* Contenedor del modal */}
                        <h3>Motivos del cambio del estado</h3>
                        <div>
                            <textarea
                                placeholder="Ingrese los motivos del cambio de estado..."
                                value={observacionesUsuario} // Valor del campo
                                onChange={(e) => setObservacionesUsuario(e.target.value)} // Manejar cambios en el campo
                                style={{ height: '128px', width: '600px', resize: 'none', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label>Agregar Nuevas Imágenes:</label>
                            <input
                                type="file" // Tipo de campo
                                name="newImagesAtencion" // Nombre del campo
                                multiple // Permitir la selección de múltiples archivos
                                onChange={handleFileChange} // Guardar las nuevas imágenes en el estado
                            />
                        </div>
                        <div>
                            <Button
                                variant="contained"
                                style={{ marginRight: '10px' }}
                                onClick={async () => {
                                    // Crear un FormData para enviar las observaciones y las imágenes
                                    const formData = new FormData();
                                    formData.append('Ubicacion', editFormData.Ubicacion); // Agrega los datos del formulario al objeto FormData
                                    formData.append('Unidad', editFormData.Unidad); // Agrega los datos del formulario al objeto FormData
                                    formData.append('atencion', editFormData.Atencion ? 1 : 0); // Estado de Atencion
                                    formData.append('otraAtencion', editFormData.OtraAtencion ? 1 : 0); // Estado de OtraAtencion
                                    formData.append('observacionesUsuario', observacionesUsuario);
                                    formData.append('esAtencionParcialMante', false);
                                    formData.append('esAtencionParcialOtro', false);
                                    newImageFiles.forEach((file) => { // Agregar cada archivo al FormData
                                        formData.append('newImagesAtencion', file);
                                    });

                                    try {
                                        // Enviar los datos al backend
                                        await axios.put(
                                            `http://localhost:5000/api/nodos/updateAtencion/${nodoToEdit.Id}`,
                                            formData,
                                            {
                                                headers: {
                                                    'Content-Type': 'multipart/form-data',
                                                },
                                            }
                                        );
                                        setNewImageFiles([]); // Limpiar el estado de las nuevas imágenes
                                        handleSaveChangesAtenciones(); // Guardar los cambios
                                        fetchNewNodos(); // Actualizar la lista de nodos
                                    } catch (error) {
                                        console.error('Error al guardar los cambios:', error);
                                        alert('Error al guardar los cambios');
                                    }
                                }}
                            >
                                Confirmar
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    // Revertir el cambio si el usuario cancela
                                    setEditFormData({
                                        ...editFormData,
                                        [campoCambiado]: !editFormData[campoCambiado],
                                    });
                                    setShowObservacionesModal(false);
                                }}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para ingresar observaciones (showObservacionesModalTable) */}
            {showObservacionesModalTable && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowObservacionesModalTable(false)} // Cierra el modal al hacer clic en el overlay
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                    > {/* Contenedor del modal */}
                        <h3>Motivos del cambio</h3>
                        <div>
                            <textarea
                                placeholder="Ingrese los motivos del cambio..."
                                value={observacionesUsuario} // Valor del campo
                                onChange={(e) => setObservacionesUsuario(e.target.value)} // Manejar cambios en el campo
                                style={{ height: '128px', width: '600px', resize: 'none', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label>Agregar Nuevas Imágenes:</label>
                            <input
                                type="file" // Tipo de campo
                                name="newImages" // Nombre del campo
                                multiple // Permitir la selección de múltiples archivos
                                onChange={handleFileChange} // Guardar las nuevas imágenes en el estado
                            />
                        </div>
                        <div>
                            <Button
                                variant="contained"
                                style={{ marginRight: '10px' }}
                                onClick={async () => {
                                    // Crear un FormData para enviar las observaciones y las imágenes
                                    const formData = new FormData();
                                    formData.append('esAtencionParcialMante', false);
                                    formData.append('esAtencionParcialOtro', false);
                                    if (tipoAtencion === 'Atencion') {
                                        formData.append('Ubicacion', selectedAtencionNodo.Ubicacion); // Agrega los datos del formulario al objeto FormData
                                        formData.append('Unidad', selectedAtencionNodo.Unidad); // Agrega los datos del formulario al objeto FormData
                                    } else {
                                        formData.append('Ubicacion', selectedOtherAtencionNodo.Ubicacion); // Agrega los datos del formulario al objeto FormData
                                        formData.append('Unidad', selectedOtherAtencionNodo.Unidad); // Agrega los datos del formulario al objeto FormData
                                    }
                                    formData.append('observacionesUsuario', observacionesUsuario);
                                    newImageFiles.forEach((file) => { // Agregar cada archivo al FormData
                                        formData.append('newImages', file);
                                    });

                                    // Determinar la API a la que se enviarán los datos
                                    const endpoint = tipoAtencion === 'Atencion'
                                        ? `http://localhost:5000/api/nodos/atencion/${selectedAtencionNodo.Id}`
                                        : `http://localhost:5000/api/nodos/otraAtencion/${selectedOtherAtencionNodo.Id}`;

                                    try {
                                        // Enviar los datos al backend
                                        await axios.put(endpoint, formData, {
                                            headers: {
                                                'Content-Type': 'multipart/form-data',
                                            },
                                        });

                                        alert(`${tipoAtencion === 'Atencion' ? 'Mantenimiento' : 'Otra atención'} eliminada`);
                                        setNewImageFiles([]); // Limpiar el estado de las nuevas imágenes
                                        handleCloseModal(false); // Cerrar el modal
                                        fetchNewNodos(); // Actualizar la lista de nodos
                                    } catch (error) {
                                        console.error(`Error al eliminar ${tipoAtencion === 'el mantenimiento' ? 'atención' : 'otra atención'}:`, error);
                                        alert(`Error al eliminar ${tipoAtencion === 'Atencion' ? 'el mantenimiento' : 'otra atención'}`);
                                    }
                                }}
                            >
                                Confirmar
                            </Button>
                            <Button onClick={() => setShowObservacionesModalTable(false)} variant="outlined">Cancelar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para ingresar observaciones (showObservacionesModalTable) */}
            {showObservacionesModalParcialTable && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowObservacionesModalParcialTable(false)} // Cierra el modal al hacer clic en el overlay
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                    > {/* Contenedor del modal */}
                        <h3>Solventado Parcialmente</h3>
                        <div>
                            <textarea
                                placeholder="Ingrese los cambios solventados en el nodo..."
                                value={observacionesUsuario} // Valor del campo
                                onChange={(e) => setObservacionesUsuario(e.target.value)} // Manejar cambios en el campo
                                style={{ height: '128px', width: '600px', resize: 'none', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label>Agregar Nuevas Imágenes:</label>
                            <input
                                type="file" // Tipo de campo
                                name="newImages" // Nombre del campo
                                multiple // Permitir la selección de múltiples archivos
                                onChange={handleFileChange} // Guardar las nuevas imágenes en el estado
                            />
                        </div>
                        <div>
                            <Button
                                variant="contained"
                                style={{ marginRight: '10px' }}
                                onClick={async () => {
                                    // Crear un FormData para enviar las observaciones y las imágenes
                                    const formData = new FormData();
                                    if (tipoAtencion === 'Atencion') {
                                        formData.append('Ubicacion', selectedAtencionNodo.Ubicacion); // Agrega los datos del formulario al objeto FormData
                                        formData.append('Unidad', selectedAtencionNodo.Unidad); // Agrega los datos del formulario al objeto FormData
                                        formData.append('atencion', selectedAtencionNodo.Atencion ? 1 : 1); // Estado de Atencion
                                        formData.append('otraAtencion', selectedAtencionNodo.OtraAtencion ? 1 : 0); // Estado de OtraAtencion
                                        formData.append('esAtencionParcialMante', true);
                                        formData.append('esAtencionParcialOtro', false);
                                    } else {
                                        formData.append('Ubicacion', selectedOtherAtencionNodo.Ubicacion); // Agrega los datos del formulario al objeto FormData
                                        formData.append('Unidad', selectedOtherAtencionNodo.Unidad); // Agrega los datos del formulario al objeto FormData
                                        formData.append('atencion', selectedOtherAtencionNodo.Atencion ? 1 : 0); // Estado de Atencion
                                        formData.append('otraAtencion', selectedOtherAtencionNodo.OtraAtencion ? 1 : 1); // Estado de OtraAtencion
                                        formData.append('esAtencionParcialMante', false);
                                        formData.append('esAtencionParcialOtro', true);
                                    }

                                    formData.append('observacionesUsuario', observacionesUsuario);
                                    newImageFiles.forEach((file) => { // Agregar cada archivo al FormData
                                        formData.append('newImagesAtencion', file);
                                    });
                                    try {
                                        // Enviar los datos al backend
                                        if (tipoAtencion === 'Atencion') {
                                            await axios.put(
                                                `http://localhost:5000/api/nodos/updateAtencion/${selectedAtencionNodo.Id}`,
                                                formData,
                                                {
                                                    headers: {
                                                        'Content-Type': 'multipart/form-data',
                                                    },
                                                }
                                            );
                                        } else {
                                            await axios.put(
                                                `http://localhost:5000/api/nodos/updateAtencion/${selectedOtherAtencionNodo.Id}`,
                                                formData,
                                                {
                                                    headers: {
                                                        'Content-Type': 'multipart/form-data',
                                                    },
                                                }
                                            );
                                        }
                                        alert(`${tipoAtencion === 'Atencion' ? 'Mantenimiento parcialmente solucionado' : 'Otra atención parcialmente solucionada'}`);
                                        setNewImageFiles([]); // Limpiar el estado de las nuevas imágenes
                                        handleCloseModal(); // Cerrar el modal
                                    } catch (error) {
                                        console.error(`Error al solventar parcialmente la ${tipoAtencion === 'Atencion' ? 'mantenimiento' : 'otra atención'}:`, error);
                                        alert(`Error al solventar parcialmente ${tipoAtencion === 'Atencion' ? 'mantenimiento' : 'otra atención'}`);
                                    }
                                }}
                            >
                                Confirmar
                            </Button>
                            <Button onClick={() => setShowObservacionesModalParcialTable(false)} variant="outlined">Cancelar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para editar materiales */}
            {showMaterialesModal && nodoToEdit && ( // Verifica si el modal de materiales debe mostrarse
                <div
                    className="modal-overlay"
                    onClick={() => setShowMaterialesModal(false)} // Cierra el modal al hacer clic en el overlay
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                        style={{ maxWidth: '1100px', maxHeight: '80vh', overflowY: 'auto' }}
                    > {/* Contenedor del modal */}
                        <h3>Editar Materiales del Nodo</h3>
                        <div>
                            <TextField
                                label="Buscar material"
                                variant="outlined"
                                size="small"
                                value={pagination.searchTerm}
                                onChange={(e) => setPagination({ ...pagination, searchTerm: e.target.value, page: 0 })}
                                style={{ width: '300px', height: '50px' }}
                            />

                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <TablePagination
                                    component="div"
                                    count={filteredMaterials.length}
                                    page={pagination.page}
                                    onPageChange={(_, newPage) => setPagination({ ...pagination, page: newPage })}
                                    rowsPerPage={pagination.rowsPerPage}
                                    onRowsPerPageChange={(e) => setPagination({
                                        ...pagination,
                                        rowsPerPage: parseInt(e.target.value, 10),
                                        page: 0
                                    })}
                                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                                    labelRowsPerPage="Materiales por página:"
                                />
                            </div>
                        </div>
                        <div style={{ margin: '20px 0' }}>
                            <List>
                                {paginatedMaterials.map((material) => ( // Mapea los materiales y los muestra
                                    <ListItem
                                        key={material.Id} // Clave única para cada material
                                        divider // Divisor entre los materiales
                                        style={{
                                            backgroundColor: material.editado ? '#f0f8ff' : 'inherit'
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <>
                                                    {material.Nombre} {/* Nombre del material */}
                                                    {material.editado && ( // Muestra un mensaje si el material ha sido editado
                                                        <span style={{
                                                            marginLeft: '10px',
                                                            color: '#1976d2',
                                                            fontSize: '0.8rem'
                                                        }}>
                                                            (editado)
                                                        </span>
                                                    )}
                                                </>
                                            }
                                            secondary={`${material.UnidadMedida} - ${material.Categoria}`} // Muestra la unidad de medida 
                                            style={{ flex: '1 1 200px' }}
                                        />

                                        <div style={{ display: 'flex', gap: '20px', marginLeft: '20px' }}>
                                            <TextField
                                                label="Necesarios"
                                                type="number" // Tipo de campo
                                                inputProps={{
                                                    min: 0, // Valor mínimo
                                                    step: material.UnidadMedida === 'piezas' ? 1 : 0.01, // Paso del campo
                                                    pattern: material.UnidadMedida === 'piezas' ? '\\d*' : null // Patrón para aceptar sólo números enteros
                                                }}
                                                value={material.Necesarios} // Valor del campo
                                                onChange={(e) => {
                                                    // Validación en tiempo real para piezas
                                                    if (material.UnidadMedida === 'piezas') {
                                                        const regex = /^[0-9]*$/;
                                                        if (regex.test(e.target.value) || e.target.value === '') {
                                                            handleMaterialChange(
                                                                material.Id,
                                                                'Necesarios',
                                                                e.target.value,
                                                                material.UnidadMedida
                                                            ); // Manejar cambios en el campo
                                                        }
                                                    } else {
                                                        handleMaterialChange(
                                                            material.Id,
                                                            'Necesarios',
                                                            e.target.value,
                                                            material.UnidadMedida
                                                        ); // Manejar cambios en el campo
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    // Asegurar valor mínimo al perder foco
                                                    if (e.target.value === '') {
                                                        handleMaterialChange(
                                                            material.Id,
                                                            'Necesarios',
                                                            0,
                                                            material.UnidadMedida
                                                        ); // Manejar cambios en el campo
                                                    }
                                                }}
                                                style={{ width: '120px' }}
                                            />

                                            <TextField
                                                label="Utilizados"
                                                type="number"
                                                inputProps={{
                                                    min: 0, // Valor mínimo
                                                    step: material.UnidadMedida === 'piezas' ? 1 : 0.01, // Paso del campo
                                                    pattern: material.UnidadMedida === 'piezas' ? '\\d*' : null // Patrón para aceptar sólo números enteros
                                                }}
                                                value={material.Utilizados} // Valor del campo
                                                onChange={(e) => {
                                                    // Validación en tiempo real para piezas
                                                    if (material.UnidadMedida === 'piezas') {
                                                        const regex = /^[0-9]*$/;
                                                        if (regex.test(e.target.value) || e.target.value === '') {
                                                            handleMaterialChange(
                                                                material.Id,
                                                                'Utilizados',
                                                                e.target.value,
                                                                material.UnidadMedida
                                                            ); // Manejar cambios en el campo
                                                        }
                                                    } else {
                                                        handleMaterialChange(
                                                            material.Id,
                                                            'Utilizados',
                                                            e.target.value,
                                                            material.UnidadMedida
                                                        ); // Manejar cambios en el campo
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    // Asegurar valor mínimo al perder foco
                                                    if (e.target.value === '') {
                                                        handleMaterialChange(
                                                            material.Id,
                                                            'Utilizados',
                                                            0,
                                                            material.UnidadMedida
                                                        ); // Manejar cambios en el campo
                                                    }
                                                }}
                                                style={{ width: '120px' }}
                                            />
                                        </div>
                                    </ListItem>
                                ))}
                                {filteredMaterials.length === 0 && (
                                    <Typography style={{ padding: '16px', textAlign: 'center' }}>
                                        No se encontraron materiales
                                    </Typography>
                                )}
                            </List>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSaveMateriales} // Guardar los cambios en los materiales
                            >
                                Guardar Materiales
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={() => setShowMaterialesModal(false)} // Cerrar el modal de materiales
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NodeTable; // Exporta el componente NodeTable