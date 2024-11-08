document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('createOrderForm');
    
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const senderFullName = document.getElementById('senderFullName').value.trim();
      const senderAddress = document.getElementById('senderAddress').value.trim();
      const senderPhone = document.getElementById('senderPhone').value.trim();
      
      const recipientFullName = document.getElementById('recipientFullName').value.trim();
      const recipientAddress = document.getElementById('recipientAddress').value.trim();
      const recipientPhone = document.getElementById('recipientPhone').value.trim();
      
      const cargoType = document.getElementById('cargoType').value;
      const cargoWeight = parseFloat(document.getElementById('cargoWeight').value);
      const cargoVolume = parseFloat(document.getElementById('cargoVolume').value);
      
      const packagingType = document.getElementById('packagingType').value;
  
      if (!senderFullName || !senderAddress || !senderPhone ||
          !recipientFullName || !recipientAddress || !recipientPhone ||
          !cargoType || !cargoWeight || !cargoVolume || !packagingType) {
        alert('Пожалуйста, заполните все поля.');
        return;
      }
  
      try {
        const response = await fetch('/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            senderFullName, senderAddress, senderPhone,
            recipientFullName, recipientAddress, recipientPhone,
            cargoType, cargoWeight, cargoVolume,
            packagingType
          }),
        });
  
        if (!response.ok) {
          throw new Error('Ошибка сервера');
        }
  
        const data = await response.json();
        showOrderCreationResult(data.message, data.orderId);
      } catch (error) {
        console.error('Произошла ошибка:', error);
        alert('Не удалось создать заказ. Попробуйте позже.');
      }
    });
  });
  
  function showOrderCreationResult(message, orderId) {
    const resultDiv = document.createElement('div');
    resultDiv.textContent = `${message}. ID заказа: ${orderId}`;
    resultDiv.style.color = 'green';
    resultDiv.style.marginTop = '20px';
  
    const form = document.getElementById('createOrderForm');
    form.parentNode.insertBefore(resultDiv, form.nextSibling);
  
    setTimeout(() => {
      resultDiv.remove();
    }, 5000); // Удаление результата через 5 секунд
  }
  