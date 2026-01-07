import ExcelJS from 'exceljs';
import { Button, Tooltip } from '@mui/material';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const tablaRegistros = () => {
    const [hoveredRow, setHoveredRow] = useState(null); // Estado para marcar la selección en la tabla
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
    const [materiales, setMateriales] = useState([]); // Estado para almacenar los materiales totales de la consulta
    const [total_IDF_MDF, setTotal_IDF_MDF] = useState([]); // Estado para almacenar la suma de los MDF e IDF de la consulta
    const [selectedImagesUnidad, setSelectedImagesUnidad] = useState(null); // Estado para almacenar las imágenes de la unidad seleccionada
    const [selectedImagesUnidadNodos, setSelectedImagesUnidadNodos] = useState(null); // Estado para almacenar las imágenes de la consulta
    const [showMaterials, setShowMaterials] = useState(false); // Estado para mostrar el modal de materiales
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
            const response = await axios.get('http://localhost:5000/api/nodos', {
                params, // Enviar los filtros modificados como parámetros de consulta
            });

            setFilteredNodos(response.data.nodos); // Almacenar los datos filtrados en el estado
            setTotalRegistros(response.data.total); // Almacenar el total de registros en el estado
            setTotalFaltantes(response.data.faltantes); // Almacenar el total de nodos faltantes en el estado
            setTotalAtencion(response.data.totalAtencion); // Almacenar el total de nodos que requieren mantenimiento en el estado
            setTotalOtraAtencion(response.data.totalOtraAtencion); // Almacenar el total de nodos que requieren otro tipo de atención en el estado
            setTotalAtendidos(response.data.totalAtendido); // Almacenar el total de nodos que han recibido atención de mantenimiento en el estado
            setTotalOtroAtendido(response.data.totalOtroAtendido); // Almacenar el total de nodos que han recibido atención de otro tipo en el estado
            setMateriales(response.data.materialesSuma); // Almacenar todos los materiales con la cantidad total en el estado
            setTotal_IDF_MDF(response.data.idf_mdf_Suma); // Almacenar el conteo de todos los MDF e IDF
        } catch (error) {
            console.error('Error al obtener los registros:', error);
        }
    };

    const exportarAExcel = async () => {
        try {
            // 1. Crear un nuevo libro de Excel y hoja de trabajo
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistema de Gestión de Nodos'; // Metadatos del creador
            workbook.created = new Date(); // Fecha de creación
            const worksheet = workbook.addWorksheet('Registros de Nodos');

            // 2. Definir columnas con anchos personalizados
            worksheet.columns = [
                { header: 'Puerto', key: 'Puerto', width: 12 },
                { header: 'Dirección IP', key: 'Dirección IP', width: 15 },
                { header: 'Ubicación', key: 'Ubicación', width: 40 },
                { header: 'Unidad', key: 'Unidad', width: 30 }
            ];

            // 3. Estilo avanzado para encabezados
            const headerStyle = {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4472C4' } // Azul más oscuro
                },
                font: {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    size: 14,
                    name: 'Calibri'
                },
                alignment: {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                }
            };

            // Aplicar estilo a la fila de encabezados
            const headerRow = worksheet.getRow(1);
            headerRow.height = 22; // Altura personalizada
            headerRow.eachCell((cell) => {
                cell.style = headerStyle;
            });

            // 4. Añadir datos con estilos alternados (zebra striping)
            filteredNodos.forEach((nodo, index) => {
                const row = worksheet.addRow({
                    'Puerto': nodo.Puerto || 'N/A',
                    'Dirección IP': nodo.IpSwitch || 'N/A',
                    'Ubicación': nodo.Ubicacion || 'N/A',
                    'Unidad': nodo.Unidad || 'N/A'
                });

                // Estilo para filas (alternar colores)
                const rowStyle = {
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F2F2' }
                    },
                    font: {
                        name: 'Calibri',
                        size: 12
                    },
                    alignment: {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true
                    },
                    border: {
                        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
                    }
                };

                row.eachCell((cell) => {
                    cell.style = rowStyle;
                });

                // Ajustar altura de fila automáticamente para contenido largo
                row.height = Math.max(20, Math.ceil(nodo.Ubicacion?.length / 40) * 20);
            });

            // 5. Configuraciones adicionales de la hoja
            // Congelar fila de encabezados
            worksheet.views = [{
                state: 'frozen',
                ySplit: 1,
                showGridLines: false
            }];

            // Añadir filtros automáticos
            worksheet.autoFilter = {
                from: { row: 1, column: 1 },
                to: { row: 1, column: worksheet.columnCount }
            };

            // Proteger hoja (solo lectura)
            //worksheet.protect('', {
            //    selectLockedCells: false,
            //    selectUnlockedCells: false
            //});

            // 6. Generar y descargar el archivo
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Nombre del archivo con unidad y fecha
            const unidad = filteredNodos[0]?.Unidad || 'Generales';
            const fecha = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '-');

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Registros_Nodos_${unidad.replace(/\s+/g, '_')}_${fecha}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            alert("Ocurrió un error al generar el archivo Excel");
        }
    };

    const exportarAExcelMateriales = async () => {
        try {
            // 1. Crear un nuevo libro de Excel y hoja de trabajo
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistema de Gestión de Nodos'; // Metadatos del creador
            workbook.created = new Date(); // Fecha de creación
            const worksheet = workbook.addWorksheet('Lista de materiales');

            // 2. Definir columnas con anchos personalizados
            worksheet.columns = [
                { header: 'Nombre', key: 'Nombre', width: 24 },
                { header: 'Necesarios', key: 'Necesarios', width: 15 },
                { header: 'Utilizados', key: 'Utilizados', width: 15 }
            ];

            // 3. Estilo avanzado para encabezados
            const headerStyle = {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4472C4' } // Azul más oscuro
                },
                font: {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    size: 14,
                    name: 'Calibri'
                },
                alignment: {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                }
            };

            // Aplicar estilo a la fila de encabezados
            const headerRow = worksheet.getRow(1);
            headerRow.height = 22; // Altura personalizada
            headerRow.eachCell((cell) => {
                cell.style = headerStyle;
            });

            // 4. Añadir datos con estilos alternados (zebra striping)
            materiales.forEach((material, index) => {
                const row = worksheet.addRow({
                    'Nombre': material.Nombre || 'N/A',
                    'Necesarios': (material.Necesarios == 0 ? '-' : material.Necesarios + ' ' + material.UnidadMedida) || '-',
                    'Utilizados': (material.Utilizados == 0 ? '-' : material.Utilizados + ' ' + material.UnidadMedida) || '-'
                });

                // Estilo para filas (alternar colores)
                const rowStyle = {
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F2F2' }
                    },
                    font: {
                        name: 'Calibri',
                        size: 12
                    },
                    alignment: {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true
                    },
                    border: {
                        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
                    }
                };

                row.eachCell((cell) => {
                    cell.style = rowStyle;
                });

                // Ajustar altura de fila automáticamente para contenido largo
                row.height = Math.max(20, Math.ceil(materiales.Nombre?.length / 40) * 20);
            });

            // 6. Generar y descargar el archivo
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Nombre del archivo con unidad y fecha
            const unidad = filtros.unidad == '' ? 'Generales' : filteredNodos[0]?.Unidad;
            const fecha = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '-');

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Materiales_${unidad.replace(/\s+/g, '_')}_${fecha}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            alert("Ocurrió un error al generar el archivo Excel");
        }
    };

    const exportarAExcelMaterialesNecesarios = async () => {
        try {
            // 1. Crear un nuevo libro de Excel y hoja de trabajo
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistema de Gestión de Nodos'; // Metadatos del creador
            workbook.created = new Date(); // Fecha de creación
            const worksheet = workbook.addWorksheet('Lista de materiales necesarios');

            // 2. Definir columnas con anchos personalizados
            worksheet.columns = [
                { header: 'Nombre', key: 'Nombre', width: 24 },
                { header: 'Cantidad', key: 'Cantidad', width: 15 }
            ];

            // 3. Estilo avanzado para encabezados
            const headerStyle = {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4472C4' } // Azul más oscuro
                },
                font: {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    size: 14,
                    name: 'Calibri'
                },
                alignment: {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                }
            };

            // Aplicar estilo a la fila de encabezados
            const headerRow = worksheet.getRow(1);
            headerRow.height = 22; // Altura personalizada
            headerRow.eachCell((cell) => {
                cell.style = headerStyle;
            });

            // 4. Añadir datos con estilos alternados (zebra striping)
            materiales.forEach((material, index) => {
                const row = worksheet.addRow({
                    'Nombre': material.Nombre || 'N/A',
                    'Cantidad': (material.Necesarios == 0 ? '-' : material.Necesarios + ' ' + material.UnidadMedida) || '-'
                });

                // Estilo para filas (alternar colores)
                const rowStyle = {
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F2F2' }
                    },
                    font: {
                        name: 'Calibri',
                        size: 12
                    },
                    alignment: {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true
                    },
                    border: {
                        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
                    }
                };

                row.eachCell((cell) => {
                    cell.style = rowStyle;
                });

                // Ajustar altura de fila automáticamente para contenido largo
                row.height = Math.max(20, Math.ceil(materiales.Nombre?.length / 40) * 20);
            });

            // 6. Generar y descargar el archivo
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Nombre del archivo con unidad y fecha
            const unidad = filtros.unidad == '' ? 'Generales' : filteredNodos[0]?.Unidad;
            const fecha = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '-');

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Materiales_Necesarios_${unidad.replace(/\s+/g, '_')}_${fecha}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            alert("Ocurrió un error al generar el archivo Excel");
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

    // Cargar los registros al iniciar la página
    useEffect(() => {
        fetchNodos();
    }, [filtros]);

    const handleFiltroChange = (e) => {
        const { name, value } = e.target; // Extrae el nombre y el valor del campo
        setFiltros({ ...filtros, [name]: value }); // Actualiza el estado de los filtros
    };

    // Función para cerrar los modales
    const handleCloseModal = () => {
        setSelectedNodo(null); // Limpia el estado
        setSelectedImage(null); // Limpia el estado
        setSelectedAtencionNodo(null); // Limpia el estado
        setSelectedOtherAtencionNodo(null); // Limpia el estado
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

    // Función para verificar si los filtros están vacíos
    const filtrosEstanVacios = () => {
        return (
            filtros.unidad === ''
        );
    };

    // Función para verificar si un campo (array) está vacío
    const EstaVacio = (dato) => {
        if (dato.length == 0) {
            return true;
        } else {
            return false;
        }
    };

    // Función para abrir el modal de todas las imágenes de la unidad
    const handleImagenesUnidadNodos = async () => {
        try {
            // Obtener las imágenes solventadas desde el backend
            const response = await axios.get(`http://localhost:5000/api/nodos/imagenes-nodos/${filtros.unidad}`);
            
            const ImagenesNodos = response.data;

            // Actualizar el nodo con las imágenes solventadas
            setSelectedImagesUnidadNodos(ImagenesNodos);
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    };

    // Función para abrir el modal de todas las imágenes de la unidad (MDF IDF)
    const handleImagenesUnidad = async () => {
        try {
            // Obtener las imágenes solventadas desde el backend
            const response = await axios.get(`http://localhost:5000/api/nodos/imagenes/${filtros.unidad}`);

            const ImagenesNodos = response.data;

            // Actualizar el nodo con las imágenes solventadas
            setSelectedImagesUnidad(ImagenesNodos);
        } catch (error) {
            console.error('Error al obtener los datos:', error);
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
                        value={filtros.tipoAtencion}
                        onChange={handleFiltroChange}
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
                    <select
                        style={{ marginLeft: '5px' }}
                        name="unidad"
                        value={filtros.unidad}
                        onChange={handleFiltroChange} // Cambia el valor del filtro unidad
                    >
                        <option value="">Todas</option>
                        {unidades.map((unidad) => ( // Mapea las unidades y las muestra en el select
                            <option key={unidad.ref} value={unidad.ref}> {/* Coloca el valor de la unidad */}
                                {unidad.nombre} {/* Coloca el nombre de la unidad */}
                            </option>
                        ))}
                    </select>
                </label>

                {/* Filtros ocultos */}
                {/*
                <label style={{ marginLeft: '10px' }}>
                    <label>
                        Estado del cable:
                        <select
                            style={{ marginLeft: '5px' }}
                            name="estadoCable"
                            value={filtros.estadoCable}
                            onChange={handleFiltroChange}
                        >
                            <option value="">Todas</option>
                            <option value='Bueno'>Bueno</option>
                            <option value='Regular'>Regular</option>
                            <option value='Malo'>Malo</option>
                        </select>
                    </label>
                </label>
                <label style={{ marginLeft: '10px' }}>
                    <label>
                        Categoría del cable:
                        <select
                            style={{ marginLeft: '5px' }}
                            name="categoria"
                            value={filtros.categoria}
                            onChange={handleFiltroChange}
                        >
                            <option value="">Todas</option>
                            <option value='5'>Categoría 5</option>
                            <option value='5e'>Categoría 5e</option>
                            <option value='5A'>Categoría 5A</option>
                            <option value='6'>Categoría 6</option>
                            <option value='6A'>Categoría 6A</option>
                        </select>
                    </label>
                </label>
                <label style={{ marginLeft: '10px' }}>
                    Año de instalación:
                    <input
                        style={{ marginLeft: '5px', width: '80px' }}
                        type="number"
                        name="anioInstalacion"
                        placeholder="Año"
                        min="0"
                        max={new Date().getFullYear()}
                        value={filtros.anioInstalacion}
                        onChange={handleFiltroChange}
                    />
                </label>
                <label style={{ marginLeft: '10px' }}>
                    IP Switch:
                    <input
                        style={{ marginLeft: '5px', width: '120px' }}
                        type="text"
                        name="ipSwitch"
                        placeholder="Ej: 192.168.0.1"
                        value={filtros.ipSwitch}
                        onChange={handleFiltroChange}
                    />
                </label>
                <label style={{ marginLeft: '10px' }}>
                    <label>
                        Longitud del cable:
                        <select
                            style={{ marginLeft: '5px' }}
                            name="longitudRango"
                            value={filtros.longitudRango}
                            onChange={handleFiltroChange}
                        >
                            <option value="">Todas</option>
                            <option value="0-0.001">Sin cable</option>
                            <option value='0.001-20'>Menor que 20 metros</option>
                            <option value='20-40'>20-40</option>
                            <option value='40-60'>40-60</option>
                            <option value='60-80'>60-80</option>
                            <option value='80-1000'>80-1000</option>
                        </select>
                    </label>
                </label>
                <label style={{ marginLeft: '10px' }}>
                    <label>
                        Con nodos faltantes:
                        <select
                            style={{ marginLeft: '5px' }}
                            name="conNodosFaltantes"
                            value={filtros.conNodosFaltantes}
                            onChange={handleFiltroChange}
                        >
                            <option value="">Todos</option>
                            <option value="1">Si</option>
                            <option value="0">No</option>
                        </select>
                    </label>
                </label>
                <label style={{ marginLeft: '10px' }}>
                    <label>
                        Con observaciones:
                        <select
                            style={{ marginLeft: '5px' }}
                            name="conObservaciones"
                            value={filtros.conObservaciones}
                            onChange={handleFiltroChange}
                        >
                            <option value="">Todos</option>
                            <option value="1">Si</option>
                            <option value="0">No</option>
                        </select>
                    </label>
                </label>
                <label style={{ marginLeft: '10px' }}>
                    <label>
                        Recibieron atención:
                        <select
                            style={{ marginLeft: '5px' }}
                            name="atendido"
                            value={filtros.atendido}
                            onChange={handleFiltroChange}
                        >
                            <option value="">Todos</option>
                            <option value="1">Si recibio atención</option>
                            <option value="0">No recibio atención</option>
                        </select>
                    </label>
                </label>
                
    */}
            </div>

            <div style={{ marginTop: '10px', fontWeight: 'bold', marginBottom: '20px' }}>
                <label>Total de registros: {totalRegistros}</label> {/* Campo con valor cambiante dependiendo de los filtros y sus registros obtenidos */}
                <label style={{ marginLeft: '20px' }}> Requieren mantenimiento: {totalAtencion || ' 0'} </label> {/* Campo con valor cambiante dependiendo de los filtros y sus registros obtenidos */}
                <label style={{ marginLeft: '20px' }}> Requieren otro tipo de atención: {totalOtraAtencion || ' 0'} </label> {/* Campo con valor cambiante dependiendo de los filtros y sus registros obtenidos */}
                <label style={{ marginLeft: '20px' }}> Nodos atendidos en mantenimiento: {totalAtendidos || ' 0'} </label> {/* Campo con valor cambiante dependiendo de los filtros y sus registros obtenidos */}
                <label style={{ marginLeft: '20px' }}> Nodos atendidos de otro tipo de atención: {totalOtroAtendido || ' 0'} </label> {/* Campo con valor cambiante dependiendo de los filtros y sus registros obtenidos */}
                <label style={{ marginLeft: '20px' }}> Total faltantes: {totalFaltantes || ' 0'} </label> {/* Campo con valor cambiante dependiendo de los filtros y sus registros obtenidos */}
                <br />
                {total_IDF_MDF?.length > 0 && total_IDF_MDF.map((IDF_MDF, index) => (
                    <label key={index} style={{ marginLeft: '20px' }}>
                        Total {IDF_MDF.Tipo}: {IDF_MDF.Cantidad || '0'}
                    </label>
                ))}
            </div>
            
            {/* Lista de materiales utilizados y necesarios totales */}
            {showMaterials && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowMaterials(!showMaterials)} // Cierra el modal al hacer clic en el overlay
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el overlay
                    >
                        <h3>Lista de Materiales</h3>
                        <div>
                            <table>
                                <thead>
                                    <tr style={{ background: '#e0e0e0' }}>
                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>Material</th>
                                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Necesarios</th>
                                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Utilizados</th>
                                    </tr>
                                </thead>
                                <tbody className='content-table-modal'>
                                    {materiales.map((material, index) => (
                                        <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#f1f1f1' }}>
                                            <td>{material.Nombre}</td>
                                            <td>{material.Necesarios == 0 ? '-' : material.Necesarios + ' ' + material.UnidadMedida}</td>
                                            <td>{material.Utilizados == 0 ? '-' : material.Utilizados + ' ' + material.UnidadMedida}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <br/>
                        <div>
                            <Tooltip title="Exportar toda la tabla de materiales a Excel">
                                <Button
                                    variant="contained"
                                    onClick={exportarAExcelMateriales} // Llama a la función para exportar a Excel
                                >
                                    Descargar todos
                                </Button>
                            </Tooltip>
                            <Tooltip title="Exportar sólo los materiales necesarios a Excel">
                                <Button
                                    variant="contained"
                                    style={{ marginLeft: '20px' }}
                                    onClick={exportarAExcelMaterialesNecesarios} // Llama a la función para exportar a Excel
                                >
                                    Descargar necesarios
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                {/* Botón a la izquierda */}
                {!EstaVacio(materiales) && (
                    <div>
                        <Tooltip title="Mostrar lista de materiales utilizados y necesarios totales">
                            <Button
                                variant="contained"
                                onClick={() => setShowMaterials(!showMaterials)} // Mostrar los materiales en la modal
                            >
                                Mostrar materiales
                            </Button>
                        </Tooltip>
                    </div>
                )}

                {/* Contenedor de botones alineados a la derecha */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    {!filtrosEstanVacios() && (
                        <Tooltip title="Mostrar todas las imágenes de los MDF e IDF de la unidad">
                            <Button
                                variant="contained"
                                onClick={handleImagenesUnidad} // Mostrar las imágenes en la modal
                            >
                                imágenes (MDF - IDF)
                            </Button>
                        </Tooltip>
                    )}
                    {!filtrosEstanVacios() && (
                        <Tooltip title="Mostrar todas las imágenes de los nodos de la unidad">
                            <Button
                                variant="contained"
                                onClick={handleImagenesUnidadNodos} // Mostrar las imágenes en la modal
                            >
                                imágenes (nodos)
                            </Button>
                        </Tooltip>
                    )}
                    {!filtrosEstanVacios() && (
                        <Tooltip title="Exportar Puerto, IP, Ubicación y Unidad a Excel">
                            <Button
                                variant="contained"
                                color="success"
                                onClick={exportarAExcel} // Llama a la función para exportar a Excel
                                disabled={EstaVacio(filteredNodos)}
                            >
                                Exportar Nodos
                            </Button>
                        </Tooltip>
                    )}
                </div>
            </div>

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
                    {filteredNodos.map((nodoData, index) => {
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
                                style={{
                                    backgroundColor: currentColor
                                }}
                                // Eventos para manejar el coloreado de la fila al sobreponer el puntero
                                onMouseEnter={() => setHoveredRow(index)}
                                onMouseLeave={() => setHoveredRow(null)}
                            > {/* Clave única para cada fila */}
                                <td
                                    onClick={() => handleDetailsClick(nodoData)}
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
                        )
                    })}
                </tbody>
            </table>

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
                            <table>
                                <thead>
                                    <th>Fecha de registro</th>
                                    <th>Observaciones del usuario</th>
                                </thead>
                                <tbody className='content-table-modal'>
                                    {selectedSinAtencionNodo.mantenimiento.map((CamposMantenimiento, index) => (
                                        <tr key={index}> {/* Clave única para cada fila */}
                                            <td>{CamposMantenimiento.FechaCambio}</td>
                                            <td>{CamposMantenimiento.ObservacionesUsuario}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                        {!EstaVacio(selectedSinOtherAtencionNodo.otrasAtenciones) && (
                            <table>
                                <thead>
                                    <th>Fecha de registro</th>
                                    <th>Observaciones del usuario</th>
                                </thead>
                                <tbody className='content-table-modal'>
                                    {selectedSinOtherAtencionNodo.otrasAtenciones.map((CamposOtrasAtenciones, index) => (
                                        <tr key={index}> {/* Clave única para cada fila */}
                                            <td>{CamposOtrasAtenciones.FechaCambio}</td>
                                            <td>{CamposOtrasAtenciones.ObservacionesUsuario}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                            ) || (<p style={{ color: 'grey' }}>No hay materiales necesarios</p>)} {/* Coloca un mensaje en caso de estar sin materiales utilizados */}

                            {!EstaVacio(selectedNodo.materiales) && (
                                <div>
                                    <strong>Materiales utilizados:</strong>
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
                            ) || (<p style={{ color: 'grey' }}>No hay materiales Utilizados</p>)} {/* Coloca un mensaje en caso de estar sin materiales utilizados */}
                        </div>
                        <Button onClick={handleCloseModal} variant="outlined">Cerrar</Button> {/* Botón para cerrar el modal */}
                    </div>
                </div>
            )}

            {selectedImagesUnidadNodos && (
                <div className="modal-overlay" onClick={() => setSelectedImagesUnidadNodos(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="image-modal-title">Imágenes de los nodos:</h3>

                        {selectedImagesUnidadNodos.nodosImages.length > 0 ? (
                            <div className="image-grid-container">
                                {selectedImagesUnidadNodos.nodosImages.map((image, index) => {
                                    const fileName = image.ImagenURL.split('/').pop();
                                    const timestampMatch = fileName.match(/(\d+)\.\w+$/);
                                    const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : null;
                                    const formattedDate = timestamp && new Date(timestamp).getFullYear() >= 2010
                                        ? new Date(timestamp).toLocaleDateString('es-MX', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                        })
                                        : 'Fecha no disponible';

                                    return (
                                        <div className="image-card" key={index}>
                                            <div className="image-info">
                                                <div className="image-name">{image.Ubicacion}</div>
                                                <div className={image.ImagenURL.toLowerCase().includes('solventado')
                                                    ? 'image-status-solventado'
                                                    : 'image-status-general'}>
                                                    {image.ImagenURL.toLowerCase().includes('solventado')
                                                        ? '(Dentro de Solventado)'
                                                        : '(General)'}
                                                </div>
                                                <div className="image-date">{formattedDate}</div>
                                            </div>
                                            <img
                                                src={'http://localhost:5000' + image.ImagenURL}
                                                alt={`Imagen ${index + 1}`}
                                                className="thumbnail-image"
                                                onClick={() => handleImageClick(image.ImagenURL)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="no-images-message">No hay imágenes de los nodos disponibles.</p>
                        )}
                    </div>
                </div>
            )}

            {selectedImagesUnidad && (
                <div className="modal-overlay" onClick={() => setSelectedImagesUnidad(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="image-modal-title">Imágenes de los MDF e IDF:</h3>

                        {selectedImagesUnidad.MDF_IDF_Images.length > 0 ? (
                            <div className="image-grid-container">
                                {selectedImagesUnidad.MDF_IDF_Images.map((image, index) => (
                                    <div className="image-card" key={index}>
                                        <div className="image-info">
                                            <div className="image-name">{image.Nombre}</div>
                                            <div className="image-date">{image.FechaCaptura}</div>
                                        </div>
                                        <img
                                            src={'http://localhost:5000' + image.ImagenURL}
                                            alt={`Imagen ${index + 1}`}
                                            className="thumbnail-image"
                                            onClick={() => handleImageClick(image.ImagenURL)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-images-message">No hay imágenes de los MDF e IDF disponibles.</p>
                        )}
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

export default tablaRegistros;