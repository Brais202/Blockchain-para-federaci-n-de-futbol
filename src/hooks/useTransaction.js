import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejar transacciones blockchain 
 
 */
export const useTransaction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  /**
   * Parsea errores de blockchain de forma legible
  
   */
  const parseError = useCallback((error) => {
    console.error('Error original:', error);

    // Error de usuario rechazando transacción
    if (error.code === 4001 || error.message?.includes('User denied')) {
      return 'Transacción cancelada por el usuario';
    }

    // Error de fondos insuficientes
    if (error.message?.includes('insufficient funds')) {
      return 'Fondos insuficientes para completar la transacción';
    }

    // Error de gas
    if (error.message?.includes('gas')) {
      return 'Error de gas. La transacción puede requerir más gas o fallar';
    }

    // Error de revert con razón
    if (error.message?.includes('revert')) {
      // Intentar extraer el mensaje de revert
      const revertMatch = error.message.match(/revert (.+?)"/);
      if (revertMatch && revertMatch[1]) {
        return `Contrato rechazó: ${revertMatch[1]}`;
      }
      return 'La transacción fue revertida por el contrato inteligente';
    }

    // Error de nonce
    if (error.message?.includes('nonce')) {
      return 'Error de nonce. Intenta reiniciar MetaMask';
    }

    // Error de red
    if (error.message?.includes('network')) {
      return 'Error de red. Verifica tu conexión';
    }

    // Error genérico
    return error.message || 'Error desconocido en la transacción';
  }, []);

  /**
   * Ejecuta una transacción con manejo de errores mejorado

   */
  const executeTransaction = useCallback(async (txFunction, options = {}) => {
    const {
      onSuccess,
      onError,
      successMessage = 'Transacción completada exitosamente',
      loadingMessage = 'Procesando transacción...'
    } = options;

    try {
      setLoading(true);
      setError(null);
      setTxHash(null);

      console.log('🚀 Iniciando transacción...');

      // Ejecutar la función de transacción
      const tx = await txFunction();

      if (!tx || !tx.wait) {
        throw new Error('La función no retornó una transacción válida');
      }

      console.log('📤 Transacción enviada:', tx.hash);
      setTxHash(tx.hash);

      // Esperar confirmación
      console.log('⏳ Esperando confirmación...');
      const receipt = await tx.wait();

      console.log('✅ Transacción confirmada:', receipt);

      // Callback de éxito
      if (onSuccess) {
        await onSuccess(receipt);
      }

      setLoading(false);
      return {
        success: true,
        receipt,
        hash: tx.hash,
        message: successMessage
      };

    } catch (err) {
      const errorMessage = parseError(err);
      console.error('❌ Error en transacción:', errorMessage);

      setError(errorMessage);
      setLoading(false);

      // Callback de error
      if (onError) {
        onError(errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    }
  }, [parseError]);

  /**
   * Valida que MetaMask esté conectado y en la red correcta
   
   */
  const validateConnection = useCallback(async () => {
    try {
      if (!window.ethereum) {
        return {
          valid: false,
          error: 'MetaMask no está instalado. Por favor, instálalo para continuar.'
        };
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length === 0) {
        return {
          valid: false,
          error: 'Por favor, conecta tu wallet de MetaMask.'
        };
      }

      return {
        valid: true,
        account: accounts[0]
      };

    } catch (error) {
      return {
        valid: false,
        error: 'Error verificando conexión de MetaMask: ' + error.message
      };
    }
  }, []);

  /**
   * Resetea el estado del hook
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setTxHash(null);
  }, []);

  /**
   * Obtiene el enlace al explorador de bloques para una transacción

   */
  const getExplorerLink = useCallback((hash, network = 'sepolia') => {
    const explorers = {
      'mainnet': 'https://etherscan.io',
      'sepolia': 'https://sepolia.etherscan.io',
      'goerli': 'https://goerli.etherscan.io',
      'localhost': 'http://localhost:8545'
    };

    const baseUrl = explorers[network] || explorers.sepolia;
    return `${baseUrl}/tx/${hash}`;
  }, []);

  return {
    loading,
    error,
    txHash,
    executeTransaction,
    validateConnection,
    parseError,
    reset,
    getExplorerLink
  };
};

export default useTransaction;
