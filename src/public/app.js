const ISSUE_URL = '/issue';
const RETURN_URL = '/return';
const HISTORY_URL = '/history';
const ISSUED_URL = '/issued';


const bookNameInput = document.getElementById('book-name');
const issueButton = document.getElementById('issue-button');
const cardsContainer = document.getElementById('cards-container');
const historyList = document.getElementById('history-list');


issueButton.addEventListener('click', () => {
    const bookName = bookNameInput.value.trim();
    if (!bookName) return alert('Please enter a book name!');

    fetch(ISSUE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_name: bookName }),
    })
        .then((res) => res.json())
        .then((data) => {
            addIssuedBookCard(data.id, bookName, new Date().toISOString(), 0);
            bookNameInput.value = ''; 
        })
        .catch((err) => console.error('Error issuing book:', err));
});


function addIssuedBookCard(id, bookName, issueTime, amountDue = 0) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.id = id;

    card.innerHTML = `
        <p><strong>Book Name:</strong> ${bookName}</p>
        <p><strong>Issue Time:</strong> ${new Date(issueTime).toLocaleString()}</p>
        <p class="amount"><strong>Amount Due:</strong> ₹${amountDue}</p>
        <button class="return-button">Return</button>
    `;

    card.querySelector('.return-button').addEventListener('click', () => {
        returnBook(id, card);
    });

    cardsContainer.appendChild(card);
}

function returnBook(id, card) {
    fetch(RETURN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
    })
        .then((res) => res.json())
        .then((data) => {
            alert('Book returned successfully!');
            card.remove(); 
            fetchHistory(); 
        })
        .catch((err) => console.error('Error returning book:', err));
}

function fetchIssuedBooks() {
    fetch(ISSUED_URL)
        .then((res) => res.json())
        .then((data) => {
            data.forEach((book) => {
                addIssuedBookCard(book.id, book.book_name, book.issue_time, book.amount_due);
            });
        })
        .catch((err) => console.error('Error fetching issued books:', err));
}

function fetchHistory() {
    fetch(HISTORY_URL)
        .then((res) => res.json())
        .then((data) => {
            historyList.innerHTML = ''; 
            data.forEach((item) => {
                const historyItem = document.createElement('li');
                historyItem.innerHTML = `
                    <strong>Book Name:</strong> ${item.book_name} <br />
                    <strong>Issue Time:</strong> ${new Date(item.issue_time).toLocaleString()} <br />
                    <strong>Return Time:</strong> ${new Date(item.return_time).toLocaleString()} <br />
                    <strong>Amount Paid:</strong> ₹${item.amount_paid}
                `;
                historyList.appendChild(historyItem);
            });
        })
        .catch((err) => console.error('Error fetching history:', err));
}


fetchIssuedBooks(); 
fetchHistory();     