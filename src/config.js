// src/config.js

// ❗ IMPORTANTE
// Reemplaza esta clave pública con la que generes desde el panel de la Federación.
// Este es el "candado" que usarán los clubes para cifrar los documentos.
export const FEDERATION_PUBLIC_KEY = "a725152012856f7e42351259c450191262624505fee31435558484f236034be80da24590351341135150e0513605556205417a7442314e64599e555433246a4e";

// Puedes dejar estas como están o configurarlas en un archivo .env si lo prefieres.
export const IPFS_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY || 'http://127.0.0.1:8080';
