import { useState, useEffect } from 'react'; // Importar las funciones useState y useEffect
import axios from 'axios'; // Importar axios para realizar peticiones HTTP
import { Button, Tooltip, TextField, ListItemText, ListItem, List, Select, MenuItem } from '@mui/material';
import UnidadesModal from './UnidadesModal';

const NodeFrom = ({ onAddNodo }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ // Estado para almacenar los datos del formulario
        Ubicacion: '',
        Unidad: '',
        CategoriaCable: '',
        AnioInstalacion: '',
        EstadoCable: '',
        Puerto: '',
        Area: '',
        Longitud: '',
        IpSwitch: '',
        Observaciones: '',
        Atencion: false, // Valor inicial del checkbox
        OtraAtencion: false, // Valor inicial del checkbox
        Referencia: '',
        Nodos_faltantes: '',
    });
    const [materialesSeleccionados, setMaterialesSeleccionados] = useState([]);
    const [materialActual, setMaterialActual] = useState({
        id: '',
        cantidad: 1
    });
    const [materiales, setMateriales] = useState([]);
    const [imageFiles, setImageFiles] = useState([]); // Estado para almacenar los archivos de imágenes
    const [unidades, setUnidades] = useState([]); // Estado para almacenar las unidades
    const [showObservacionesModal, setShowObservacionesModal] = useState(false); // 
    const [showMaterialesModal, setShowMaterialesModal] = useState(false); // 
    const [observacionesUsuario, setObservacionesUsuario] = useState(''); // 
    const [campoCambiado, setCampoCambiado] = useState(''); // Para saber si el cambio fue en Atencion o OtraAtencion
    const [showObservacionesDestinoModal, setShowObservacionesDestinoModal] = useState(false);
    const [observacionDestino, setObservacionDestino] = useState(''); // 'mantenimiento', 'otro', 'ambos'
    const [observacionEditada, setObservacionEditada] = useState(false);
    const [observacionAnterior, setObservacionAnterior] = useState('');
    const [showUnidadesModal, setShowUnidadesModal] = useState(false);

    const fetchUnidades = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/nodos/unidades'); // Hacer una petición GET a la API
            setUnidades(response.data); // Almacenar las unidades en el estado
        } catch (error) {
            console.error('Error al obtener las unidades:', error);
        }
    };

    // Obtener las unidades al cargar el componente
    useEffect(() => {

        const fetchMateriales = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/nodos/materiales'); // Hacer una petición GET a la API

                setMateriales(response.data.materiales || response.data); // Almacenar los materiales en el estado
            } catch (error) {
                console.log('Error al obtener los materiales: ', error);
            }
        };

        fetchMateriales(); // Llamar a la función para obtener los materiales
        fetchUnidades(); // Llamar a la función para obtener las unidades
    }, []);

    // Manejar cambio de material seleccionado
    const handleMaterialChange = (e) => {
        setMaterialActual({
            ...materialActual,
            id: e.target.value
        });
    };

    // Manejar cambio de cantidad
    const handleCantidadChange = (e) => {
        const materialSeleccionado = materiales.find(m => m.Id === materialActual.id);
        const esPiezas = materialSeleccionado?.UnidadMedida === 'piezas';
        let valor = e.target.value;

        // Validar que si es piezas, sea número entero
        if (esPiezas) {
            valor = Math.floor(Number(valor)); // Forzar número entero
            if (valor < 1) valor = 1; // Mínimo 1 pieza
        }

        setMaterialActual({
            ...materialActual,
            cantidad: valor
        });
    };

    // Añadir material a la lista
    const agregarMaterial = () => {
        if (!materialActual.id) return;

        const material = materiales.find(m => m.Id === materialActual.id);
        if (!material) return;

        // Verificar si el material ya está en la lista
        const existe = materialesSeleccionados.some(m => m.id === materialActual.id);
        if (existe) {
            alert('Este material ya fue agregado');
            return;
        }

        // Validar cantidad para piezas
        if (material.UnidadMedida === 'piezas' && !Number.isInteger(Number(materialActual.cantidad))) {
            alert('Para materiales en piezas, la cantidad debe ser un número entero');
            return;
        }

        setMaterialesSeleccionados([
            ...materialesSeleccionados,
            {
                id: materialActual.id,
                nombre: material.Nombre,
                cantidad: materialActual.cantidad,
                unidad: material.UnidadMedida
            }
        ]);

        // Resetear selección
        setMaterialActual({
            id: '',
            cantidad: 1
        });
    };

    // Eliminar material de la lista
    const eliminarMaterial = (id) => {
        setMaterialesSeleccionados(
            materialesSeleccionados.filter(m => m.id !== id)
        );
    };

    // Modificar el TextField de cantidad para que cambie según la unidad
    const renderCantidadInput = () => {
        const materialSeleccionado = materiales.find(m => m.Id === materialActual.id);
        const esPiezas = materialSeleccionado?.UnidadMedida === 'piezas';

        return (
            <TextField
                type="number"
                label="Cantidad"
                value={materialActual.cantidad}
                onChange={handleCantidadChange}
                inputProps={{
                    min: 0.1,
                    step: esPiezas ? 1 : 0.1 // Paso diferente según unidad
                }}
                style={{ width: '120px' }}
                error={esPiezas && !Number.isInteger(Number(materialActual.cantidad))}
            />
        );
    };

    // Manejar cambios en los campos del formulario
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target; // Obtener el nombre, valor y tipo del campo
        if (name === 'Unidad') {
            const unidadSeleccionada = unidades.find(u => u.nombre === value); // Almacena los datos de la unidad almacenada
            setFormData({
                ...formData, // Datos del formulario
                Unidad: value, // Registra el nombre de la unidad
                Referencia: unidadSeleccionada ? unidadSeleccionada.ref : '' // Registra la referencia de la unidad
            });
            return;
        }

        // Si el campo es Atencion o OtraAtencion, mostrar la modal de observaciones
        if (type === 'checkbox' && checked) { //corroborar que el checkbox este seleccionado (true)
            if (name === 'Atencion' || name === 'OtraAtencion') {
                setCampoCambiado(name); // Guardar el campo que se está cambiando
                setShowObservacionesModal(true); // Mostrar la modal de observaciones
            }
        }

        // Para el campo Observaciones
        if (name === 'Observaciones') {
            // Si el campo está siendo editado (no es la primera vez)
            if (observacionEditada && value === '') {
                // Si el usuario borra todas las observaciones, resetear los campos relacionados
                setFormData({
                    ...formData,
                    Observaciones: '',
                    Atencion: false,
                    OtraAtencion: false,
                    ObservacionesUsuarioAtencion: '',
                    ObservacionesUsuarioOtraAtencion: ''
                });
                setObservacionEditada(false);
                return;
            }

            // Actualizar el valor normalmente
            setFormData({
                ...formData,
                [name]: value
            });

            return;
        }

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value, // Actualizar el valor del checkbox
        });
    };

    // Manejar cuando el campo Observaciones pierde el foco
    const handleObservacionesBlur = () => {
        // Solo mostrar el modal si hay texto y no es una edición de texto existente
        if (formData.Observaciones.trim() !== '' && !observacionEditada) {
            setObservacionesUsuario(formData.Observaciones);
            setObservacionAnterior(formData.Observaciones);
            setShowObservacionesDestinoModal(true);
            setObservacionEditada(true);
        }
    };

    // Función para manejar la selección de destino de las observaciones
    const handleObservacionDestino = (destino) => {
        // Actualizar el estado del formulario según el destino seleccionado
        const newFormData = { ...formData };

        if (destino === 'mantenimiento') {
            newFormData.Atencion = true;
            newFormData.ObservacionesUsuarioAtencion = observacionesUsuario;
        } else if (destino === 'otro') {
            newFormData.OtraAtencion = true;
            newFormData.ObservacionesUsuarioOtraAtencion = observacionesUsuario;
        } else if (destino === 'ambos') {
            newFormData.Atencion = true;
            newFormData.OtraAtencion = true;
            newFormData.ObservacionesUsuarioAtencion = observacionesUsuario;
            newFormData.ObservacionesUsuarioOtraAtencion = observacionesUsuario;
        }

        setFormData(newFormData);
        setShowObservacionesDestinoModal(false);
    };

    // Manejar cambios en la selección de archivos
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        // Filtrar archivos duplicados por nombre y tamaño
        const uniqueFiles = files.reduce((acc, file) => {
            const isDuplicate = acc.some(
                f => f.name === file.name && f.size === file.size
            );
            if (!isDuplicate) {
                acc.push(file);
            }
            return acc;
        }, []);

        setImageFiles(uniqueFiles);
    };

    // Manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const longitud = parseFloat(formData.Longitud) || 0; // Convertir a valor decimal

        // Validar si Atencion y OtraAtencion es true
        const atencionValue = formData.Atencion ? 1 : 0; // Convertir el valor del checkbox a 1 o 0
        const otherAtencionValue = formData.OtraAtencion ? 1 : 0; // Convertir el valor del checkbox a 1 o 0
        // Crear un FormData para enviar los datos y las imágenes
        const formDataToSend = new FormData(); // Crear un nuevo FormData
        formDataToSend.append('Ubicacion', formData.Ubicacion); // Agregar los datos del formulario al FormData
        formDataToSend.append('Unidad', formData.Unidad); // Agregar los datos del formulario al FormData
        formDataToSend.append('CategoriaCable', formData.CategoriaCable); // Agregar los datos del formulario al FormData
        formDataToSend.append('AnioInstalacion', formData.AnioInstalacion); // Agregar los datos del formulario al FormData
        formDataToSend.append('EstadoCable', formData.EstadoCable); // Agregar los datos del formulario al FormData
        formDataToSend.append('Puerto', formData.Puerto); // Agregar los datos del formulario al FormData
        formDataToSend.append('Area', formData.Area); // Agregar los datos del formulario al FormData
        formDataToSend.append('Longitud', longitud); // Agregar los datos del formulario al FormData
        formDataToSend.append('IpSwitch', formData.IpSwitch); // Agregar los datos del formulario al FormData
        formDataToSend.append('Observaciones', formData.Observaciones); // Agregar los datos del formulario al FormData
        formDataToSend.append('Atencion', atencionValue); // Enviar el valor correcto del checkbox
        formDataToSend.append('OtraAtencion', otherAtencionValue); // Enviar el valor correcto del checkbox
        formDataToSend.append('Referencia', formData.Referencia); // Agregar los datos del formulario al FormData
        formDataToSend.append('Nodos_faltantes', formData.Nodos_faltantes); // Agregar los datos del formulario al FormData
        // Agregar las observaciones del usuario (si existen)
        if (formData.ObservacionesUsuarioAtencion) {
            formDataToSend.append('ObservacionesUsuarioAtencion', formData.ObservacionesUsuarioAtencion);
        }
        if (formData.ObservacionesUsuarioOtraAtencion) {
            formDataToSend.append('ObservacionesUsuarioOtraAtencion', formData.ObservacionesUsuarioOtraAtencion);
        }

        // Agregar materiales al FormData
        materialesSeleccionados.forEach((material, index) => {
            formDataToSend.append(`materialesUtilizados[${index}][id]`, material.id);
            formDataToSend.append(`materialesUtilizados[${index}][necesarios]`, material.cantidad);
        });

        // Agregar las imágenes al FormData (si hay imágenes seleccionadas)
        if (imageFiles.length > 0) {
            imageFiles.forEach((file) => {
                formDataToSend.append('images', file); // 'images' es el nombre del campo que Multer espera
            });
        }

        try {
            // Enviar los datos al backend
            const response = await axios.post('http://localhost:5000/api/nodos', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Especificar el tipo de contenido
                },
            });
            alert('Nodo registrado'); // Mostrar un mensaje de éxito

            // Limpiar el formulario
            setFormData({
                Ubicacion: '',
                Unidad: '',
                CategoriaCable: '',
                AnioInstalacion: '',
                EstadoCable: '',
                Puerto: '',
                Area: '',
                Longitud: '',
                IpSwitch: '',
                Observaciones: '',
                Atencion: false, // Reiniciar el checkbox
                OtraAtencion: false, // Reiniciar el checkbox
                Referencia: '',
                Nodos_faltantes: '',
            });
            setMateriales([]);
            setMaterialActual([]);
            setMaterialesSeleccionados([]);
            setObservacionesUsuario(''); //Limpiar las observaciones
            setImageFiles([]); // Limpiar las imágenes seleccionadas

            // Actualizar la lista de nodos
            if (onAddNodo) {
                await onAddNodo(); // Asegúrate de esperar la actualización
            }
        } catch (error) {
            console.error('Error al crear el nodo:', error);
            alert('Error al crear el nodo');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Función para verificar si un campo (array) está vacío
    const EstaVacio = (dato) => {
        // console.log(dato,' - ',dato.length);
        if (dato.length == 0) {
            return true;
        } else {
            return false;
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit}> {/* Agregar el manejador de envío del formulario */}
                <h2>Registrar Nuevo Nodo</h2>
                {/* Campos del formulario */}
                <div>
                    <label>Unidad:</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select
                            name="Unidad" // Nombre del campo
                            value={formData.Unidad} // Valor del campo
                            onChange={handleChange} // Manejar cambios en el campo
                            required // Campo requerido
                            style={{ flexGrow: 1 }}
                        >
                            <option value="">Seleccione una unidad</option> {/* Opción por defecto */}
                            {unidades.map((unidad) => ( // Mapear las unidades para mostrarlas en el select
                                <option key={unidad.nombre} value={unidad.nombre}> {/* Opción de la unidad con su referencia */}
                                    {unidad.nombre} {/* Nombre de la unidad */}
                                </option>
                            ))}
                        </select>
                        <Button variant="outlined" size="small" onClick={() => setShowUnidadesModal(true)}>
                            Gestionar
                        </Button>
                    </div>
                </div>
                <div>
                    <label>Ubicación:</label>
                    <input
                        style={{ width: '100%' }}
                        name="Ubicacion" // Nombre del campo
                        value={formData.Ubicacion} // Valor del campo
                        onChange={handleChange} // Manejar cambios en el campo
                        label="Ubicación del nodo"
                        placeholder='Ingresa la ubicación del nodo'
                    />
                </div>
                <div>
                    <label>IP del Switch:</label>
                    <input
                        name="IpSwitch" // Nombre del campo
                        value={formData.IpSwitch} // Valor del campo
                        onChange={handleChange} // Manejar cambios en el campo
                        required // Campo requerido
                        placeholder="Ingresa la dirección IP del Switch"
                    />
                </div>
                <div>
                    <label>Puerto:</label>
                    <input
                        name="Puerto" // Nombre del campo
                        value={formData.Puerto} // Valor del campo
                        onChange={handleChange} // Manejar cambios en el campo
                        required // Campo requerido
                        placeholder="Ingresa el puerto al que esta conectado el cable"
                    />
                </div>
                <div>
                    <label>Longitud:</label>
                    <input
                        name="Longitud" // Nombre del campo
                        type="number" // Tipo de campo
                        min="0" // Valor mínimo
                        step="0.01"   // Permite decimales
                        value={formData.Longitud || '0'} // Valor del campo
                        onChange={handleChange} // Manejar cambios en el campo
                        //required // Campo requerido
                        placeholder="Ingresa la longitud de su cable"
                    />
                </div>
                <div>
                    <label>Área:</label>
                    <input
                        name="Area" // Nombre del campo
                        value={formData.Area} // Valor del campo
                        placeholder='Ingresa el área del nodo'
                        onChange={handleChange} // Manejar cambios en el campo
                    />
                </div>
                <div>
                    <label>Categoría del Cable:</label>
                    <select
                        name='CategoriaCable' // Nombre del campo
                        value={formData.CategoriaCable || ''} // Valor del campo
                        onChange={handleChange} // Manejar cambios en el campo
                        required // Campo requerido
                    >
                        <option value='Sin categoría'>Seleccione una categoría</option> {/* Opción por defecto */}
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
                        value={formData.AnioInstalacion || '0'} // Valor del campo
                        onChange={handleChange} // Manejar cambios en el campo
                        //required // Campo requerido
                        placeholder="Ingresa el año de instalación del nodo"
                    />
                </div>
                <div>
                    <label>Estado del Cable:</label>
                    <select
                        name='EstadoCable' // Nombre del campo
                        value={formData.EstadoCable || ''} // Valor del campo
                        onChange={handleChange} // Manejar cambios en el campo
                        required // Campo requerido
                    >
                        <option value='Sin estado'>Seleccione un estado</option> {/* Opción por defecto */}
                        <option value='Bueno'>Bueno</option> {/* Opciones de estado */}
                        <option value='Regular'>Regular</option> {/* Opciones de estado */}
                        <option value='Malo'>Malo</option> {/* Opciones de estado */}
                    </select>
                </div>
                <div>
                    <label>Nodos faltantes:</label>
                    <input
                        name="Nodos_faltantes" // Nombre del campo
                        type="number" // Tipo de campo
                        min="0"
                        max="99999"
                        value={formData.Nodos_faltantes || '0'} // Valor del campo
                        onChange={handleChange} // Manejar cambios en el campo
                        required // Campo requerido
                        placeholder="Ingresa el número de nodos faltantes"
                    />
                </div>
                <div>
                    <label>Observaciones:</label>
                    <textarea
                        name="Observaciones"
                        value={formData.Observaciones} // Valor del campo
                        onChange={handleChange} // Manejar cambios en el campo
                        onBlur={handleObservacionesBlur}
                        style={{ height: '65px', width: '99%', resize: 'none', borderRadius: '5px' }}
                        placeholder="Ingresa las observaciones del nodo"
                    //required
                    />
                </div>
                <div>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '10px' }}>
                        Requiere mantenimiento
                        <input
                            style={{ width: '20px', height: '20px' }}
                            type="checkbox" // Tipo de campo
                            name="Atencion" // Nombre del campo
                            value={formData.Atencion} // Valor actual del checkbox
                            onChange={handleChange} // Manejar cambios en el checkbox
                        />
                    </label>
                </div>
                <div>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '10px' }}>
                        Requiere otro tipo de atención
                        <input
                            style={{ width: '20px', height: '20px' }}
                            type="checkbox" // Tipo de campo
                            name="OtraAtencion" // Nombre del campo
                            value={formData.OtraAtencion} // Valor actual del checkbox
                            onChange={handleChange} // Manejar cambios en el checkbox
                        />
                    </label>
                </div>
                <div>
                    <br />
                    <Tooltip title='Registrar materiales para el nodo'>
                        <Button
                            size="large"
                            variant="contained"
                            onClick={() => (setShowMaterialesModal(true))}
                        >
                            Agregar materiales necesarios
                        </Button>
                    </Tooltip>
                    {/* Mostrar resumen de materiales seleccionados */}
                    {materialesSeleccionados.length > 0 && (
                        <div style={{ margin: '10px 0', padding: '10px', border: '1px solid #ddd' }}>
                            <h4>Materiales a solicitar:</h4>
                            <List>
                                {materialesSeleccionados.map(material => (
                                    <ListItem
                                        key={material.id}
                                        secondaryAction={
                                            <Button onClick={() => eliminarMaterial(material.id)} style={{ backgroundColor: 'red', color: 'white' }}>
                                                Eliminar
                                            </Button>
                                        }
                                    >
                                        <ListItemText
                                            primary={`${material.nombre}`}
                                            secondary={`${material.cantidad} ${material.unidad}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </div>
                    )}
                    <br />
                    <br />
                </div>
                <div>
                    <label>Imágenes:</label>
                    <input
                        type="file" // Tipo de campo
                        name="images" // Nombre del campo
                        multiple // Permitir la selección de múltiples archivos
                        onChange={handleFileChange} // Manejar cambios en la selección de archivos
                    />
                </div>
                {!EstaVacio(imageFiles) && (
                    <div>
                        <h4>Imágenes Seleccionadas:</h4>
                        <ul>
                            {imageFiles.map((file, index) => ( // Mostrar los archivos seleccionados
                                <li key={index}> {/* Clave única para cada archivo */}
                                    {file.name} {/* Mostrar el nombre del archivo */}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <Tooltip title='Registrar nuevo nodo'>
                    <Button
                        size="large"
                        variant="contained"
                        type="submit"
                    >
                        Registrar
                    </Button> {/* Botón para enviar el formulario */}
                </Tooltip>

                {/* Modal para seleccionar destino de las observaciones */}
                {showObservacionesDestinoModal && (
                    <div
                        className="modal-overlay"
                        onClick={() => {
                            setShowObservacionesDestinoModal(false);
                            // Revertir a la observación anterior si el usuario cancela
                            setFormData({
                                ...formData,
                                Observaciones: observacionAnterior
                            });
                        }}
                    >
                        <div
                            className="modal"
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '500px', padding: '20px' }}
                        >
                            <h3>¿A qué tipo de atención corresponde esta observación?</h3>
                            <p>{observacionesUsuario}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
                                <Button
                                    variant="contained"
                                    onClick={() => handleObservacionDestino('mantenimiento')}
                                >
                                    Solo mantenimiento
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => handleObservacionDestino('otro')}
                                >
                                    Solo otro tipo de atención
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => handleObservacionDestino('ambos')}
                                >
                                    Ambos tipos de atención
                                </Button>
                            </div>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setShowObservacionesDestinoModal(false);
                                    // Revertir a la observación anterior si el usuario cancela
                                    setFormData({
                                        ...formData,
                                        Observaciones: observacionAnterior
                                    });
                                }}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Modal para ingresar observaciones */}
                {showObservacionesModal && (
                    <div
                        className="modal-overlay"
                        onClick={() => {
                            // Revertir el cambio si el usuario cancela

                            // Actualizar el estado del formulario para desmarcar el checkbox
                            setFormData((prevFormData) => ({
                                ...prevFormData,
                                [campoCambiado]: false, // Revertir el estado del checkbox
                            }));

                            setShowObservacionesModal(false); // Cerrar la modal
                            setObservacionesUsuario(''); // Limpiar el campo de observaciones
                        }} // Cierra el modal al hacer clic en el overlay
                    >
                        <div
                            className="modal"
                            onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                        > {/* Contenedor del modal */}
                            <h3>Observaciones adicionales</h3>
                            <div>
                                <textarea
                                    placeholder="Ingrese las observaciones del cambio..."
                                    value={observacionesUsuario}
                                    onChange={(e) => setObservacionesUsuario(e.target.value)}
                                    style={{ height: '128px', width: '100%', resize: 'none', borderRadius: '5px' }}
                                />
                            </div>
                            <div>
                                <Button
                                    variant="contained"
                                    style={{ marginRight: '10px' }}
                                    onClick={() => {
                                        // Guardar las observaciones en el estado del formulario
                                        if (campoCambiado === 'Atencion') {
                                            setFormData({
                                                ...formData,
                                                ObservacionesUsuarioAtencion: observacionesUsuario,
                                            });
                                        } else if (campoCambiado === 'OtraAtencion') {
                                            setFormData({
                                                ...formData,
                                                ObservacionesUsuarioOtraAtencion: observacionesUsuario,
                                            });
                                        }
                                        setShowObservacionesModal(false); // Cerrar la modal
                                        setObservacionesUsuario(''); // Limpiar el campo de observaciones
                                    }}
                                >
                                    Aceptar
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        // Revertir el cambio si el usuario cancela

                                        // Actualizar el estado del formulario para desmarcar el checkbox
                                        setFormData((prevFormData) => ({
                                            ...prevFormData,
                                            [campoCambiado]: false, // Revertir el estado del checkbox
                                        }));

                                        setShowObservacionesModal(false); // Cerrar la modal
                                        setObservacionesUsuario(''); // Limpiar el campo de observaciones
                                    }}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de materiales */}
                {showMaterialesModal && (
                    <div
                        className="modal-overlay"
                        onClick={() => setShowMaterialesModal(false)} // Cierra el modal al hacer clic en el overlay
                    >
                        <div
                            className="modal"
                            onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                            style={{ width: '100%', maxWidth: '500px', padding: '20px' }}
                        > {/* Contenedor del modal */}
                            <h3>Agregar Materiales Necesarios</h3>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', height: '40px' }}>
                                <Select
                                    value={materialActual.id}
                                    onChange={handleMaterialChange}
                                    displayEmpty
                                    fullWidth
                                >
                                    <MenuItem value="">Seleccione un material</MenuItem>
                                    {materiales.map(material => (
                                        <MenuItem key={material.Id} value={material.Id}>
                                            {material.Nombre} ({material.UnidadMedida})
                                        </MenuItem>
                                    ))}
                                </Select>

                                {renderCantidadInput()}

                                <Button
                                    variant="contained"
                                    onClick={agregarMaterial}
                                    disabled={!materialActual.id}
                                >
                                    Agregar
                                </Button>
                            </div>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                                <List>
                                    {materialesSeleccionados.map(material => (
                                        <ListItem
                                            key={material.id}
                                            secondaryAction={
                                                <Button edge="end" onClick={() => eliminarMaterial(material.id)} variant='contained' className='delete-button'>
                                                    Eliminar material
                                                </Button>
                                            }
                                        >
                                            <ListItemText
                                                primary={`${material.nombre}`}
                                                secondary={`${material.cantidad} ${material.unidad}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                <Button
                                    variant="contained"
                                    onClick={() => setShowMaterialesModal(false)}
                                >
                                    Guardar
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setMaterialesSeleccionados([])
                                        setShowMaterialesModal(false)
                                    }}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </form>

            <UnidadesModal
                open={showUnidadesModal}
                onClose={() => setShowUnidadesModal(false)}
                onUnidadesChange={fetchUnidades}
            />
        </>
    );
};

export default NodeFrom; // Exportar el componente NodeFrom