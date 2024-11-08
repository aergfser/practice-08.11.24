// module.exports = (app) => {
//     app.get('/api/user', authenticateToken, (req, res) => {
//       const username = req.user.username;
//       const role = req.user.role;
      
//       res.json({
//         username,
//         role
//       });
//     });

//     app.get('/track-order', (req, res) => {
//       res.sendFile(path.join(__dirname, '../views/track-order.html'));
//     });
  
//     app.post('/track-order', (req, res) => {
//       const orderId = req.body.orderId;
//       // Здесь вы можете добавить логику для проверки и обработки заказа
//       console.log(`Получен запрос на отслеживание заказа ${orderId}`);
      
//       // Пример ответа клиенту
//       res.json({ message: `Заказ ${orderId} успешно отслежен` });
//     });
//   };
  