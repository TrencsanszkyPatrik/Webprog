async function loadData() {
    try {
        const response = await fetch('data/events.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Hiba az adatok betöltésekor:', error);
        return null;
    }
}

async function filterEventsByCategory(category) {
    const data = await loadData();
    if (data) {
        //osszes vagy kategoria szerinti gombok
        const filteredEvents = category === 'all' 
            ? data.events 
            : data.events.filter(event => event.category === category);
        updateUI(filteredEvents, data.categories);
    }
}

//keresomezo
function setupSearch() {
    const searchForm = document.querySelector('form');
    const searchInput = searchForm.querySelector('input');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const searchTerm = searchInput.value.toLowerCase(); //kisbetusit
        const data = await loadData();
        
        if (data) {
            //vizsgalja a cimet, leirast, es a tageket
            const filteredEvents = data.events.filter(event => 
                event.title.toLowerCase().includes(searchTerm) ||
                event.description.toLowerCase().includes(searchTerm) ||
                event.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
            updateUI(filteredEvents, data.categories);
        }
    });
}

function updateUI(events, categories) {
    displayEvents(events, categories);
}

//Kategoriagombok megjelenitese
function displayCategories(categories) {
    const categoriesContainer = document.getElementById('categories');
    //eloszor az osszesgomb
    categoriesContainer.innerHTML = `
        <div class="col-6 col-sm-4 col-md-3 col-lg-1">
            <div class="card category-card text-center p-7" data-category="all">
                <i class="bi bi-grid-3x3-gap fs-1 mb-2"></i>
                <h5 class="card-title">Összes</h5>
            </div>
        </div>
        ${categories.map(category => `
            <div class="col-6 col-sm-4 col-md-3 col-lg-1">
                <div class="card category-card text-center p-7" data-category="${category.name}">
                    ${category.logo ? `
                        <div class="category-logo-container mb-2">
                            <img src="images/${category.logo}" alt="${category.displayName}" class="category-logo">
                        </div>
                    ` : `
                        <i class="bi bi-${category.icon} fs-1 mb-2"></i>
                    `}
                    <h5 class="card-title">${category.displayName}</h5>
                </div>
            </div>
        `).join('')}`;

    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            filterEventsByCategory(category);
        });
    });
}

function displayEvents(events, categories) {
    const eventsContainer = document.getElementById('upcoming-events');
    eventsContainer.innerHTML = events.map(event => {
        const category = categories.find(cat => cat.name === event.category);
        const categoryIconHtml = category ? 
            `<div class="position-absolute top-0 end-0 p-2">
                 <i class="bi bi-${category.icon} fs-4" style="background: white; padding: 5px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></i>
             </div>` : 
            '';

        const imageUrl = event.image.startsWith('http://') || event.image.startsWith('https://') ? 
                         event.image : 
                         `images/${event.image}`;

        return `
            <div class="col-md-6 col-lg-4">
                <div class="card event-card" data-bs-toggle="modal" data-bs-target="#eventModal" data-event-id="${event.id}">
                    <div class="position-relative">
                         <img src="${imageUrl}" class="card-img-top" alt="${event.title}">
                         ${categoryIconHtml}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${event.title}</h5>
                        <p class="card-text">${event.description.substring(0, 100)}...</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="bi bi-calendar"></i> ${event.date}
                                <i class="bi bi-clock ms-2"></i> ${event.time}
                            </small>
                            <span class="badge bg-primary">${event.price}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function displayHeroEvent(event) {
    const heroSection = document.querySelector('.hero-section');

    if (heroSection) {
        heroSection.innerHTML = `
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <h1 class="display-4">${event.title}</h1>
                        <p class="lead">${event.description}</p>
                        <p class="lead"><i class="bi bi-calendar"></i> ${event.date} <i class="bi bi-clock ms-2"></i> ${event.time}</p>
                        <button class="btn btn-primary btn-lg mt-3" data-bs-toggle="modal" data-bs-target="#eventModal" data-event-id="${event.id}">Részletek megtekintése</button>
                    </div>
                    <div class="col-md-8">
                         <img src="${event.image.startsWith('http://') || event.image.startsWith('https://') ? 
                                event.image : 
                                `images/${event.image}`}"
                              class="img-fluid rounded shadow" 
                              alt="${event.title}">
                    </div>
                </div>
            </div>
        `;
    }
}

async function initializePage() {
    const data = await loadData(); 
    
    if (data) {
        const upcomingEvents = data.events.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
        });

        const closestEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
        
        if (closestEvent) {
            displayHeroEvent(closestEvent);
        }

        displayCategories(data.categories);
        displayEvents(upcomingEvents, data.categories);
        setupSearch(); 
        setupModal(); 
    }
}

function setupModal() {
     const eventModal = document.getElementById('eventModal');
    if (eventModal) {
        eventModal.addEventListener('show.bs.modal', async (event) => {
            const button = event.relatedTarget;
            const eventId = button.getAttribute('data-event-id');
            const data = await loadData();
            const selectedEvent = data.events.find(e => e.id === parseInt(eventId));
            const selectedOrganizer = selectedEvent.organizer;

            const imageUrl = selectedEvent.image.startsWith('http://') || selectedEvent.image.startsWith('https://') ? 
                         selectedEvent.image : 
                         `images/${selectedEvent.image}`;

            if (selectedEvent) {
                eventModal.querySelector('.modal-title').textContent = selectedEvent.title;
                eventModal.querySelector('.modal-body').innerHTML = `
                    <img src="${imageUrl}" class="img-fluid mb-3" alt="${selectedEvent.title}">
                    <p><strong>Dátum:</strong> ${selectedEvent.date}</p>
                    <p><strong>Idő:</strong> ${selectedEvent.time}</p>
                    <p><strong>Ár:</strong> ${selectedEvent.price}</p>
                    <p><strong>Leírás:</strong> ${selectedEvent.description}</p>
                    ${selectedOrganizer ? `<p><strong>Szervező:</strong> ${selectedOrganizer.name}</p>` : ''}
                    ${selectedEvent.tags && selectedEvent.tags.length > 0 ? 
                        `<p><strong>Címkék:</strong> ${selectedEvent.tags.join(', ')}</p>` : ''}
                `;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initializePage); 