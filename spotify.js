console.log('Initializing Spotify Clone');

let currentSong = new Audio();
let songs = [];
let currFolder = "";

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let res = await fetch(`/${folder}/`);
    let text = await res.text();
    let div = document.createElement("div");
    div.innerHTML = text;
    let anchors = div.getElementsByTagName("a");
    songs = [];
    for (let a of anchors) {
        if (a.href.endsWith(".mp3")) {
            songs.push(decodeURIComponent(a.href.split(`/${folder}/`)[1]));
        }
    }

    // Render song list
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    for (let song of songs) {
        songUL.innerHTML += `
            <li>
                <img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div>Unknown Artist</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="">
                    
                </div>
            </li>`;
    }

    // Add click listeners to each song
    Array.from(songUL.getElementsByTagName("li")).forEach(li => {
        li.addEventListener("click", () => {
            let trackName = li.querySelector(".info div").innerText.trim();
            playMusic(trackName);
        });
    });

    return songs;
}

// function playMusic(track, pause = false) {
//     currentSong.src = `/${currFolder}/${track}`;
//     document.querySelector(".songinfo").innerText = track;
//     document.querySelector(".songtime").innerText = "00:00 / 00:00";
    
//     if (!pause) {
//         currentSong.play();
//         document.getElementById("play").src = "img/pause.png";
//     }
// }


function playMusic(track, pause = false) {
    console.log("Playing:", track); // DEBUG

    currentSong.src = `/${currFolder}/${track}`;
    const playBtn = document.getElementById("play");
playBtn.style.display = "inline-block";
playBtn.src = pause ? "Images/play.png" : "Images/pause.png";


    currentSong.addEventListener('loadeddata', () => {
        if (!pause) {
            currentSong.play();
            document.getElementById("play").src = "Images/pause.png";
        } else {
            document.getElementById("play").src = "Images/play.png";
        }

        document.getElementById("play").style.display = "inline-block";

        let cleanTrack = track.replaceAll("%20", " ");
        if (cleanTrack.length > 30) cleanTrack = cleanTrack.slice(0, 27) + "...";
        document.querySelector(".songinfo").textContent = cleanTrack;
        document.querySelector(".songtime").textContent = "00:00 / 00:00";
    });
}

document.body.addEventListener("click", () => {
    // Unlock audio context on first click
    if (currentSong && currentSong.paused) {
        currentSong.play().catch(e => console.warn("Autoplay blocked:", e));
    }
}, { once: true });


async function displayAlbums() {
    let res = await fetch(`/songs/`);
    let html = await res.text();
    let div = document.createElement("div");
    div.innerHTML = html;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    for (let a of anchors) {
        if (a.href.includes("/songs/") && !a.href.includes(".htaccess")) {
            let folder = a.href.split("/").slice(-2)[0];
            try {
                let meta = await fetch(`/songs/${folder}/info.json`);
                let data = await meta.json();
                cardContainer.innerHTML += `
                <div class="card" data-folder="${folder}">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${data.title}</h2>
                    <p>${data.description}</p>
                </div>`;
            } catch (err) {
                console.warn(`info.json missing for ${folder}`);
            }
        }
    }

    // Add click listener to all cards
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async () => {
            let folder = card.dataset.folder;
            songs = await getSongs(`songs/${folder}`);
            playMusic(songs[0]);
        });
    });
}

function setupControls() {
    const playBtn = document.getElementById("play");
    const prevBtn = document.getElementById("previous");
    const nextBtn = document.getElementById("next");
    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");
    const volumeSlider = document.querySelector(".range input");
    const volumeIcon = document.querySelector(".volume img");

    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playBtn.src = "img/pause.png";
        } else {
            currentSong.pause();
            playBtn.src = "img/play.png";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerText = 
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        circle.style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
    });

    seekbar.addEventListener("click", e => {
        let percent = (e.offsetX / seekbar.clientWidth) * 100;
        circle.style.left = `${percent}%`;
        currentSong.currentTime = (percent / 100) * currentSong.duration;
    });

    prevBtn.addEventListener("click", () => {
        let idx = songs.indexOf(currentSong.src.split("/").pop());
        if (idx > 0) playMusic(songs[idx - 1]);
    });

    nextBtn.addEventListener("click", () => {
        let idx = songs.indexOf(currentSong.src.split("/").pop());
        if (idx < songs.length - 1) playMusic(songs[idx + 1]);
    });

    volumeSlider.addEventListener("input", (e) => {
        currentSong.volume = e.target.value / 100;
        if (currentSong.volume > 0) {
            volumeIcon.src = "img/volume.svg";
        }
    });

    volumeIcon.addEventListener("click", () => {
        if (volumeIcon.src.includes("volume.svg")) {
            volumeIcon.src = "img/mute.svg";
            currentSong.volume = 0;
            volumeSlider.value = 0;
        } else {
            volumeIcon.src = "img/volume.svg";
            currentSong.volume = 0.1;
            volumeSlider.value = 10;
        }
    });

    // Hamburger + sidebar toggle
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });
}

async function main() {
    await getSongs("songs/ncs");
    playMusic(songs[0], true);
    await displayAlbums();
    setupControls();
}

main();
