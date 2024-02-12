
const sqlite3 = require('sqlite3').verbose()
let sql

const db = new sqlite3.Database('./test.db', sqlite3.OPEN_READWRITE,(err) => {
    if (err) return console.error(err.message)
})

sql ='delete from Pairs'
db.run(sql)