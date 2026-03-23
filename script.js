// ၁။ Configuration & Global Variables
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api/projects' 
    : '/api/projects';

let allProjects = [];
let currentPage = 1;
const projectsPerPage = 15;
let currentFilters = { dept: 'all', year: 'all' };
let currentView = 'grid'; // View mode သိမ်းရန် (grid သို့မဟုတ် list)

window.onload = function() {
    // စာမျက်နှာ စပွင့်တာနဲ့ အပေါ်ဆုံးကို ရောက်အောင်လုပ်မယ်
    window.scrollTo(0, 0);
};

// တစ်ခါတလေ browser က load ဖြစ်ပြီးမှ scroll ပြန်ချတာမျိုးရှိရင် (ပိုသေချာအောင်)
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// ၂။ Helper: YouTube ID Extract
function extractYouTubeId(url) {
    if (!url) return null;
    // Shorts ရော၊ Share link ရော၊ Browser link ရော ပါဝင်အောင် Regex ပြင်ထားသည်
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// ၃။ View Switching Logic
function setView(viewType) {
    currentView = viewType;

    // အားလုံးသော switch element တွေကို ယူမယ်
    const gridTab = document.getElementById('gridTab');
    const listTab = document.getElementById('listTab');
    const gridTabM = document.getElementById('gridTabMobile');
    const listTabM = document.getElementById('listTabMobile');

    // Desktop Tabs Toggle
    if (gridTab) gridTab.classList.toggle('active', viewType === 'grid');
    if (listTab) listTab.classList.toggle('active', viewType === 'list');

    // Mobile Tabs Toggle (Variable အမှား ပြင်ဆင်ပြီး)
    if (gridTabM) gridTabM.classList.toggle('active', viewType === 'grid');
    if (listTabM) listTabM.classList.toggle('active', viewType === 'list');

    // Data ကို Render ပြန်လုပ်ရန် (Page 1 မပြန်ဘဲ view ပဲပြောင်းမယ်)
    if (typeof filterSelection === "function") {
        filterSelection(false); 
    }
}


// ၄။ Detail Page Logic (Error မတက်စေရန် အပေါ်မှာ ကြေညာထားခြင်း)
async function loadProjectDetails() {
    const id = new URLSearchParams(window.location.search).get('id');
    const loadingOverlay = document.getElementById('loading-overlay');
    const mainContent = document.getElementById('main-content');
    
    if (!id) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) throw new Error('Data fetch failed');
        const project = await response.json();
        // ... const project = await response.json(); ပြီးတဲ့နောက်မှာ ...
console.log("Video Link from DB:", project.video); 
console.log("Extracted YouTube ID:", extractYouTubeId(project.video));

        if (project) {
            if(document.getElementById('p-title')) document.getElementById('p-title').innerText = project.title || 'Untitled';
            if(document.getElementById('p-major')) document.getElementById('p-major').innerText = (project.major || 'Major').toUpperCase();
            if(document.getElementById('p-intro')) document.getElementById('p-intro').innerText = project.intro || '';
            if(document.getElementById('p-theory')) document.getElementById('p-theory').innerText = project.theory || '';
            if(document.getElementById('p-con')) document.getElementById('p-con').innerText = project.con || '';

            const infoSub = document.getElementById('p-sub-info');
            if(infoSub) infoSub.innerText = `Year: ${project.year || 'N/A'} | Rating: ${project.rating || 0}⭐`;

            const imgWrapper = document.getElementById('p-img-wrapper');
if (imgWrapper) {
    let videoContent = ""; // ဗီဒီယိုအတွက် သီးသန့် content
    let imageContent = ""; // ပုံတွေအတွက် သီးသန့် content

    // ၁။ `img` array ကို loop ပတ်ပြီး ပုံနဲ့ ဗီဒီယို ခွဲထုတ်မယ်
    if (project.img && Array.isArray(project.img)) {
        project.img.forEach(url => {
            const youtubeId = extractYouTubeId(url);
            
            if (youtubeId) {
                // အကယ်၍ Link က YouTube ဖြစ်နေရင် videoContent ထဲမှာ ပေါင်းထည့်မယ်
              videoContent += `
    <div class="video-slide slide-item">
        <iframe 
            src="https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
            style="width: 100%; height: 100%; aspect-ratio: 16/9;">
        </iframe>
    </div>`;
            } else {
                // ရိုးရိုးပုံဆိုရင် imageContent ထဲမှာ ပေါင်းထည့်မယ်
                imageContent += `<img src="${url}" alt="Project Image" class="slide-item" onerror="this.src='tumonywa.png'">`;
            }
        });
    }

    // ၂။ သီးသန့် `video` field ထဲမှာ ရှိနေရင်လည်း videoContent ထဲမှာ ပေါင်းထည့်မယ်
    if (project.video) {
        const vidId = extractYouTubeId(project.video);
        if (vidId) {
            videoContent += `
                <div class="video-slide slide-item">
                    <iframe src="https://www.youtube.com/embed/${vidId}?rel=0" frameborder="0" allowfullscreen></iframe>
                </div>`;
        }
    }

    // ၃။ ပေါင်းစပ်ပြီး Slider ထဲကို ထည့်မယ် (ဗီဒီယိုကို အရှေ့ဆုံးမှာ ထားမည်)
    // အကယ်၍ ဗီဒီယို မပါရင် imageContent ကိုပဲ အလိုအလျောက် ပြပါလိမ့်မယ်။
    imgWrapper.innerHTML = (videoContent + imageContent) || '<p style="padding:20px; color:#cbd5e1;">No media available</p>';
    
    // Console မှာ debug လုပ်ရန်
    console.log("Final Slider content order:", imgWrapper.innerHTML);
}

const authorBox = document.getElementById('p-authors');
if (authorBox && project.authors) {
    let authorsHTML = "";
    
    // Array လား၊ စာသားအရှည်ကြီးလား စစ်ဆေးခြင်း
    if (Array.isArray(project.authors)) {
        authorsHTML = project.authors.map(name => 
            `<span class="author-card"><i class="fas fa-user-circle"></i> ${name.trim()}</span>`
        ).join('');
    } else {
        // အကယ်၍ comma (,) နဲ့ ခြားထားတဲ့ စာသားဆိုရင် ခွဲထုတ်မယ်
        const names = project.authors.split(',');
        authorsHTML = names.map(name => 
            `<span class="author-card"><i class="fas fa-user-circle"></i> ${name.trim()}</span>`
        ).join('');
    }
    
    authorBox.innerHTML = authorsHTML;
}
            const aimList = document.getElementById('p-aim');
            if (aimList && project.aim) {
                aimList.innerHTML = Array.isArray(project.aim) ? project.aim.map(a => `<li>${a}</li>`).join('') : `<li>${project.aim}</li>`;
            }

            const processList = document.getElementById('p-process');
            if (processList && project.process) {
                processList.innerHTML = Array.isArray(project.process) ? project.process.map(s => `<li>${s}</li>`).join('') : `<li>${project.process}</li>`;
            }

            if (mainContent) mainContent.style.display = 'block';
        }
    } catch (error) {
        console.error("Detail Error:", error);
    } finally {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// ၅။ Initial Load
document.addEventListener('DOMContentLoaded', async () => {
    const yearSpan = document.getElementById("current-year");
    if (yearSpan) yearSpan.innerText = new Date().getFullYear();

    if (window.location.pathname.includes('detail.html')) {
        await loadProjectDetails();
    } else {
        await fetchProjects();
    }
});

// ၆။ Fetch & Display (Home Page)
async function fetchProjects() {
    const grid = document.getElementById('projectGrid');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    try {
        const response = await fetch(API_BASE_URL);
        const data = await response.json();
        allProjects = Array.isArray(data) ? data : (data.documents || []);
        allProjects.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        filterSelection(true); 

    } catch (error) {
        console.error("Fetch Error:", error);
        if (grid) grid.innerHTML = `<p style="color:red; text-align:center;">Connection Error!</p>`;
    } finally {
        if (loadingOverlay) {
            // sessionStorage စစ်ဆေးခြင်း (Detail မှ ပြန်လာလျှင် မပေါ်စေရန်)
            if (!sessionStorage.getItem('visited')) {
                setTimeout(() => {
                    loadingOverlay.style.transition = "opacity 0.6s ease";
                    loadingOverlay.style.opacity = "0";
                    setTimeout(() => {
                        loadingOverlay.style.display = 'none';
                        sessionStorage.setItem('visited', 'true');
                    }, 600);
                }, 3000); // ၃ စက္ကန့် ပြသမည်
            } else {
                loadingOverlay.style.display = 'none';
            }
        }
    }
}

// ၇။ Filter & Search Logic
function filterSelection(isNewFilter = true) {
    const deptSelect = document.getElementById('dept-select');
    const yearSelect = document.getElementById('year-select');
    const searchInput = document.getElementById('projectSearch');

    const deptValue = deptSelect ? deptSelect.value.toLowerCase() : 'all';
    const yearValue = yearSelect ? yearSelect.value : 'all';
    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    if (isNewFilter) currentPage = 1;

    const filtered = allProjects.filter(p => {
        const matchDept = (deptValue === 'all') || (p.major && p.major.toLowerCase() === deptValue);
        const matchYear = (yearValue === 'all') || (p.year && p.year.includes(yearValue));
        const matchSearch = (p.title && p.title.toLowerCase().includes(searchValue)) || 
                           (p.major && p.major.toLowerCase().includes(searchValue));
        return matchDept && matchYear && matchSearch;
    });

    displayGridWithPagination(filtered);
}

// ၈။ Grid/List Display & Pagination
function displayGridWithPagination(projects) {
    const grid = document.getElementById('projectGrid');
    const paginationContainer = document.getElementById('pagination-container');
    if (!grid) return;

    if (projects.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #cbd5e1;">ရှာဖွေမှုမတွေ့ရှိပါ...</p>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    // Container class ကို view mode အလိုက် ပြောင်းမည်
    grid.className = `container ${currentView}-view`;

    const totalPages = Math.ceil(projects.length / projectsPerPage);
    if (currentPage > totalPages) currentPage = 1;

    const startIndex = (currentPage - 1) * projectsPerPage;
    const paginatedItems = projects.slice(startIndex, startIndex + projectsPerPage);

    grid.innerHTML = paginatedItems.map(project => {
        const thumbnail = (project.img && project.img.length > 0) ? project.img[0] : 'tumonywa.png';
        
        if (currentView === 'grid') {
            return `
                <div class="card" onclick="window.location.href='detail.html?id=${project._id}'">
                    <div class="card-img-wrapper">
                        <img src="${thumbnail}" onerror="this.src='tumonywa.png'" alt="Project Image">
                    </div>
                    <div class="card-info">
                        <span class="major-label">${(project.major || 'Major').toUpperCase()}</span>
                        <h3>${project.title || 'Untitled'}</h3>
                    </div>
                </div>`;
        } else {
            return `
                <div class="list-item" onclick="window.location.href='detail.html?id=${project._id}'">
                    <img src="${thumbnail}" onerror="this.src='tumonywa.png'" class="list-img">
                    <div class="list-content">
                        <span class="major-label">${(project.major || 'Major').toUpperCase()}</span>
                        <h3>${project.title || 'Untitled'}</h3>
                        <p class="list-year">Year: ${project.year || 'N/A'}</p>
                    </div>
                </div>`;
        }
    }).join('');

    renderPagination(totalPages);
}

// ၉။ Pagination Rendering
function renderPagination(totalPages) {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    
    if (totalPages <= 1) { 
        container.innerHTML = ''; 
        return; 
    }

    let buttonsHTML = '';
    if (currentPage > 1) {
        buttonsHTML += `<button class="page-btn" onclick="goToPage(${currentPage - 1})">❮</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        buttonsHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="goToPage(${i})">${i}</button>`;
    }

    if (currentPage < totalPages) {
        buttonsHTML += `<button class="page-btn" onclick="goToPage(${currentPage + 1})">❯</button>`;
    }

    container.innerHTML = buttonsHTML;
}

function goToPage(pageNumber) {
    currentPage = pageNumber;
    filterSelection(false); 
    window.scrollTo({ top: 400, behavior: 'smooth' });
}
function toggleDrawer(isOpen) {
    const drawer = document.getElementById('filterDrawer');
    const overlay = document.getElementById('drawerOverlay');
    
    if (drawer && overlay) {
        if (isOpen) {
            drawer.classList.add('active');
            overlay.classList.add('active');
            document.body.classList.add('drawer-open'); // Body scroll ပိတ်မယ်
        } else {
            drawer.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('drawer-open'); // Body scroll ပြန်ဖွင့်မယ်
        }
    }
}

function toggleMenu() {
    const nav = document.querySelector('.nav-links');
    if (nav) nav.classList.toggle('active');
}

function selectPill(type, value, element) {
    const parent = element.parentElement;
    parent.querySelectorAll('.pill').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    currentFilters[type] = value;
    if (type === 'dept') document.getElementById('dept-select').value = value;
    if (type === 'year') document.getElementById('year-select').value = value;
    filterSelection();
}

function moveSlide(direction) {
    const slider = document.getElementById('p-img-wrapper');
    if (slider) {
        const scrollAmount = slider.offsetWidth; 
        slider.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
}

// ၁။ Menu အပြင်ဘက်ထိရင် ပိတ်ရန် 
document.addEventListener('click', (event) => {
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');
    if (navLinks && navLinks.classList.contains('active')) {
        if (!navLinks.contains(event.target) && !menuToggle?.contains(event.target)) {
            navLinks.classList.remove('active');
        }
    }
});

// ၂။ Menu item (link) တွေကို နှိပ်ပြီးရင်လည်း ပိတ်ရန် (အသစ်ဖြည့်ရမည့် code)
const allLinks = document.querySelectorAll('.nav-links a');
allLinks.forEach(link => {
    link.addEventListener('click', () => {
        const navLinks = document.querySelector('.nav-links');
        navLinks.classList.remove('active');
    });
});
