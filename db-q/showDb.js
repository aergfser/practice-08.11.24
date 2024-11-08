const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('db/my_database.db');

// Функция для вывода данных из таблицы
function printTableData(tableName) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err) {
                console.error(`Ошибка при выборке данных из таблицы ${tableName}:`, err.message);
                reject(err);
            } else {
                console.log(`Данные из таблицы ${tableName}:`);
                rows.forEach(row => {
                    console.log(JSON.stringify(row, null, 2));
                });
                resolve();
            }
        });
    });
}

// Вывод данных из всех таблиц
async function printAllData() {
    try {
        await printTableData('users');
        await printTableData('user_roles');
        await printTableData('orders');
        await printTableData('cargo');
        await printTableData('packaging');
        console.log("Вывод данных завершен.");
    } catch (error) {
        console.error("Произошла ошибка при выводе данных:", error.message);
    } finally {
        db.close();
    }
}

printAllData().catch(error => {
    console.error("Не удалось выполнить запрос:", error.message);
});
