document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const booksGrid = document.getElementById('books-grid');
    const booksSection = document.getElementById('books-section');
    const hadithsSection = document.getElementById('hadiths-section');
    const hadithsList = document.getElementById('hadiths-list');
    const currentBookTitle = document.getElementById('current-book-title');
    const backButton = document.getElementById('back-button');
    const searchResultsSection = document.getElementById('search-results-section');
    const searchResultsList = document.getElementById('search-results-list');
    const clearSearchButton = document.getElementById('clear-search');
    const loadingOverlay = document.getElementById('loading-overlay');

    const themeBtns = document.querySelectorAll('.theme-switcher button');
    const langEnBtn = document.getElementById('lang-en');
    const langBnBtn = document.getElementById('lang-bn');

    const translations = {
        en: {
            heroTitle: "Explore the Authentic Traditions",
            heroSubtitle: "Access the most reliable Hadith collections with ease and elegance.",
            sectionBooks: "Hadith Collections",
            searchPlaceholder: "Search Hadiths, Subjects, or Books...",
            searchBtn: "Search",
            resultsTitle: "Search Results",
            backBtn: "Back to Books",
            clearBtn: "Clear Search",
            loading: "Loading...",
            noResults: "No results found for",
            noHadiths: "No hadiths found in this collection."
        },
        bn: {
            heroTitle: "সহীহ সিত্তাহ অনুসন্ধান করুন",
            heroSubtitle: "সহজ এবং মার্জিতভাবে সবচেয়ে নির্ভরযোগ্য হাদীস সংগ্রহগুলো অ্যাক্সেস করুন।",
            sectionBooks: "হাদীস সংগ্রহসমূহ",
            searchPlaceholder: "হাদীস, বিষয় বা বই খুঁজুন...",
            searchBtn: "খুঁজুন",
            resultsTitle: "অনুসন্ধানের ফলাফল",
            backBtn: "বইয়ে ফিরে যান",
            clearBtn: "অনুসন্ধান মুছে ফেলুন",
            loading: "লোড হচ্ছে...",
            noResults: "এর জন্য কোন ফলাফল পাওয়া যায়নি",
            noHadiths: "এই সংগ্রহে কোন হাদীস পাওয়া যায়নি।"
        }
    };

    let currentLang = 'en';

    function hideLoader() {
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.visibility = 'hidden';
            document.body.classList.remove('loading');
        }
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
        });
    }

    themeBtns.forEach(btn => {
        btn.onclick = () => setTheme(btn.getAttribute('data-theme'));
    });

    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        langEnBtn.classList.toggle('active', lang === 'en');
        langBnBtn.classList.toggle('active', lang === 'bn');
        document.getElementById('hero-title').innerText = translations[lang].heroTitle;
        document.getElementById('hero-subtitle').innerText = translations[lang].heroSubtitle;
        document.getElementById('section-books-title').innerText = translations[lang].sectionBooks;
        document.getElementById('search-input').placeholder = translations[lang].searchPlaceholder;
        document.getElementById('search-button').innerText = translations[lang].searchBtn;
        document.getElementById('search-results-title').innerText = translations[lang].resultsTitle;
        document.querySelectorAll('.lang-en').forEach(el => el.classList.toggle('hidden', lang === 'bn'));
        document.querySelectorAll('.lang-bn').forEach(el => el.classList.toggle('hidden', lang === 'en'));
    }

    langEnBtn.onclick = () => setLanguage('en');
    langBnBtn.onclick = () => setLanguage('bn');

    const savedLang = localStorage.getItem('lang') || 'en';
    setLanguage(savedLang);

    async function loadBooks() {
        try {
            const response = await fetch('/api/books');
            const books = await response.json();
            booksGrid.innerHTML = '';
            books.forEach(book => {
                const card = document.createElement('div');
                card.className = 'book-card';
                const bookIcon = '📖';

                // FIX: Correct Name Logic
                const nameEn = book.name_en || book.title;
                const nameBn = book.title; // In this DB, 'title' is usually the Bangla name

                card.innerHTML = `
                    <div class="book-icon">${bookIcon}</div>
                    <h3 class="book-title" data-en="${nameEn}" data-bn="${nameBn}">${currentLang === 'bn' ? nameBn : nameEn}</h3>
                `;
                card.onclick = () => loadHadiths(book.id, nameEn);
                booksGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading books:', error);
        } finally {
            setTimeout(hideLoader, 150); // ULTRA FAST
        }
    }

    function updateBookTitles() {
        document.querySelectorAll('.book-title').forEach(titleEl => {
            const en = titleEl.getAttribute('data-en');
            const bn = titleEl.getAttribute('data-bn');
            titleEl.innerText = currentLang === 'bn' ? bn : en;
            titleEl.classList.toggle('lang-bn', currentLang === 'bn');
        });
    }

    const originalSetLanguage = setLanguage;
    setLanguage = (lang) => {
        originalSetLanguage(lang);
        updateBookTitles();
    };

    async function loadHadiths(bookId, title) {
        try {
            currentBookTitle.innerText = title;
            booksSection.classList.add('hidden');
            searchResultsSection.classList.add('hidden');
            hadithsSection.classList.remove('hidden');
            hadithsList.innerHTML = `<p style="text-align:center">${translations[currentLang].loading}</p>`;

            const response = await fetch(`/api/hadiths/${bookId}`);
            const hadiths = await response.json();

            hadithsList.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'hadith-container';

            if (hadiths.length === 0) {
                wrapper.innerHTML = `<p style="text-align:center">${translations[currentLang].noHadiths}</p>`;
                hadithsList.appendChild(wrapper);
                return;
            }

            hadiths.forEach(hadith => {
                const item = document.createElement('div');
                item.className = 'hadith-item';
                item.innerHTML = `
                    <div class="arabic-text">${hadith.arabic_text}</div>
                    <div class="english-text">${hadith.english_text}</div>
                    <span class="narrator">Narrated by: ${hadith.english_narrator || 'Unknown'}</span>
                `;
                wrapper.appendChild(item);
            });
            hadithsList.appendChild(wrapper);
        } catch (error) {
            console.error('Error loading hadiths:', error);
        }
    }

    async function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        try {
            booksSection.classList.add('hidden');
            hadithsSection.classList.add('hidden');
            searchResultsSection.classList.remove('hidden');
            searchResultsList.innerHTML = `<p style="text-align:center">${translations[currentLang].loading}</p>`;

            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();

            searchResultsList.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'hadith-container';

            if (results.length === 0) {
                wrapper.innerHTML = `<p style="text-align:center">${translations[currentLang].noResults} "${query}"</p>`;
                searchResultsList.appendChild(wrapper);
                return;
            }

            results.forEach(res => {
                const item = document.createElement('div');
                item.className = 'hadith-item';
                item.innerHTML = `
                    <div style="font-weight:600; color:var(--primary-color); margin-bottom:10px;">Book: ${res.book_title}</div>
                    <div class="arabic-text">${res.arabic_text}</div>
                    <div class="english-text">${res.english_text}</div>
                    <span class="narrator">Narrated by: ${res.english_narrator || 'Unknown'}</span>
                `;
                wrapper.appendChild(item);
            });
            searchResultsList.appendChild(wrapper);
        } catch (error) {
            console.error('Error searching:', error);
        }
    }

    backButton.onclick = () => {
        hadithsSection.classList.add('hidden');
        booksSection.classList.remove('hidden');
    };

    clearSearchButton.onclick = () => {
        searchInput.value = '';
        searchResultsSection.classList.add('hidden');
        booksSection.classList.remove('hidden');
    };

    searchButton.onclick = performSearch;
    searchInput.onkeyup = (e) => {
        if (e.key === 'Enter') performSearch();
    };

    loadBooks();
});
