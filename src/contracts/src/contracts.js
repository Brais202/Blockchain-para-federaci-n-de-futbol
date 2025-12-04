// Dirección de tu contrato en Sepolia
export const addresses = {
    fichajes: "0x64ace1A477Fd5eb9EE1B79db2680B09c0DB6ee66",
};

// El ABI completo que me has pasado
export const abis = {
    fichajes:
        [
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "_ipfsHash",
                        "type": "string"
                    }
                ],
                "name": "anadirDocumentoFichaje",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "_club",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "_nombre",
                        "type": "string"
                    }
                ],
                "name": "autorizarClub",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "club",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "bool",
                        "name": "autorizado",
                        "type": "bool"
                    }
                ],
                "name": "ClubAutorizado",
                "type": "event"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_id",
                        "type": "uint256"
                    }
                ],
                "name": "depositarFondosEscrow",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "_club",
                        "type": "address"
                    }
                ],
                "name": "desautorizarClub",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "string",
                        "name": "ipfsHash",
                        "type": "string"
                    }
                ],
                "name": "DocumentoAnadido",
                "type": "event"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "_nombreJugador",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_fechaNacimiento",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_valorTransferencia",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "_agente",
                        "type": "address"
                    }
                ],
                "name": "editarFichaje",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    }
                ],
                "name": "FichajeAprobado",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "address",
                        "name": "clubOrigen",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "address",
                        "name": "clubDestino",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "valor",
                        "type": "uint256"
                    }
                ],
                "name": "FichajeRegistrado",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "club",
                        "type": "address"
                    }
                ],
                "name": "FirmaAgregada",
                "type": "event"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_id",
                        "type": "uint256"
                    }
                ],
                "name": "firmarFichaje",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "monto",
                        "type": "uint256"
                    }
                ],
                "name": "FondosDepositados",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "clubOrigen",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "derechosFormacion",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "agente",
                        "type": "uint256"
                    }
                ],
                "name": "FondosDistribuidos",
                "type": "event"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_id",
                        "type": "uint256"
                    }
                ],
                "name": "reembolsarFondos",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "clubDestino",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "monto",
                        "type": "uint256"
                    }
                ],
                "name": "ReembolsoRealizado",
                "type": "event"
            },
            {
                "inputs": [
                    {
                        "internalType": "string",
                        "name": "_nombreJugador",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_fechaNacimiento",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "_clubOrigen",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "_clubDestino",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_valorTransferencia",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "_agente",
                        "type": "address"
                    }
                ],
                "name": "registrarFichaje",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "_nuevaDireccion",
                        "type": "address"
                    }
                ],
                "name": "setDerechosFormacion",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "name": "clubs",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "nombre",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "autorizado",
                        "type": "bool"
                    },
                    {
                        "internalType": "uint256",
                        "name": "fechaRegistro",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "clubsRegistrados",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "COMISION_AGENTE",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "DERECHOS_FORMACION",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "derechosFormacion",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "federacion",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "fichajes",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "nombreJugador",
                                "type": "string"
                            },
                            {
                                "internalType": "uint256",
                                "name": "fechaNacimiento",
                                "type": "uint256"
                            }
                        ],
                        "internalType": "struct FichajeOperations.DatosJugador",
                        "name": "jugador",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "address",
                                "name": "clubOrigen",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "clubDestino",
                                "type": "address"
                            }
                        ],
                        "internalType": "struct FichajeOperations.DatosClubes",
                        "name": "clubes",
                        "type": "tuple"
                    },
                    {
                        "internalType": "uint256",
                        "name": "valorTransferencia",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "fechaRegistro",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "aprobado",
                        "type": "bool"
                    },
                    {
                        "internalType": "address",
                        "name": "subidoPor",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "agente",
                        "type": "address"
                    },
                    {
                        "internalType": "bool",
                        "name": "fondosDepositados",
                        "type": "bool"
                    },
                    {
                        "components": [
                            {
                                "internalType": "bool",
                                "name": "firmaOrigen",
                                "type": "bool"
                            },
                            {
                                "internalType": "bool",
                                "name": "firmaDestino",
                                "type": "bool"
                            }
                        ],
                        "internalType": "struct FichajeOperations.DatosFirmas",
                        "name": "firmas",
                        "type": "tuple"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "fondosEscrow",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getClubsCount",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_id",
                        "type": "uint256"
                    }
                ],
                "name": "obtenerEdadJugador",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "totalFichajes",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]
};