const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('db/my_database.db');

// Создание таблицы ролей пользователей
db.run(`
    CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_name VARCHAR(50) UNIQUE NOT NULL
    )
`);

// Создание таблицы пользователей
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE,
        password_hash VARCHAR(60),
        FIO VARCHAR(50),
        role_id INT DEFAULT '3',
        phone INT,
        FOREIGN KEY (role_id) REFERENCES user_roles(id)
    )
`);



// Создание таблицы заказов
db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number VARCHAR(20) UNIQUE NOT NULL,
        sender_id INT,
        order_date DATE DEFAULT CURRENT_DATE,
        total_amount DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'new',
        delivery_address VARCHAR(255),
        first_address VARCHAR(255),
        Driver_id INT,
        Recipient_id INT,
        FOREIGN KEY (Driver_id) REFERENCES users(id),
        FOREIGN KEY (Recipient_id) REFERENCES users(id)
    )
`);


// Создание таблицы упаковок
db.run(`
    CREATE TABLE IF NOT EXISTS packaging (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packaging_type VARCHAR(50),
        cost MONEY
    )
`);


// Создание таблицы грузов
db.run(`
    CREATE TABLE IF NOT EXISTS cargo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Order_id INT,
        cargo_type VARCHAR(50),
        weight DECIMAL(10, 2),
        dimensions VARCHAR(50),
        Pakage_id INT,
        FOREIGN KEY (Order_id) REFERENCES orders(id),
        FOREIGN KEY (Pakage_id) REFERENCES packaging(id)
    )
`);

db.all("SELECT name FROM sqlite_master WHERE type='table';", function(err, rows) {
    if (err) {
        console.error('Ошибка при получении списка таблиц:', err.message);
    } else {
        console.log('Существующие таблицы:');
        rows.forEach(row => console.log(row.name));
    }
});

// Функция для вставки данных в таблицу users
function insertUser(username, passwordHash, FIO, role_id) {
    db.run(`INSERT INTO users (username, password_hash, FIO, role_id) VALUES (?, ?, ?, ?)`,
      [username, passwordHash, FIO, role_id],
      function(err) {
        if (err) {
          console.error('Ошибка при вставке пользователя:', err.message);
        } else {
          console.log(`Пользователь ${username} успешно добавлен`);
        }
      });
  }
  
  // Функция для вставки данных в таблицу user_roles
  function insertUserRole(role_name) {
    db.run(`INSERT INTO user_roles (role_name) VALUES (?)`,
      [role_name],
      function(err) {
        if (err) {
          console.error('Ошибка при вставке роли пользователя:', err.message);
        } else {
          console.log(`Роль "${role_name}" успешно добавлена`);
        }
      });
  }
  
  // Функция для вставки данных в таблицу orders
  function insertOrder(order_number, customer_id, total_amount, status, delivery_address, first_address, Driver_id, Recipient_id) {
    db.run(`INSERT INTO orders (order_number, sender_id, total_amount, status, delivery_address, first_address, Driver_id, Recipient_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_number, customer_id, total_amount, status, delivery_address, first_address, Driver_id, Recipient_id],
      function(err) {
        if (err) {
          console.error('Ошибка при вставке заказа:', err.message);
        } else {
          console.log(`Заказ "${order_number}" успешно добавлен`);
        }
      });
  }
  
  // Функция для вставки данных в таблицу cargo
  function insertCargo(Order_id, cargo_type, weight, dimensions, Pakage_id) {
    db.run(`INSERT INTO cargo (Order_id, cargo_type, weight, dimensions, Pakage_id) 
             VALUES (?, ?, ?, ?, ?)`,
      [Order_id, cargo_type, weight, dimensions, Pakage_id],
      function(err) {
        if (err) {
          console.error('Ошибка при вставке груза:', err.message);
        } else {
          console.log(`Груз для заказа "${Order_id}" успешно добавлен`);
        }
      });
  }
  
  // Функция для вставки данных в таблицу packaging
  function insertPackaging(packaging_type, cost) {
    db.run(`INSERT INTO packaging (packaging_type, cost) VALUES (?, ?)`,
      [packaging_type, cost],
      function(err) {
        if (err) {
          console.error('Ошибка при вставке упаковки:', err.message);
        } else {
          console.log(`Упаковка типа "${packaging_type}" успешно добавлена`);
        }
      });
  }
  
  // Основная функция заполнения базы данных тестовыми данными
  async function fillDatabase() {
    // Вставка пользователей и ролей
    await Promise.all([
        insertUserRole('admin'),
      insertUserRole('user'),
      insertUserRole('driver'),
      insertUser('admin', '$2b$10$91d60587bc234c4db235ed8ddbfedaf8f0fffd4309c4bb742c460e', 'Иван Иванов', 1),
      insertUser('user1', '$2b$10$91d60587bc234c4db235ed8ddbfedaf8f0fffd4309c4bb742c460e', 'Петр Петров', 2),
      insertUser('driver1', '$2b$10$91d60587bc234c4db235ed8ddbfed8ddbfedaf8f0fffd4309c4bb742c460e', 'Сидор Сидоров', 3)
    ]);
  
    // Вставка заказов
    await Promise.all([
      insertOrder('ORD001', 1, 100.00, 'completed', 'ул. Ленина, д. 1', 'ул. Пушкина, д. 2', 3, 1),
      insertOrder('ORD002', 2, 200.00, 'pending', 'г. Москва, ул. Красная площадь', 'г. Санкт-Петербург, проспект Невский', 3, 2)
    ]);
  
    // Вставка грузов
    await Promise.all([
      insertCargo(1, 'фрукты', 50.00, '100x50x30', 1),
      insertCargo(2, 'овощи', 150.00, '50x30x40', 2)
    ]);
  
    // Вставка упаковки
    await Promise.all([
      insertPackaging('коробка', 10.00),
      insertPackaging('мешок', 5.00)
    ]);
  }
  
  // Запуск заполнения базы данных
  fillDatabase()
    .then(() => {
      db.close();
      console.log('База данных успешно наполнена тестовыми данными');
    })
    .catch(error => {
      console.error('Произошла ошибка при заполнении базы данных:', error.message);
      db.close();
    });

// Закрытие соединения с базой данных
db.close();
console.log("Таблицы успешно созданы");
