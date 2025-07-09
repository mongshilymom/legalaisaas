export const savePurchase = (sessionId: string) => {
  const history = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
  const newRecord = {
    id: sessionId,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('purchaseHistory', JSON.stringify([...history, newRecord]));
};