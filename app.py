from flask import Flask, render_template, jsonify, request
import sqlite3

app = Flask(__name__)
DB_PATH = 'hadit.sqlite'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/books')
def get_books():
    conn = get_db_connection()
    # Exclude 'সুনান আদ-দারাকুতনী' (id 28) from the home screen
    books = conn.execute('SELECT * FROM books WHERE id != 28').fetchall()
    conn.close()
    return jsonify([dict(book) for book in books])

@app.route('/api/hadiths/<int:book_id>')
def get_hadiths(book_id):
    conn = get_db_connection()
    hadiths = conn.execute('SELECT * FROM hadiths WHERE book_id = ?', (book_id,)).fetchall()
    conn.close()
    return jsonify([dict(hadith) for hadith in hadiths])

@app.route('/api/search')
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])

    conn = get_db_connection()
    # Search in hadiths text and join with books to get book title
    search_query = '''
        SELECT h.*, b.title as book_title
        FROM hadiths h
        JOIN books b ON h.book_id = b.id
        WHERE h.arabic_text LIKE ? OR h.english_text LIKE ? OR b.title LIKE ?
    '''
    param = f'%{query}%'
    results = conn.execute(search_query, (param, param, param)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in results])

if __name__ == '__main__':
    app.run(debug=True)
