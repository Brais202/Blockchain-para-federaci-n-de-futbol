import { create } from 'kubo-rpc-client';

// Configuración del cliente IPFS
// Puedes usar un nodo local o un servicio como Infura
const IPFS_HOST = process.env.REACT_APP_IPFS_HOST || 'localhost';
const IPFS_PORT = process.env.REACT_APP_IPFS_PORT || '5001';
const IPFS_PROTOCOL = process.env.REACT_APP_IPFS_PROTOCOL || 'http';
const IPFS_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY || 'http://127.0.0.1:8080';

let ipfsClient = null;

/**
 * Inicializa el cliente de IPFS
 */
export const initIPFS = async () => {
  try {
    if (!ipfsClient) {
      ipfsClient = create({
        host: IPFS_HOST,
        port: IPFS_PORT,
        protocol: IPFS_PROTOCOL
      });
      
      // Verificar conexión
      const version = await ipfsClient.version();
      console.log('✅ IPFS conectado:', version);
    }
    return ipfsClient;
  } catch (error) {
    console.error('❌ Error conectando a IPFS:', error);
    throw new Error('No se pudo conectar a IPFS. Asegúrate de que el daemon esté corriendo.');
  }
};

/**
 * Sube un buffer de datos a IPFS.
 * Esta es la función principal de subida.
 * @param {Uint8Array} buffer - El buffer de datos a subir.
 * @returns {Promise<object>} - Objeto con el CID, path, size y URL.
 */
export const subirContenido = async (buffer) => {
  if (!buffer || !(buffer instanceof Uint8Array)) {
    throw new Error('La entrada debe ser un Uint8Array (Buffer).');
  }

  try {
    const client = await initIPFS();
    
    console.log(`📤 Subiendo ${buffer.length} bytes a IPFS...`);
    
    const result = await client.add(buffer, {
      progress: (bytes) => {
        // Opcional: puedes conectar esto a un estado para una barra de progreso
        // console.log(`Progreso: ${bytes} bytes subidos`);
      }
    });
    
    console.log('✅ Contenido subido a IPFS:', result.cid.toString());
    
    return {
      cid: result.cid.toString(),
      path: result.path,
      size: result.size,
      url: `${IPFS_GATEWAY}/ipfs/${result.cid.toString()}`
    };
    
  } catch (error) {
    console.error('❌ Error subiendo contenido a IPFS:', error);
    throw error;
  }
};


/**
 * Sube un archivo (File object) a IPFS.
 * Lee el archivo, lo convierte a buffer y usa 'subirContenido'.
 * @param {File} file - Archivo a subir
 * @returns {Promise<string>} - Hash CID del archivo en IPFS
 */
export const subirArchivo = async (file) => {
  try {
    // Leer el archivo como buffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(fileBuffer);
    
    console.log(`📤 Preparando archivo para subir: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    return await subirContenido(buffer);
    
  } catch (error) {
    console.error(`❌ Error leyendo el archivo ${file.name}:`, error);
    throw error;
  }
};

/**
 * Sube contenido JSON a IPFS
 * @param {Object} jsonData - Datos JSON a subir
 * @returns {Promise<string>} - Hash CID del contenido en IPFS
 */
export const subirJSONIPFS = async (jsonData) => {
  try {
    const client = await initIPFS();
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    const buffer = Buffer.from(jsonString);
    
    console.log('📤 Subiendo JSON a IPFS...');
    
    const result = await client.add(buffer);
    
    console.log('✅ JSON subido a IPFS:', result.cid.toString());
    
    return {
      cid: result.cid.toString(),
      size: result.size,
      url: `${IPFS_GATEWAY}/ipfs/${result.cid.toString()}`
    };
    
  } catch (error) {
    console.error('❌ Error subiendo JSON a IPFS:', error);
    throw error;
  }
};

/**
 * Recupera un archivo de IPFS
 * @param {string} cid - CID del archivo en IPFS
 * @returns {Promise<Uint8Array>} - Contenido del archivo
 */
export const obtenerArchivoIPFS = async (cid) => {
  try {
    const client = await initIPFS();
    
    console.log(`📥 Descargando archivo de IPFS: ${cid}`);
    
    const chunks = [];
    for await (const chunk of client.cat(cid)) {
      chunks.push(chunk);
    }
    
    // Concatenar todos los chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    console.log('✅ Archivo descargado de IPFS');
    
    return result;
    
  } catch (error) {
    console.error('❌ Error obteniendo archivo de IPFS:', error);
    throw error;
  }
};

/**
 * Recupera contenido JSON de IPFS
 * @param {string} cid - CID del contenido en IPFS
 * @returns {Promise<Object>} - Objeto JSON
 */
export const obtenerJSONIPFS = async (cid) => {
  try {
    const data = await obtenerArchivoIPFS(cid);
    const jsonString = new TextDecoder().decode(data);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('❌ Error obteniendo JSON de IPFS:', error);
    throw error;
  }
};

/**
 * Genera URL pública para acceder a un archivo en IPFS
 * @param {string} cid - CID del archivo
 * @returns {string} - URL pública
 */
export const obtenerURLPublica = (cid) => {
  return `${IPFS_GATEWAY}/ipfs/${cid}`;
};

/**
 * Verifica si IPFS está disponible
 * @returns {Promise<boolean>}
 */
export const verificarConexionIPFS = async () => {
  try {
    const client = await initIPFS();
    await client.version();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Sube múltiples archivos a IPFS
 * @param {File[]} files - Array de archivos
 * @returns {Promise<Array>} - Array de resultados con CIDs
 */
export const subirMultiplesArchivosIPFS = async (files) => {
  try {
    const resultados = [];
    
    for (const file of files) {
      const resultado = await subirArchivo(file);
      resultados.push({
        nombre: file.name,
        ...resultado
      });
    }
    
    return resultados;
    
  } catch (error) {
    console.error('❌ Error subiendo múltiples archivos:', error);
    throw error;
  }
};

/**
 * Pin de un archivo en IPFS (para mantenerlo disponible)
 * @param {string} cid - CID del archivo a hacer pin
 */
export const pinArchivo = async (cid) => {
  try {
    const client = await initIPFS();
    await client.pin.add(cid);
    console.log(`✅ Archivo pinned: ${cid}`);
  } catch (error) {
    console.error('❌ Error haciendo pin:', error);
    throw error;
  }
};

/**
 * Obtiene información sobre un archivo en IPFS
 * @param {string} cid - CID del archivo
 * @returns {Promise<Object>} - Información del archivo
 */
export const obtenerInfoArchivo = async (cid) => {
  try {
    const client = await initIPFS();
    const stats = await client.files.stat(`/ipfs/${cid}`);
    return {
      cid: stats.cid.toString(),
      size: stats.size,
      blocks: stats.blocks,
      type: stats.type
    };
  } catch (error) {
    console.error('❌ Error obteniendo info:', error);
    throw error;
  }
};

export default {
  initIPFS,
  subirContenido,
  subirArchivo,
  subirJSONIPFS,
  obtenerArchivoIPFS,
  obtenerJSONIPFS,
  obtenerURLPublica,
  verificarConexionIPFS,
  subirMultiplesArchivosIPFS,
  pinArchivo,
  obtenerInfoArchivo
};
