
document.addEventListener("DOMContentLoaded", () => {
    const date = new Date();
    const dateString = date.toLocaleDateString("pl-PL", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById("date").textContent = dateString;

    const weatherIcons = {
        0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
        45: "🌫️", 48: "🌫️",
        51: "🌦️", 53: "🌧️", 55: "🌧️",
        61: "🌧️", 63: "🌧️", 65: "🌧️",
        80: "🌦️", 81: "🌧️", 82: "⛈️",
        95: "⛈️", 96: "⛈️", 99: "⛈️"
    };

    fetch("https://api.open-meteo.com/v1/forecast?latitude=54.02&longitude=14.75&current=temperature_2m,weathercode&timezone=auto")
        .then(res => res.json())
        .then(data => {
            const weather = data.current;
            const emoji = weatherIcons[weather.weathercode] || "❓";
            document.getElementById("weather").innerHTML = `${emoji} ${weather.temperature_2m}°C`;
        });

    fetch("data/quotes.json")
        .then(res => res.json())
        .then(data => {
            const index = date.getDate() % data.length;
            document.getElementById("quote").textContent = data[index];
        });

    fetch("data/places.json")
        .then(res => res.json())
        .then(data => {
            const index = date.getDate() % data.length;
            document.getElementById("place-name").textContent = data[index].name;
            document.getElementById("place-desc").textContent = data[index].description;
        });

    window.toggleNightMode = () => {
        document.body.classList.toggle("night-mode");
    };

    const map = L.map("map").setView([54.02, 14.75], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);

    let userMarkers = JSON.parse(localStorage.getItem("userMarkers") || "[]");
    const addMarkerToMap = (marker, index) => {
        let popupContent = marker.description;
        if (marker.image) {
            popupContent += `<br><img src="${marker.image}" style="width:100px;">`;
        }
        popupContent += `<br><button onclick="deleteMarker(${index})">🗑️ Usuń</button>`;
        L.marker([marker.lat, marker.lng])
            .addTo(map)
            .bindPopup(popupContent);
    };
    userMarkers.forEach((m, i) => addMarkerToMap(m, i));
    map.on("click", e => {
        const description = prompt("Dodaj opis:");
        if (!description) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = () => {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    const newMarker = {
                        lat: e.latlng.lat,
                        lng: e.latlng.lng,
                        description,
                        image: reader.result
                    };
                    userMarkers.push(newMarker);
                    localStorage.setItem("userMarkers", JSON.stringify(userMarkers));
                    location.reload();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });
    window.deleteMarker = index => {
        userMarkers.splice(index, 1);
        localStorage.setItem("userMarkers", JSON.stringify(userMarkers));
        location.reload();
    };

    const notes = JSON.parse(localStorage.getItem("notes") || "{}");
    const today = date.toISOString().split("T")[0];
    const noteForm = document.getElementById("note-form");
    const noteInput = document.getElementById("note-input");
    const noteList = document.getElementById("note-list");

    const renderNotes = () => {
        noteList.innerHTML = "";
        (notes[today] || []).forEach((note, i) => {
            const li = document.createElement("li");
            li.className = 'entry-box'; li.innerHTML = `<span>${note}</span>`;
            const btn = document.createElement("button");
            btn.textContent = "🗑️";
            btn.className = "delete";
            btn.onclick = () => {
                notes[today].splice(i, 1);
                localStorage.setItem("notes", JSON.stringify(notes));
                renderNotes();
            };
            li.appendChild(btn);
            noteList.appendChild(li);
        });
    };

    noteForm.onsubmit = e => {
        e.preventDefault();
        if (!notes[today]) notes[today] = [];
        notes[today].push(noteInput.value);
        localStorage.setItem("notes", JSON.stringify(notes));
        noteInput.value = "";
        renderNotes();
    };
    renderNotes();

    const reminderForm = document.getElementById("reminder-form");
    const reminderList = document.getElementById("reminder-list");
    let reminders = JSON.parse(localStorage.getItem("reminders") || "[]");

    const renderReminders = () => {
        reminderList.innerHTML = "";
        reminders.forEach((r, i) => {
            const rTime = new Date(r.time);
            const formattedTime = `${rTime.toLocaleDateString("pl-PL")}, ${rTime.getHours().toString().padStart(2, "0")}:${rTime.getMinutes().toString().padStart(2, "0")}`;
            const li = document.createElement("li");
            li.textContent = `${formattedTime} - ${r.text}`;
            const btn = document.createElement("button");
            btn.textContent = "🗑️";
            btn.className = "delete";
            btn.onclick = () => {
                reminders.splice(i, 1);
                localStorage.setItem("reminders", JSON.stringify(reminders));
                renderReminders();
            };
            li.appendChild(btn);
            reminderList.appendChild(li);
        });
    };

    reminderForm.onsubmit = e => {
        e.preventDefault();
        const time = document.getElementById("reminder-datetime").value;
        const text = document.getElementById("reminder-text").value;
        if (time && text) {
            reminders.push({ time, text });
            localStorage.setItem("reminders", JSON.stringify(reminders));
            renderReminders();
            reminderForm.reset();
        }
    };

    setInterval(() => {
        const now = new Date();
        reminders.forEach(r => {
            const rTime = new Date(r.time);
            if (now.getFullYear() === rTime.getFullYear() &&
                now.getMonth() === rTime.getMonth() &&
                now.getDate() === rTime.getDate() &&
                now.getHours() === rTime.getHours() &&
                now.getMinutes() === rTime.getMinutes()) {
                alert("🔔 Przypomnienie: " + r.text);
            }
        });
    }, 60000);

    renderReminders();
});


// ZEGAR ODLICZAJĄCY
function updateCountdown() {
    const end = new Date("2025-07-27T00:00:00");
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) {
        document.getElementById("countdown").textContent = "Urlop zakończony.";
        return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    document.getElementById("countdown").textContent = `Pozostało: ${days} dni, ${hours} godz., ${minutes} min.`;
}
setInterval(updateCountdown, 60000);
updateCountdown();

// PLAN DNIA
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
let todos = JSON.parse(localStorage.getItem("todos") || "[]");

function renderTodos() {
    todoList.innerHTML = "";
    todos.forEach((t, i) => {
        const li = document.createElement("li");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = t.done;
        checkbox.onchange = () => {
            todos[i].done = checkbox.checked;
            localStorage.setItem("todos", JSON.stringify(todos));
        };
        const span = document.createElement("span");
        span.textContent = " " + t.text;
        const btn = document.createElement("button");
        btn.textContent = "🗑️";
        btn.className = "delete delete-small";
        btn.onclick = () => {
            todos.splice(i, 1);
            localStorage.setItem("todos", JSON.stringify(todos));
            renderTodos();
        };
        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(btn);
        todoList.appendChild(li);
    });
}
todoForm.onsubmit = e => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (text) {
        todos.push({ text, done: false });
        localStorage.setItem("todos", JSON.stringify(todos));
        todoInput.value = "";
        renderTodos();
    }
};
renderTodos();


// === LICZNIK DYSTANSU ===
let totalDistance = 0;
let previousCoords = null;

function toRadians(deg) {
  return deg * Math.PI / 180;
}

function haversineDistance(coord1, coord2) {
  const R = 6371;
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLon = toRadians(coord2.lon - coord1.lon);
  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function updateDistanceDisplay() {
  const el = document.getElementById('distance');
  if (el) el.textContent = totalDistance.toFixed(2);
}

function trackLocation(position) {
  const { latitude, longitude } = position.coords;
  const currentCoords = { lat: latitude, lon: longitude };

  if (previousCoords) {
    const distance = haversineDistance(previousCoords, currentCoords);
    if (distance > 0.01) {
      totalDistance += distance;
      updateDistanceDisplay();
    }
  }

  previousCoords = currentCoords;
}

if (navigator.geolocation) {
  setInterval(() => {
    navigator.geolocation.getCurrentPosition(trackLocation, console.error);
  }, 10000);
}
