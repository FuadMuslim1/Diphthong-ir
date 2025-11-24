// ---- Modal controls ----
const modal = document.getElementById('videoModal');
const openBtn = document.getElementById('openVideo');
const closeBtn = document.getElementById('closeVideo');
const playBtn = document.getElementById('playNow');
const pauseBtn = document.getElementById('pauseNow');

openBtn.addEventListener('click', () => {
  modal.hidden = false;
  if (player && player.seekTo) {
    player.seekTo(0);
  }
  // make sure player (under header) is visible to the user
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
});
closeBtn.addEventListener('click', () => {
  modal.hidden = true;
  if (player && player.pauseVideo) player.pauseVideo();
  clearActive();
});
playBtn.addEventListener('click', () => player && player.playVideo && player.playVideo());
pauseBtn.addEventListener('click', () => player && player.pauseVideo && player.pauseVideo());

// ---- Highlight logic ----
const cards = Array.from(document.querySelectorAll('.word-card'));

// Cue times (seconds) when each word starts in the video.
// ⚠️ Replace with the actual timings from your Shorts audio.
const cueTimes = [
  0.5, 1.5, 2.4, 3.3, 4.2, 5.0, 5.8, 6.6, 7.4, 8.2,
  9.0, 9.8, 10.6, 11.4, 12.2, 13.0, 13.8, 14.6, 15.4, 16.2,
  17.0, 17.8, 18.6, 19.4, 20.2, 21.0, 21.8, 22.6, 23.4, 24.2
];

let currentIndex = -1;
function setActive(index) {
  // Hanya digunakan untuk membersihkan highlight yang mungkin ada.
  if (index === currentIndex) return;
  clearActive();
  if (index >= 0 && index < cards.length) {
    currentIndex = index;
  }
}
function clearActive() {
  // Hapus kelas 'active' dari semua kartu.
  cards.forEach(card => card.classList.remove('active'));
  currentIndex = -1;
}

// ---- Autoscroll triggers ----
// Map explicit times to the word text we want to scroll to.
const timeTriggers = [
  { time: 0.5, word: 'appear' },
  { time: 9, word: 'dear' },
  // { time: 16, word: 'experience' }, <--- Baris ini telah dihapus sesuai permintaan
  { time: 20, word: 'mysterious' },
  { time: 28, word: 'year' }
];
const triggered = new Set();

function resetTriggers() {
  triggered.clear();
}

function scrollToWordByText(word) {
  const el = Array.from(document.querySelectorAll('.word-card .word'))
    .find(p => p.textContent.trim().toLowerCase() === word.toLowerCase());
  if (!el) return;
  const card = el.closest('.word-card');
  // If the player is visible under the header, offset scroll so the card
  // appears below the header + player bar.
  const playerContent = document.querySelector('.player-content');
  const header = document.querySelector('header');
  const elementAbsoluteTop = el.getBoundingClientRect().top + window.scrollY;
  if (playerContent && !document.getElementById('videoModal').hidden) {
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const playerHeight = playerContent.getBoundingClientRect().height;
    const gap = 18; // px gap between player and scrolled-to card
    const scrollTarget = Math.max(0, elementAbsoluteTop - (headerHeight + playerHeight + gap));
    window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  } else {
    // No player visible: just bring into view
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ---- YouTube IFrame API ----
let player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('ytPlayer', {
    videoId: 'okOqQQ1kqDM', // Shorts ID from your link
    playerVars: {
      modestbranding: 1,
      rel: 0,
      playsinline: 1
    },
    events: {
      onReady: () => {
        if (!modal.hidden) player.playVideo();
        startTick();
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          clearActive();
        }
      }
    }
  });
}

// ---- Time-based ticker to update highlights ----
let tickId = null;
function startTick() {
  if (tickId) return;
  tickId = setInterval(() => {
    if (!player || typeof player.getCurrentTime !== 'function') return;
    const t = player.getCurrentTime();
    
    // time-triggered autoscroll + explicit highlights
    for (const trig of timeTriggers) {
      // small tolerance so it fires when we pass the time
      if (t >= trig.time && !triggered.has(trig.time)) {
        triggered.add(trig.time);
        scrollToWordByText(trig.word);
        
        // Tambahkan highlight visual khusus untuk kata yang di-scroll-to
        const el = Array.from(document.querySelectorAll('.word-card .word'))
          .find(p => p.textContent.trim().toLowerCase() === trig.word.toLowerCase());
        if (el) {
          const card = el.closest('.word-card');
          // Hapus semua highlight sebelumnya dari kata-kata yang bukan trigger
          clearActive(); 
          
          card.classList.add('active'); // Tambahkan highlight
          // Hapus highlight setelah durasi singkat
          setTimeout(() => {
            if (card) card.classList.remove('active');
          }, 2000);
        }
      }
    }
  }, 100); // update 10 times per second
}

window.addEventListener('beforeunload', () => {
  if (tickId) clearInterval(tickId);
});

// Reset triggers when modal opens/closes or when user seeks to start
openBtn.addEventListener('click', () => {
  resetTriggers();
});
closeBtn.addEventListener('click', () => {
  resetTriggers();
});

// If the player supports onStateChange events, ensure triggers reset on seek
function safeSeekToStart() {
  if (player && player.seekTo) {
    player.seekTo(0);
    resetTriggers();
  }
}