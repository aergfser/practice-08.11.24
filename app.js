const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db/my_database.db');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public')); 
//app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
//app.use('/views', express.static(path.join(__dirname, 'client/build')));



// Middleware для статических файлов
//app.use('/views', express.static(path.join(__dirname, 'views')));

app.use(bodyParser.urlencoded({ extended: true }));

// Константы для токенов
const crypto = require('crypto');
const SECRET_KEY = crypto.randomBytes(32).toString('base64');
const bcrypt = require('bcrypt');


// Функция для генерации токена
function generateToken(user) {
  return jwt.sign(user, SECRET_KEY);
}

// Функция для проверки токена
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded;
  } catch (err) {
    return null;
  }
}

async function getHash(inputString) {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = await bcrypt.hashSync(inputString, salt);
  return hash;
}

async function registerUser(username, password, fio, role) {
  try {
    const hash = await getHash(password);
    await db.run('INSERT INTO users (username, password_hash, FIO, role_id) VALUES (?, ?, ?, ?)', 
      [username, hash, fio, role]);
    return { success: true };
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    return { success: false, error: error.message };
  }
}

// Маршрут для регистрации
app.post('/register', async (req, res) => {
  const { username, password, fio, role } = req.body;

  try {
    const result = await registerUser(username, password, fio, role);
    
    if (result.success) {
      res.status(201).json(result);
      console.log("Регистрация успешна");
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Неожиданная ошибка при регистрации:', error);
    res.status(500).json({ error: 'Ошибка при регистрации' });
  }
});

app.post('/track-order', (req, res) => {
  const orderId = req.body.orderId;
  
db.get(`SELECT status FROM orders WHERE order_number = ?`, [orderId], (err, row) => {
  if (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка базы данных' });
  } else if (!row) {
    res.status(404).json({ error: 'Заказ не найден' });
  } else {
    res.json({ status: row.status });
  }
});
});

function getuser(log) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username=?", log, (err, row) => {
      if (err) return reject(err)
      const i = row ?? null;
      resolve(i)
    });
  })
}

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {

    getuser(username)
  .then(async i => {
    if (i == null){
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    const isMatch = await new Promise((resolve, reject) => {
        bcrypt.compare( password, i.password_hash, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });

      if (!isMatch) {
          return res.status(401).json({ error: 'Неверные учетные данные (пароль)' });
        }

      const token = generateToken(i);
      res.json({ token });
  })

  } catch (error) {
    console.error('Ошибка при аутентификации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});


app.use(express.static('public', {
  setHeaders: function(res, path, stat) {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

//Middleware для проверки токена
// app.use((req, res, next) => {

//   const token = req.headers['authorization'];
//   if (!token) return res.status(401).json({ error: 'No token provided' });

//   const decoded = verifyToken(token);
//   if (!decoded) return res.status(403).json({ error: 'Invalid token' });

//   req.user = decoded;
//   next();
// });


// Маршрут для корневого URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'track-order.html'));
});

// Маршрут для отслеживания заказа
app.get('/track-order', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'track-order.html'));
});

// Маршрут для POST-запросов
app.post('/track-order', (req, res) => {
  const orderId = req.body.orderId;
  console.log(`Получен запрос на отслеживание заказа ${orderId}`);
  
  res.json({ message: `Заказ ${orderId} успешно отслежен` });
});

app.get('/create-order', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create-order.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-orders.html'));
});

app.get('/admin/packaging', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-pack.html'));
});

app.post('/api/packaging', async (req, res) => {
  const { packaging_type, cost } = req.body;

  // Validate input
  if (!packaging_type || typeof packaging_type !== 'string') {
      return res.status(400).json({ error: 'Packaging type is required and must be a string.' });
  }

  if (typeof cost !== 'number' || isNaN(cost)) {
      return res.status(400).json({ error: 'Cost must be a valid number.' });
  }

  try {
      await db.run('INSERT INTO packaging (packaging_type, cost) VALUES (?, ?)', 
          packaging_type, cost);

      res.json({
          message: 'Packaging added successfully',
          data: {
              id: db.lastID,
              packaging_type,
              cost: cost.toFixed(2)
          }
      });
  } catch (error) {
      console.error('Error adding packaging:', error);
      res.status(500).json({ error: 'Failed to add packaging. Please try again later.' });
  }
});

function checkAccess(req, res, next) {

    next();

}

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);
  // res.cookie('authToken', token, { maxAge: 30 * 24 * 60 * 1000 }); // Срок действия 30 дней

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    // res.cookie('userData', user, { maxAge: 30 * 24 * 60 * 1000 });

    next();
  });
}

app.get('/api/user', authenticateToken, (req, res) => {
  const username = req.user.username;
  const role = req.user.role_id;
  
  res.json({
    username,
    role
  });
});


// Функция для получения или создания пользователя
async function getUser(phoneNumber, fio) {
  try {
    return new Promise((resolve, reject) => {
      db.get(`SELECT id FROM users WHERE phone = ?`, [phoneNumber], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(row.id);
        } else {
          db.run('INSERT INTO users (FIO, phone) VALUES (?, ?)', 
          [fio, phoneNumber]);
          resolve (getUser(phoneNumber, fio));
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при получении или создании пользователя:', error);
    throw new Error('Не удалось получить или создать пользователя');
  }
}


function generateRandomOrderId(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `ORD-${result.toUpperCase()}`;
}

// Рутина API для создания заказа
app.post('/create-order', async (req, res) => {
  try {
    const { 
      senderPhone, senderFullName, senderAddress, 
      recipientPhone, recipientFullName, recipientAddress,
      cargoType, cargoWeight, cargoVolume,
      packagingType
    } = req.body;

    let senderId, recipientId;

    //Получаем или создаем ID отправителя и получателя одновременно
    const [senderIdPromise, recipientIdPromise] = [
      getUser(senderPhone, senderFullName),
      getUser(recipientPhone, recipientFullName)
    ];
    
    try {
      const [senderId, recipientId] = await Promise.all([senderIdPromise, recipientIdPromise]);
      console.log('Получены ID пользователей:', senderId, recipientId);
    } catch (error) {
      console.error('Ошибка при получении ID пользователей:', error);
    }


    let orderNum = generateRandomOrderId();
    console.log(orderNum);


    // Вставка заказа в таблицу orders
    const orderInsertResult = await db.prepare(
      `INSERT INTO orders (order_number, sender_id, Recipient_id, delivery_address, first_address, total_amount) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      orderNum,
      senderId,
      recipientId,
      `${recipientAddress}`,
      `${senderAddress}`,
      0 // общая сумма пока неизвестна
    );

    const orderId = orderInsertResult.lastID;

    // Вставка груза в таблицу cargo
    await db.prepare(`
      INSERT INTO cargo (Order_id, cargo_type, weight, dimensions, Pakage_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      orderId,
      cargoType,
      cargoWeight,
      `${cargoVolume} x ${cargoVolume} x ${cargoVolume}`,
      packagingType
    );

    // Получение общей суммы заказа
    const totalAmount = await db.get(`
      SELECT SUM(p.cost) AS total_amount
      FROM packaging p
      JOIN cargo c ON c.Pakage_id = p.id
      WHERE c.Order_id = ?
    `, orderId);

    // Обновление общей суммы заказа
    await db.run(
      `UPDATE orders SET total_amount = ? WHERE id = ?`,
      totalAmount.total_amount || 0,
      orderId
    );

    res.status(201).json({ message: 'Заказ успешно создан', orderId });
  } catch (error) {
    console.error('Ошибка при создании заказа:', error);
    res.status(500).json({ error: 'Произошла ошибка при создании заказа' });
  }
});

// app.get('/api/roles', (req, res) => {
//   db.all('SELECT * FROM roles ORDER BY id ASC', [], (err, rows) => {
//       if (err) {
//           console.error(err.message);
//           res.status(500).send({ message: 'Ошибка при получении ролей' });
//       } else {
//           res.send(rows);
//       }
//   });
// });

app.post('/api/users', (req, res) => {
  const { username, FIO, role_id, phone } = req.body;
  
  db.run(`INSERT INTO users (username, FIO, role_id, phone) VALUES (?, ?, ?, ?)`,
    [username, FIO, role_id, phone],
    function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).send({ message: 'Ошибка при добавлении пользователя' });
        } else {
            res.send({ message: 'Пользователь успешно добавлен' });
        }
    });
});


// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
// });


app.get('/api/users', (req, res) => {
  console.log('API endpoint /api/users received request');
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Ошибка при получении данных');
    } else {
      res.json(rows);
    }
  });
});

app.get('/api/orders', (req, res) => {
  db.all("SELECT * FROM orders", [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Ошибка при получении данных');
    } else {
      res.json(rows);
    }
  });
});

app.get('/api/packaging', (req, res) => {
  db.all("SELECT * FROM packaging", [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Ошибка при получении данных');
    } else {
      res.json(rows);
    }
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


//порт 3000 отчистить