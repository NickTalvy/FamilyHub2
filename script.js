const colors = ['#FFD700', '#FF453A', '#32D74B', '#0A84FF', '#BF5AF2'];
let notes = JSON.parse(localStorage.getItem('family_notes')) || [];

function updateDashboard() {
    const now = new Date();
    const hours = now.getHours();
    let greetText = "Good Evening";

    // 1. Greeting Text logic
    if (hours < 12) greetText = "Good Morning";
    else if (hours < 17) greetText = "Good Afternoon";
    else if (hours < 21) greetText = "Good Evening";
    else greetText = "Good Night";

    document.getElementById('greeting').innerText = greetText;

    // 2. Night Mode Toggle logic (10 PM to 6 AM)
    if (hours >= 22 || hours < 6) {
        document.body.classList.add('night-mode');
    } else {
        document.body.classList.remove('night-mode');
    }

    // 3. Existing Clock & Date logic
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    document.getElementById('day-name').innerText = now.toLocaleDateString([], { weekday: 'long' });
    document.getElementById('date-full').innerText = now.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

function autoGrow(el) {
    el.style.height = "5px";
    el.style.height = (el.scrollHeight) + "px";
}

function renderNotes() {
    const container = document.getElementById('notes-container');
    container.innerHTML = '';
    const now = Date.now();

    notes.forEach((note) => {
        if (note.showAt && new Date(note.showAt).getTime() > now) return;

        const div = document.createElement('div');
        div.className = 'sticky-note';
        div.style.borderLeftColor = note.color;

        div.innerHTML = `
            <div class="note-top-row">
                <textarea oninput="updateNoteText(${note.id}, this.value); autoGrow(this)" rows="1">${note.text}</textarea>
                <div class="done-bubble" onclick="completeNote(${note.id})"></div>
            </div>
            <div class="note-settings">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="color-options">${colors.map(c => `<div class="color-dot" style="background:${c}" onclick="updateNoteColor(${note.id}, '${c}')"></div>`).join('')}</div>
                    <button class="done-btn" onclick="document.activeElement.blur()">DONE</button>
                </div>
                <div style="margin-top:10px; display:flex; gap:10px;">
                    <select onchange="updateNoteRepeat(${note.id}, this.value)" style="background:#2c2c2e; color:white; border-radius:5px;">
                        <option value="" ${!note.repeatType ? 'selected' : ''}>No Repeat</option>
                        <option value="daily" ${note.repeatType === 'daily' ? 'selected' : ''}>Daily</option>
                        <option value="weekly" ${note.repeatType === 'weekly' ? 'selected' : ''}>Weekly</option>
                    </select>
                </div>
            </div>`;
        container.appendChild(div);
        autoGrow(div.querySelector('textarea'));
    });
}

window.completeNote = (id) => {
    const note = notes.find(n => n.id === id);
    if (note.repeatType) {
        let next = new Date();
        next.setDate(next.getDate() + (note.repeatType === 'daily' ? 1 : 7));
        note.showAt = next.toISOString();
    } else {
        notes = notes.filter(n => n.id !== id);
    }
    saveNotes();
};

window.updateNoteText = (id, text) => { notes.find(n => n.id === id).text = text; localStorage.setItem('family_notes', JSON.stringify(notes)); };
window.updateNoteColor = (id, color) => { notes.find(n => n.id === id).color = color; saveNotes(); };
window.updateNoteRepeat = (id, val) => { notes.find(n => n.id === id).repeatType = val; saveNotes(); };

document.getElementById('add-note-btn').addEventListener('click', () => {
    notes.push({ id: Date.now(), text: "", color: colors[0], repeatType: "", showAt: null });
    saveNotes();
});

function saveNotes() { localStorage.setItem('family_notes', JSON.stringify(notes)); renderNotes(); }

setInterval(updateDashboard, 1000);
updateDashboard();
renderNotes();