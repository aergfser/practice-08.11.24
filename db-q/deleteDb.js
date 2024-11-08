const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('db/my_database.db');

// Функция для удаления таблицы
function dropTable(tableName) {
    return new Promise((resolve, reject) => {
        db.run(`DROP TABLE IF EXISTS ${tableName}`, function(err) {
            if (err) {
                console.error(`Ошибка при удалении таблицы ${tableName}:`, err.message);
                reject(err);
            } else {
                console.log(`Таблица ${tableName} успешно удалена`);
                resolve();
            }
        });
    });
}

// Список таблиц для удаления
const tablesToDelete = [
    'users',
    'user_roles',
    'orders',
    'cargo',
    'packaging'
];

// Функция для асинхронного выполнения нескольких операций
async function deleteTables() {
    for (let table of tablesToDelete) {
        await dropTable(table);
    }
    db.close();
    console.log("Все таблицы успешно удалены");
}

deleteTables().catch(error => {
    console.error("Произошла ошибка при удалении таблиц:", error.message);
});
