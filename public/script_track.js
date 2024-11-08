document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    
    orderForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const orderId = document.getElementById('orderId').value.trim();
      
      if (orderId === '') {
        alert('Пожалуйста, введите номер заказа.');
        return;
      }
      
      try {
        const response = await fetch('/track-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId }),
        });
        
        if (!response.ok) {
          throw new Error('Ошибка сервера');
        }
        
        const data = await response.json();
        displayOrderStatus(data.status);
      } catch (error) {
        console.error('Произошла ошибка:', error);
        alert('Не удалось получить информацию о статусе заказа.');
      }
    });
  });
  
  function displayOrderStatus(status) {
    const statusDiv = document.getElementById('orderStatus');
    statusDiv.textContent = `Статус заказа: ${status}`;
    statusDiv.style.color = getStatusColor(status);
  }
  
  function getStatusColor(status) {
    switch (status.toLowerCase()) {
      case 'new':
        return 'red';
      case 'pending':
        return 'orange';
      case 'completed':
        return 'green';
      case 'delivered':
        return 'blue';
      default:
        return 'gray';
    }
  }
  