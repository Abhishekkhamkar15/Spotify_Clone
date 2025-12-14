// Global state
let currentSong = new Audio();
let songs = [];
let currFolder = "";
let currentIndex = 0;

// Utility: format seconds -> mm:ss
function formatTime(seconds) {
  seconds = Math.floor(seconds);
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

// 🔄 Sync bottom play/pause button and library icons
function syncIcons() {
  const playBtn = document.getElementById("play");
  const allIcons = document.querySelectorAll(".song-icon");
  allIcons.forEach((icon) => (icon.src = "img/play.svg"));

  if (!currentSong.paused && currentSong.src) {
    playBtn.src = "img/pause.svg";
    const songItems = document.querySelectorAll(".songList ul li");
    const activeItem = songItems[currentIndex];
    if (activeItem) {
      const icon = activeItem.querySelector(".song-icon");
      if (icon) icon.src = "img/pause.svg";
    }
  } else {
    playBtn.src = "img/play.svg";
  }
}

// =========================
// Auth / Username handling
// =========================
function updateUsernameUI() {
  const usernameSpan = document.querySelector(".username");
  if (!usernameSpan) return;

  const name = localStorage.getItem("username");
  if (name) {
    usernameSpan.textContent = name;
    usernameSpan.style.cursor = "pointer";
    usernameSpan.style.position = "relative";
  } else {
    usernameSpan.textContent = "";
  }
}

function setupAuth() {
  const loginBtn = document.querySelector(".loginbtn");
  const signupBtn = document.querySelector(".signupbtn");
  const usernameSpan = document.querySelector(".username");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const name = prompt("Enter your name to log in:");
      if (name && name.trim() !== "") {
        localStorage.setItem("username", name.trim());
        updateUsernameUI();
      }
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener("click", () => {
      const name = prompt("Sign up - enter your name:");
      if (name && name.trim() !== "") {
        localStorage.setItem("username", name.trim());
        updateUsernameUI();
      }
    });
  }

  // 🔽 Logout popup logic (below username)
  if (usernameSpan) {
    usernameSpan.addEventListener("click", () => {
      const existingPopup = document.querySelector(".logout-popup");
      if (existingPopup) {
        existingPopup.remove();
        return;
      }

      const popup = document.createElement("div");
      popup.className = "logout-popup";
      popup.textContent = "Logout";

      // style below username
      popup.style.position = "absolute";
      popup.style.top = "25px"; // 👇 just below the username
      popup.style.left = "0";
      popup.style.background = "#222";
      popup.style.color = "#fff";
      popup.style.padding = "8px 15px";
      popup.style.borderRadius = "8px";
      popup.style.cursor = "pointer";
      popup.style.fontSize = "14px";
      popup.style.zIndex = "9999";
      popup.style.whiteSpace = "nowrap";
      popup.style.transition = "opacity 0.2s ease";
      popup.style.opacity = "0.95";
      popup.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";

      usernameSpan.appendChild(popup);

      // Logout action
      popup.addEventListener("click", () => {
        localStorage.removeItem("username");
        updateUsernameUI();
        popup.remove();
      });

      // Close popup if clicked outside
      document.addEventListener(
        "click",
        (e) => {
          if (e.target !== usernameSpan && e.target !== popup) {
            popup.remove();
          }
        },
        { once: true }
      );
    });
  }
}

// Load all songs from a given folder (e.g. "songs/ncs")
// Load all songs from a given folder (GitHub Pages compatible)
async function getSongs(folder) {
  currFolder = folder;
  const songListUL = document.querySelector(".songList ul");
  songListUL.innerHTML = "Loading songs...";

  try {
    const res = await fetch(`${folder}/songs.json`);
    const data = await res.json();
    songs = data.songs || [];

    // Build visible song list
    songListUL.innerHTML = "";
    songs.forEach((songName, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="info">
          <div>${decodeURI(songName)}</div>
        </div>
        <div class="playnow">
          <img class="song-icon" width="18" src="img/play.svg" alt="play">
          <span>Play</span>
        </div>
      `;
      li.addEventListener("click", () => {
        if (currentSong.src.includes(songName) && !currentSong.paused) {
          currentSong.pause();
        } else {
          playMusic(songName);
          currentIndex = index;
        }
        syncIcons();
      });
      songListUL.appendChild(li);
    });

    if (songs.length === 0) {
      songListUL.innerHTML = "<li>No songs found in this folder.</li>";
    }

    return songs;
  } catch (err) {
    console.error("Error loading songs:", err);
    songListUL.innerHTML = "<li>Failed to load songs.</li>";
    return [];
  }
}


// Play a specific track
function playMusic(track, pause = false) {
  if (!currFolder) return;

  currentSong.src = `${currFolder}/` + track;
  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

  if (!pause) {
    currentSong.play();
    document.getElementById("play").src = "img/pause.svg";
  }
  syncIcons();
}
// Display album cards using albums.json (GitHub Pages safe)
async function displayAlbums() {
  const cardContainer = document.querySelector(".cardContainer");
  cardContainer.innerHTML = "Loading albums...";

  try {
    const res = await fetch("songs/albums.json");
    const data = await res.json();

    cardContainer.innerHTML = "";

    for (const folder of data.albums) {
      // Try to load metadata
      let meta = { title: folder, description: "Playlist" };
      try {
        const infoRes = await fetch(`songs/${folder}/info.json`);
        meta = await infoRes.json();
      } catch {}

      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("data-folder", folder);
      card.innerHTML = `
        <div class="play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                    stroke-linejoin="round" />
            </svg>
        </div>
        <img src="songs/${folder}/cover.jpg" alt="${meta.title}">
        <h2>${meta.title}</h2>
        <p>${meta.description}</p>
      `;

      card.addEventListener("click", async (e) => {
        const folderName = e.currentTarget.getAttribute("data-folder");
        const fullFolder = `songs/${folderName}`;
        const s = await getSongs(fullFolder);
        if (s.length > 0) {
          currentIndex = 0;
          playMusic(s[0]);
        }
      });

      cardContainer.appendChild(card);
    }

    if (!data.albums || data.albums.length === 0) {
      cardContainer.innerHTML = "No albums found in songs/ folder.";
    }
  } catch (err) {
    console.error("Error loading albums:", err);
    cardContainer.innerHTML = "Failed to load albums.";
  }
}

// Seekbar
function setupTimeAndSeekbar() {
  const seekbar = document.querySelector(".seekbar");
  const circle = document.querySelector(".circle");
  const songtime = document.querySelector(".songtime");

  currentSong.addEventListener("timeupdate", () => {
    if (currentSong.duration) {
      const current = currentSong.currentTime;
      const total = currentSong.duration;
      const percent = (current / total) * 100;
      circle.style.left = `${percent}%`;
      songtime.innerHTML = `${formatTime(current)} / ${formatTime(total)}`;
    }
  });

  seekbar.addEventListener("click", (e) => {
    if (!currentSong.duration) return;
    const rect = seekbar.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    circle.style.left = `${percent}%`;
    currentSong.currentTime = (percent / 100) * currentSong.duration;
  });
}

// Controls
function setupControls() {
  const playBtn = document.getElementById("play");
  const prevBtn = document.getElementById("previous");
  const nextBtn = document.getElementById("next");

  playBtn.addEventListener("click", () => {
    if (!currentSong.src) return;

    if (currentSong.paused) {
      currentSong.play();
    } else {
      currentSong.pause();
    }
    syncIcons();
  });

  prevBtn.addEventListener("click", () => {
    if (songs.length === 0) return;
    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    playMusic(songs[currentIndex]);
    syncIcons();
  });

  nextBtn.addEventListener("click", () => {
    if (songs.length === 0) return;
    currentIndex = (currentIndex + 1) % songs.length;
    playMusic(songs[currentIndex]);
    syncIcons();
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      playBtn.click();
    }
  });
}

// Volume
function setupVolume() {
  const volumeContainer = document.querySelector(".volume");
  const volumeIcon = volumeContainer.querySelector("img");
  const volumeRange = volumeContainer.querySelector("input");

  currentSong.volume = 0.5;
  volumeRange.value = 50;

  volumeRange.addEventListener("input", (e) => {
    const vol = e.target.value / 100;
    currentSong.volume = vol;
    volumeIcon.src = vol === 0 ? "img/mute.svg" : "img/volume.svg";
  });

  volumeIcon.addEventListener("click", () => {
    if (currentSong.volume > 0) {
      currentSong.dataset.prevVolume = currentSong.volume;
      currentSong.volume = 0;
      volumeRange.value = 0;
      volumeIcon.src = "img/mute.svg";
    } else {
      const prev = currentSong.dataset.prevVolume || 0.5;
      currentSong.volume = prev;
      volumeRange.value = prev * 100;
      volumeIcon.src = "img/volume.svg";
    }
  });
}

// Sidebar
function setupSidebar() {
  const hamburger = document.querySelector(".hamburger");
  const left = document.querySelector(".left");
  const closeBtn = document.querySelector(".close");

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      left.style.left = "0";
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      left.style.left = "-130%";
    });
  }
}

// Init
async function main() {
  setupTimeAndSeekbar();
  setupControls();
  setupVolume();
  setupSidebar();
  setupAuth();
  updateUsernameUI();
  await displayAlbums();
}

main();
