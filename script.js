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

let notes = JSON.parse(localStorage.getItem('family_notes')) || [];
let kidData = JSON.parse(localStorage.getItem('kid_points')) || { "Charlotte": 0, "Collin": 0 };
let history = JSON.parse(localStorage.getItem('family_history')) || [];
let activePrize = null;
let editingId = null;

function updateDashboard() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('day-name').innerText = now.toLocaleDateString([], { weekday: 'long' });
    document.getElementById('date-full').innerText = now.toLocaleDateString([], { month: 'long', day: 'numeric' });
    renderNotes(); 
}

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
    img.src = url; img.style.display = 'block';
    document.getElementById('photo-placeholder').style.display = 'none';
}

function addHistory(name, action, type) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    history.unshift({ name, action, type, timestamp: timeStr });
    if (history.length > 10) history.pop();
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

function renderRewards() {
    document.getElementById('rewards-bank').innerHTML = Object.entries(kidData).map(([name, pts]) => `
        <div class="kid-stat">
            <div style="font-size:0.6rem; color: var(--accent-color); font-weight:bold;">${name.toUpperCase()}</div>
            <div class="kid-points">${pts}★</div>
        </div>
    `).join('');

    const sorted = [...dailyChores].sort((a, b) => a.points - b.points);
    document.getElementById('chores-container').innerHTML = sorted.map(chore => `
        <div class="chore-item">
            <div class="chore-info"><span class="chore-name">${chore.name}</span> <span class="chore-pts-value">${chore.points}★</span></div>
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

    document.getElementById('prize-menu').innerHTML = prizes.map(p => `
        <div class="prize-item" onclick="openRedeemModal('${p.name}', ${p.cost})">
            <div>${p.name}</div><div style="color:#FFD700; font-weight:bold;">${p.cost}★</div>
        </div>
    `).join('');
}

window.adjustPoints = (name, pts, choreName) => { 
    kidData[name] = Math.max(0, kidData[name] + pts); 
    if (pts > 0) addHistory(name, `earned ${pts}★: ${choreName}`, 'earn');
    else addHistory(name, `lost ${Math.abs(pts)}★: ${choreName}`, 'remove');
    saveRewards(); 
};

window.openRedeemModal = (name, cost) => {
    activePrize = { name, cost };
    document.getElementById('redeem-modal').style.display = 'flex';
    document.getElementById('modal-prize-name').innerText = `Redeem ${name}`;
    document.getElementById('modal-body-content').innerHTML = `
        <p>Who is claiming?</p>
        <div style="display:flex; gap:10px; justify-content:center; margin-top:15px;">
            ${kidsNames.map(kid => `<button class="point-btn-sm" onclick="confirmRedeem('${kid}')">${kid}</button>`).join('')}
        </div>
    `;
};

window.confirmRedeem = (name) => {
    if (kidData[name] >= activePrize.cost) {
        kidData[name] -= activePrize.cost;
        addHistory(name, `redeemed ${activePrize.name}`, 'redeem');
        saveRewards();
        closeModal();
    } else { alert("Not enough stars!"); }
};

window.closeModal = () => { document.getElementById('redeem-modal').style.display = 'none'; };

// --- TASKS LOGIC ---
document.getElementById('add-note-btn').onclick = () => {
    const id = Date.now();
    notes.push({ id: id, text: '', assignee: 'Select', dueDateTime: '' });
    editingId = id;
    saveNotes();
};

function renderNotes() {
    const container = document.getElementById('notes-container');
    const now = new Date();
    container.innerHTML = notes.map(n => {
        const isEditing = editingId === n.id;
        const dueDate = n.dueDateTime ? new Date(n.dueDateTime) : null;
        const isOverdue = dueDate && dueDate < now;
        const formattedDate = dueDate ? dueDate.toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : '';
        
        return `
        <div class="sticky-note assignee-${n.assignee} ${isEditing ? 'editing' : ''} ${isOverdue ? 'is-overdue' : ''}" onclick="toggleEdit(${n.id}, event)">
            <div class="task-top-row">
                <span class="assignee-label" style="display: ${isEditing ? 'none' : 'block'}">${n.assignee !== 'Select' ? n.assignee : ''}</span>
                <select class="assignee-picker" onchange="updateNote(${n.id}, 'assignee', this.value); stopEditing();">
                    ${allFamily.map(name => `<option value="${name}" ${n.assignee===name?'selected':''}>${name}</option>`).join('')}
                </select>
                <div class="complete-circle" onclick="completeNote(${n.id}, event)">✓</div>
            </div>
            <textarea class="task-textarea" onfocus="startTyping(${n.id})" oninput="updateNote(${n.id}, 'text', this.value)" rows="2" placeholder="Task details...">${n.text}</textarea>
            <div class="task-footer">
                <div class="due-display">
                    ${!isEditing && formattedDate ? `<div class="due-badge"><span>⏰</span> ${formattedDate}</div>` : ''}
                    <input type="datetime-local" class="due-date-input" value="${n.dueDateTime || ''}" onchange="updateNote(${n.id}, 'dueDateTime', this.value); renderNotes();" style="display: ${isEditing ? 'block' : 'none'}">
                </div>
            </div>
        </div>
    `}).join('');
}

window.startTyping = (id) => {
    editingId = id;
    // Don't re-render here or the keyboard will close
};

window.toggleEdit = (id, event) => {
    if (event.target.tagName === 'SELECT' || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.classList.contains('complete-circle')) return;
    editingId = (editingId === id) ? null : id;
    renderNotes();
};

window.stopEditing = () => { editingId = null; renderNotes(); };
window.updateNote = (id, field, value) => { 
    const note = notes.find(n => n.id === id);
    if (note) { note[field] = value; localStorage.setItem('family_notes', JSON.stringify(notes)); }
};
window.completeNote = (id, event) => { if (event) event.stopPropagation(); notes = notes.filter(n => n.id !== id); saveNotes(); };
function saveNotes() { localStorage.setItem('family_notes', JSON.stringify(notes)); renderNotes(); }
function saveRewards() { localStorage.setItem('kid_points', JSON.stringify(kidData)); renderRewards(); }

setInterval(updateDashboard, 60000); 
updateDashboard(); renderRewards(); renderNotes(); renderHistory();
if(localStorage.getItem('saved_photo')) displayPhoto(localStorage.getItem('saved_photo'));
