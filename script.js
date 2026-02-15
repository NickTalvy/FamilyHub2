const kidsNames = ["Charlotte", "Collin"];
const allFamily = ["Select", "Nick", "Sarah", "Charlotte", "Collin"];

const dailyChores = [
    { name: "Make Bed", points: 5 },
    { name: "Change Trash", points: 5 },
    { name: "Pick up Livingroom", points: 5 },
    { name: "Do the Dishes", points: 5 },
    { name: "Homework", points: 10 },
    { name: "Clean Room", points: 10 },
    { name: "Vacuum a Room", points: 10 },
    { name: "Clean Your Bathroom", points: 10 },
    { name: "Practice Karate(15m)", points: 10 },
    { name: "Read(15m)", points: 10 },
    { name: "Clean Litterbox", points: 15 }
];

const prizes = [
    { name: "30m Tablet", cost: 50 },
    { name: "Dessert", cost: 50 },
    { name: "Stay up Late", cost: 150 },
    { name: "Money", cost: 250 }
];

// Data Persistence: Load from local storage or set defaults
let notes = JSON.parse(localStorage.getItem('family_notes')) || [];
let kidData = JSON.parse(localStorage.getItem('kid_points')) || { "Charlotte": 0, "Collin": 0 };
let history = JSON.parse(localStorage.getItem('family_history')) || [];
let activePrize = null;

// --- CLOCK & GREETING ---
function updateDashboard() {
    const now = new Date();
    const hours = now.getHours();
    
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('day-name').innerText = now.toLocaleDateString([], { weekday: 'long' });
    document.getElementById('date-full').innerText = now.toLocaleDateString([], { month: 'long', day: 'numeric' });

    let greeting = "Good Evening";
    if (hours < 12) greeting = "Good Morning";
    else if (hours < 17) greeting = "Good Afternoon";
    document.getElementById('greeting').innerText = greeting;

    if (hours >= 22 || hours < 6) document.body.classList.add('night-mode');
    else document.body.classList.remove('night-mode');
}

// --- PHOTO LOGIC ---
window.handlePhoto = (input) => {
    const reader = new FileReader();
    reader.onload = e => {
        localStorage.setItem('saved_photo', e.target.result);
        displayPhoto(e.target.result);
    };
    reader.readAsDataURL(input.files[0]);
};

function displayPhoto(url) {
    if(!url) return;
    const img = document.getElementById('family-photo');
    img.src = url; 
    img.style.display = 'block';
    document.getElementById('photo-placeholder').style.display = 'none';
}

// --- ACTIVITY LOG LOGIC ---
function addHistory(name, action, type) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    history.unshift({ name, action, type, timestamp: timeStr });
    if (history.length > 10) history.pop(); // Keep log small
    localStorage.setItem('family_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const container = document.getElementById('history-list');
    container.innerHTML = history.length ? history.map(item => `
        <div class="history-item ${item.type}">
            <span class="history-time">${item.timestamp}</span>
            <span><strong>${item.name}</strong> ${item.action}</span>
        </div>
    `).join('') : '<div class="history-item empty">No recent activity</div>';
}

// --- STAR BANK & CHORE LOGIC ---
function renderRewards() {
    // Render the Bank Totals
    document.getElementById('rewards-bank').innerHTML = Object.entries(kidData).map(([name, pts]) => `
        <div class="kid-stat">
            <div style="font-size:0.6rem; color: var(--accent-color); font-weight:bold;">${name.toUpperCase()}</div>
            <div class="kid-points">${pts}★</div>
        </div>
    `).join('');

    // Render Chores in Single Row Layout
    const sorted = [...dailyChores].sort((a, b) => a.points - b.points);
    document.getElementById('chores-container').innerHTML = sorted.map(chore => `
        <div class="chore-item">
            <div class="chore-info">
                <span class="chore-name">${chore.name}</span>
                <span class="chore-pts-value">${chore.points}★</span>
            </div>
            <div class="btn-group-row">
                ${kidsNames.map(name => `
                    <div class="kid-control-unit">
                        <button class="point-btn-sm" onclick="adjustPoints('${name}', ${chore.points}, '${chore.name}')">${name}</button>
                        <button class="minus-btn-sm" onclick="adjustPoints('${name}', -${chore.points}, '${chore.name}')">-</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    // Render Prize Menu
    document.getElementById('prize-menu').innerHTML = prizes.map(p => `
        <div class="prize-item" onclick="openRedeemModal('${p.name}', ${p.cost})">
            <div>${p.name}</div>
            <div style="color:#FFD700; font-weight:bold;">${p.cost}★</div>
        </div>
    `).join('');
}

window.adjustPoints = (name, pts, choreName) => { 
    kidData[name] = Math.max(0, kidData[name] + pts); 
    if (pts > 0) addHistory(name, `earned ${pts}★: ${choreName}`, 'earn');
    else addHistory(name, `lost ${Math.abs(pts)}★: ${choreName}`, 'remove');
    saveRewards(); 
};

// --- REDEMPTION MODAL LOGIC ---
window.openRedeemModal = (name, cost) => {
    activePrize = { name, cost };
    const modal = document.getElementById('redeem-modal');
    document.getElementById('modal-box').className = 'glass-card modal-content';
    document.getElementById('modal-prize-name').innerText = `Redeem ${name}`;
    document.getElementById('modal-body-content').innerHTML = `
        <p>Who is claiming for ${cost}★?</p>
        <div style="display:flex; gap:15px; justify-content:center; margin-top:20px;">
            ${kidsNames.map(kid => `<button class="point-btn-sm" style="padding:12px; min-width:100px;" onclick="confirmRedeem('${kid}')">${kid}</button>`).join('')}
        </div>
    `;
    modal.style.display = 'flex';
};

window.confirmRedeem = (name) => {
    if (kidData[name] >= activePrize.cost) {
        kidData[name] -= activePrize.cost;
        addHistory(name, `redeemed ${activePrize.name}`, 'redeem');
        saveRewards();
        document.getElementById('modal-body-content').innerHTML = `
            <h2 style="color:#48bb78; margin:10px 0;">SUCCESS!</h2>
            <p>${name} claimed <strong>${activePrize.name}</strong></p>
            <button class="point-btn-sm" style="margin-top:15px; width:100%;" onclick="closeModal()">AWESOME!</button>
        `;
    } else {
        document.getElementById('modal-box').classList.add('error');
        const gap = activePrize.cost - kidData[name];
        document.getElementById('modal-body-content').innerHTML = `
            <h2 style="color:#ff5555; margin:10px 0;">NOT ENOUGH!</h2>
            <p>${name} needs <span style="color:#FFD700; font-weight:bold;">${gap} more★</span></p>
            <button class="point-btn-sm" style="margin-top:15px; width:100%; background:#ff5555; box-shadow: 0 4px 0 #742a2a;" onclick="closeModal()">BACK TO WORK</button>
        `;
    }
};

window.closeModal = () => { document.getElementById('redeem-modal').style.display = 'none'; };

// --- STICKY NOTES LOGIC ---
document.getElementById('add-note-btn').onclick = () => {
    notes.push({ id: Date.now(), text: '', assignee: 'Select' });
    saveNotes();
};

function renderNotes() {
    const container = document.getElementById('notes-container');
    container.innerHTML = notes.map(n => `
        <div class="sticky-note assignee-${n.assignee}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <select class="assignee-picker" style="background:rgba(0,0,0,0.2); border:none; color:white; font-size:0.7rem;" onchange="updateNote(${n.id}, 'assignee', this.value); renderNotes();">
                    ${allFamily.map(name => `<option value="${name}" ${n.assignee===name?'selected':''}>${name}</option>`).join('')}
                </select>
                <div style="width:18px; height:18px; border:2px solid white; border-radius:50%; cursor:pointer;" onclick="completeNote(${n.id})"></div>
            </div>
            <textarea oninput="updateNote(${n.id}, 'text', this.value)" rows="2" placeholder="Task details...">${n.text}</textarea>
        </div>
    `).join('');
}

window.updateNote = (id, field, value) => { 
    const note = notes.find(n => n.id === id);
    if (note) {
        note[field] = value; 
        localStorage.setItem('family_notes', JSON.stringify(notes)); 
    }
};

window.completeNote = (id) => { 
    notes = notes.filter(n => n.id !== id); 
    saveNotes(); 
};

// --- GLOBAL SAVING FUNCTIONS ---
function saveNotes() { localStorage.setItem('family_notes', JSON.stringify(notes)); renderNotes(); }
function saveRewards() { localStorage.setItem('kid_points', JSON.stringify(kidData)); renderRewards(); }

// --- INITIALIZATION ---
setInterval(updateDashboard, 1000);
updateDashboard(); 
renderRewards(); 
renderNotes(); 
renderHistory();

// Load saved photo if it exists
if(localStorage.getItem('saved_photo')) displayPhoto(localStorage.getItem('saved_photo'));