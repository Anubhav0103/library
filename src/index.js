const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'books',
    port: 3307
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed', err);
        return;
    }
    console.log('Database connected...');
});

app.post('/issue', (req, res) => {
    const { book_name } = req.body;
    const query = "INSERT INTO book_transactions (book_name, issue_time) VALUES (?, NOW())";
    db.query(query, [book_name], (err, result) => {
        if (err) {
            console.error('Error issuing book:', err);
            res.status(500).send('Error issuing books');
        } else {
            res.status(200).send({ message: 'Book issued successfully', id: result.insertId });
        }
    });
});

app.post('/return', (req, res) => {
    const { id } = req.body;
    const query = `
        UPDATE book_transactions 
        SET 
            return_time = NOW(), 
            amount_paid = CASE 
                WHEN TIMESTAMPDIFF(HOUR, issue_time, NOW()) > 1 
                THEN (TIMESTAMPDIFF(HOUR, issue_time, NOW()) - 1) * 10 
                ELSE 0 
            END 
        WHERE id = ? AND return_time IS NULL;
    `;
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error returning book:', err);
            res.status(500).send('Error returning book');
        } else if (result.affectedRows === 0) {
            res.status(404).send('Book not found or already returned');
        } else {
            res.status(200).send({ message: 'Book returned successfully' });
        }
    });
});


app.get('/issued', (req, res) => {
    const query = `
        SELECT id, book_name, issue_time, 
               CASE 
                   WHEN TIMESTAMPDIFF(HOUR, issue_time, NOW()) > 1 
                   THEN (TIMESTAMPDIFF(HOUR, issue_time, NOW()) - 1) * 10 
                   ELSE 0 
               END AS amount_due
        FROM book_transactions 
        WHERE return_time IS NULL
        ORDER BY issue_time DESC; -- Sorting by most recently issued
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching issued books:', err);
            return res.status(500).send('Error fetching issued books');
        }
        res.status(200).json(results);
    });
});


app.get('/history', (req, res) => {
    const query = `
        SELECT book_name, issue_time, return_time, amount_paid 
        FROM book_transactions 
        WHERE return_time IS NOT NULL 
        ORDER BY return_time DESC; -- Sorting by most recently returned
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching history:', err);
            return res.status(500).send('Error fetching history');
        }
        res.status(200).json(results);
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
