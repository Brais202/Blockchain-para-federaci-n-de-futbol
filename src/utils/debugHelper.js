// utils/debugHelper.js
export const debugTransaction = async (txHash, provider) => {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    console.log('📋 Receipt de transacción:', receipt);
    
    if (receipt) {
      console.log('✅ Status:', receipt.status ? 'Éxito' : 'Fallida');
      console.log('🔹 Block Number:', receipt.blockNumber);
      console.log('🪙 Gas Used:', receipt.gasUsed.toString());
      console.log('📝 Logs:', receipt.logs);
    }
  } catch (error) {
    console.error('Error debuggeando transacción:', error);
  }
};

// En tus componentes, úsalo así:
const handleRegistrarFichaje = async (e) => {
  e.preventDefault();
  try {
    const tx = await contract.registrarFichaje(...tusParametros);
    console.log('📤 Transacción enviada:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transacción confirmada:', receipt);
    
    // Debuggear
    await debugTransaction(tx.hash, provider);
  } catch (error) {
    console.error('❌ Error en transacción:', error);
  }
};
