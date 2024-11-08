import { JSDOM } from 'jsdom';
import express from 'express';

const app = express();

// Настройка JSDOM
const dom = new JSDOM('<html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Мокирование Express
app.use(express.json());

// Используем мок для имитации работы cookie-parser
jest.mock('cookie-parser', () => ({
  parse: jest.fn(),
}));

describe('Register route tests', () => {
  test('Should create a new user', async () => {
    const mockRequest = {
      body: {
        username: 'testuser',
        password: 'password123',
        fio: 'Test User',
        role: 'customer'
      }
    };

    const mockResponse = {
      json: jest.fn()
    };

    await registerUser(mockRequest.body.username, mockRequest.body.password, mockRequest.body.fio, mockRequest.body.role);

    expect(db.run).toHaveBeenCalledWith('INSERT INTO users (username, password_hash, FIO, role_id) VALUES (?,?,?,?)', 
      ['testuser', expect.any(String), 'Test User', 'customer']);
  });

  test('Should fail to create a user due to database error', async () => {
    const mockRequest = {
      body: {
        username: 'testuser',
        password: 'password123',
        fio: 'Test User',
        role: 'customer'
      }
    };

    const mockResponse = {
      json: jest.fn()
    };

    db.run.mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const result = await registerUser(mockRequest.body.username, mockRequest.body.password, mockRequest.body.fio, mockRequest.body.role);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});

describe('Track order route tests', () => {
  test('Should return order status', async () => {
    const mockRequest = {
      body: {
        orderId: 'ORD-12345678'
      }
    };

    const mockResponse = {
      json: jest.fn()
    };

    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, { status: 'shipped' });
    });

    await trackOrder(mockRequest.body.orderId);

    expect(db.get).toHaveBeenCalledWith('SELECT status FROM orders WHERE order_number=?', ['ORD-12345678']);
    expect(mockResponse.json).toHaveBeenCalledWith({ status: 'shipped' });
  });

  test('Should return error if order not found', async () => {
    const mockRequest = {
      body: {
        orderId: 'ORD-99999999'
      }
    };

    const mockResponse = {
      json: jest.fn()
    };

    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, null);
    });

    await trackOrder(mockRequest.body.orderId);

    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Заказ не найден' });
  });
});

describe('API routes tests', () => {
  beforeEach(() => {
    db.all.mockReset();
  });

  test('Should get users', async () => {
    const mockUsers = [
      { id: 1, username: 'user1', FIO: 'User 1', role_id: 1, phone: '+79123456789' },
      { id: 2, username: 'user2', FIO: 'User 2', role_id: 2, phone: '+79234567890' }
    ];

    db.all.mockResolvedValueOnce(mockUsers);

    const response = await apiGetUsers();

    expect(db.all).toHaveBeenCalledWith("SELECT * FROM users", []);
    expect(response).toEqual(mockUsers);
  });

  test('Should get orders', async () => {
    const mockOrders = [
      { id: 1, order_number: 'ORD-12345678', sender_id: 1, Recipient_id: 2, delivery_address: 'Delivery Address', first_address: 'First Address', total_amount: 100.00 },
      { id: 2, order_number: 'ORD-87654321', sender_id: 2, Recipient_id: 1, delivery_address: 'Delivery Address 2', first_address: 'First Address 2', total_amount: 200.00 }
    ];

    db.all.mockResolvedValueOnce(mockOrders);

    const response = await apiGetOrders();

    expect(db.all).toHaveBeenCalledWith("SELECT * FROM orders", []);
    expect(response).toEqual(mockOrders);
  });

  test('Should get packaging', async () => {
    const mockPackaging = [
      { id: 1, packaging_type: 'standard', cost: 10.00 },
      { id: 2, packaging_type: 'express', cost: 15.00 }
    ];

    db.all.mockResolvedValueOnce(mockPackaging);

    const response = await apiGetPackaging();

    expect(db.all).toHaveBeenCalledWith("SELECT * FROM packaging", []);
    expect(response).toEqual(mockPackaging);
  });
});

describe('Create order route tests', () => {
  test('Should create a new order', async () => {
    const mockRequest = {
      body: {
        senderPhone: '+79001234567',
        senderFullName: 'Sender Name',
        senderAddress: 'Sender Address',
        recipientPhone: '+79009876543',
        recipientFullName: 'Recipient Name',
        recipientAddress: 'Recipient Address',
        cargoType: 'general',
        cargoWeight: 50,
        cargoVolume: '1x1x1',
        packagingType: 'standard'
      }
    };

    const mockResponse = {
      json: jest.fn()
    };

    await createOrder(mockRequest.body);

    expect(getUser).toHaveBeenCalledWith('+79001234567', 'Sender Name');
    expect(getUser).toHaveBeenCalledWith('+79009876543', 'Recipient Name');
    expect(generateRandomOrderId).toHaveBeenCalled();
    expect(db.prepare).toHaveBeenCalledWith(`INSERT INTO orders (...) VALUES (...)`);
    expect(db.prepare).toHaveBeenCalledWith(`INSERT INTO cargo (...) VALUES (...)`);
    expect(db.run).toHaveBeenCalledWith(`UPDATE orders SET total_amount =? WHERE id =?`, expect.any(Number));
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Заказ успешно создан',
      orderId: expect.any(String)
    });
  });

  test('Should throw error if user creation fails', async () => {
    const mockRequest = {
      body: {
        senderPhone: '+79001234567',
        senderFullName: 'Sender Name',
        senderAddress: 'Sender Address',
        recipientPhone: '+79009876543',
        recipientFullName: 'Recipient Name',
        recipientAddress: 'Recipient Address',
        cargoType: 'general',
        cargoWeight: 50,
        cargoVolume: '1x1x1',
        packagingType: 'standard'
      }
    };

    const mockResponse = {
      json: jest.fn()
    };

    getUser.mockRejectedValueOnce(new Error('User creation failed'));

    try {
      await createOrder(mockRequest.body);
    } catch (error) {
      expect(error.message).toBe('Не удалось получить или создать пользователя');
    }
  });
});

describe('Track order route tests', () => {
  test('Should return order status', async () => {
    const mockRequest = {
      body: {
        orderId: 'ORD-12345678'
      }
    };

    const mockResponse = {
      json: jest.fn()
    };

    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, { status: 'shipped' });
    });

    await trackOrder(mockRequest.body.orderId);

    expect(db.get).toHaveBeenCalledWith('SELECT status FROM orders WHERE order_number=?', ['ORD-12345678']);
    expect(mockResponse.json).toHaveBeenCalledWith({ status: 'shipped' });
  });

  test('Should return error if order not found', async () => {
    const mockRequest = {
      body: {
        orderId: 'ORD-99999999'
      }
    };

    const mockResponse = {
      json: jest.fn()
    };

    db.get.mockImplementationOnce((sql, params, callback) => {
      callback(null, null);
    });

    await trackOrder(mockRequest.body.orderId);

    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Заказ не найден' });
  });
});

