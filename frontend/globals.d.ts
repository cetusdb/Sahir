@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }

html, body {
  background-color: #0b0d12;
  color: #e9edf5;
  min-height: 100%;
  transition: background-color 400ms ease;
}

* { box-sizing: border-box; }

a { color: inherit; text-decoration: none; }

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: #2a3145; border-radius: 8px; }
::-webkit-scrollbar-track { background: #0b0d12; }

.poster-fade {
  background: linear-gradient(to top, rgba(11,13,18,0.95) 0%, rgba(11,13,18,0) 60%);
}

/* Karusel scrollbar — ince ve diskret */
.carousel-track::-webkit-scrollbar { height: 6px; }
.carousel-track::-webkit-scrollbar-track { background: transparent; }
.carousel-track::-webkit-scrollbar-thumb {
  background: #2a3145; border-radius: 8px;
}
.carousel-track::-webkit-scrollbar-thumb:hover { background: #3a4258; }
.carousel-track { scrollbar-width: thin; scrollbar-color: #2a3145 transparent; }

/* ============================================================
   Toast & Modal animasyonları
   ============================================================ */
@keyframes toast-in {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
.animate-toast-in { animation: toast-in 280ms cubic-bezier(0.2, 0.8, 0.2, 1); }

@keyframes modal-in {
  from { transform: scale(0.94) translateY(8px); opacity: 0; }
  to   { transform: scale(1)    translateY(0);   opacity: 1; }
}
.animate-modal-in { animation: modal-in 200ms ease-out; }

@keyframes modal-bg {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.animate-modal-bg { animation: modal-bg 180ms ease-out; }

/* ============================================================
   CHRISTMAS TEMA — kırmızı, altın, kar
   ============================================================ */
html[data-theme="christmas"] body {
  background:
    radial-gradient(circle at 20% 0%, rgba(196,30,58,0.10), transparent 50%),
    radial-gradient(circle at 80% 100%, rgba(34,139,34,0.10), transparent 50%),
    #0b0f0d;
}

html[data-theme="christmas"] .text-accent  { color: #d4af37 !important; }
html[data-theme="christmas"] .bg-accent    { background-color: #c41e3a !important; color: #fff !important; }
html[data-theme="christmas"] .border-accent{ border-color: #d4af37 !important; }
html[data-theme="christmas"] .text-accent2 { color: #228B22 !important; }
html[data-theme="christmas"] .bg-accent2   { background-color: #228B22 !important; }
html[data-theme="christmas"] .border-accent2{ border-color: #228B22 !important; }

html[data-theme="christmas"] header {
  border-bottom: 2px solid #c41e3a !important;
  background:
    repeating-linear-gradient(45deg,
      rgba(196,30,58,0.05) 0 12px,
      rgba(34,139,34,0.05) 12px 24px),
    rgba(11,15,13,0.85) !important;
}

html[data-theme="christmas"] body::before {
  content: '❄  ❄  ❄  ❄  ❄  ❄  ❄  ❄  ❄  ❄  ❄  ❄';
  position: fixed;
  top: -2rem;
  left: 0;
  right: 0;
  text-align: justify;
  pointer-events: none;
  font-size: 1.25rem;
  color: rgba(255,255,255,0.45);
  letter-spacing: 1.2rem;
  z-index: 9998;
  animation: snow-fall 12s linear infinite;
  white-space: nowrap;
  overflow: hidden;
}
html[data-theme="christmas"] body::after {
  content: '🎄  🎁  ⭐  🎄  🎁  ⭐  🎄  🎁';
  position: fixed;
  top: -3rem;
  left: 0; right: 0;
  text-align: justify;
  pointer-events: none;
  font-size: 0.95rem;
  letter-spacing: 3rem;
  z-index: 9997;
  animation: snow-fall 18s linear infinite;
  animation-delay: -6s;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
}

@keyframes snow-fall {
  0%   { transform: translateY(0); }
  100% { transform: translateY(110vh); }
}

/* ============================================================
   HALLOWEEN TEMA — turuncu, mor, kabak
   ============================================================ */
html[data-theme="halloween"] body {
  background:
    radial-gradient(circle at 30% 0%, rgba(255,107,0,0.12), transparent 50%),
    radial-gradient(circle at 70% 100%, rgba(147,51,234,0.15), transparent 50%),
    #0d0a14;
}

html[data-theme="halloween"] .text-accent  { color: #ff6b00 !important; }
html[data-theme="halloween"] .bg-accent    { background-color: #ff6b00 !important; color: #1a0d1f !important; }
html[data-theme="halloween"] .border-accent{ border-color: #ff6b00 !important; }
html[data-theme="halloween"] .text-accent2 { color: #c084fc !important; }
html[data-theme="halloween"] .bg-accent2   { background-color: #9333ea !important; }
html[data-theme="halloween"] .border-accent2{ border-color: #9333ea !important; }

html[data-theme="halloween"] header {
  border-bottom: 2px solid #ff6b00 !important;
  background:
    repeating-linear-gradient(135deg,
      rgba(255,107,0,0.05) 0 12px,
      rgba(147,51,234,0.05) 12px 24px),
    rgba(13,10,20,0.9) !important;
}

html[data-theme="halloween"] body::before {
  content: '🎃';
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  font-size: 2.5rem;
  pointer-events: none;
  z-index: 9998;
  animation: pumpkin-bounce 2.4s ease-in-out infinite;
  filter: drop-shadow(0 0 10px rgba(255,107,0,0.6));
}
html[data-theme="halloween"] body::after {
  content: '🦇';
  position: fixed;
  top: 5rem;
  right: 2rem;
  font-size: 2rem;
  pointer-events: none;
  z-index: 9998;
  animation: bat-fly 8s ease-in-out infinite;
}

@keyframes pumpkin-bounce {
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50%      { transform: translateY(-10px) rotate(3deg); }
}
@keyframes bat-fly {
  0%   { transform: translate(0, 0) rotate(-10deg); }
  25%  { transform: translate(-30vw, 5vh) rotate(10deg); }
  50%  { transform: translate(-60vw, -2vh) rotate(-5deg); }
  75%  { transform: translate(-30vw, 8vh) rotate(15deg); }
  100% { transform: translate(0, 0) rotate(-10deg); }
}

/* ============================================================
   SEVGİLİLER GÜNÜ TEMA — pembe, kırmızı, kalp
   ============================================================ */
html[data-theme="valentines"] body {
  background:
    radial-gradient(circle at 30% 20%, rgba(244,114,182,0.15), transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(225,29,72,0.10), transparent 50%),
    #150b10;
}

html[data-theme="valentines"] .text-accent  { color: #f472b6 !important; }
html[data-theme="valentines"] .bg-accent    { background-color: #e11d48 !important; color: #fff !important; }
html[data-theme="valentines"] .border-accent{ border-color: #f472b6 !important; }
html[data-theme="valentines"] .text-accent2 { color: #fb7185 !important; }
html[data-theme="valentines"] .bg-accent2   { background-color: #be185d !important; }
html[data-theme="valentines"] .border-accent2{ border-color: #fb7185 !important; }

html[data-theme="valentines"] header {
  border-bottom: 2px solid #e11d48 !important;
  background:
    repeating-linear-gradient(45deg,
      rgba(244,114,182,0.05) 0 12px,
      rgba(225,29,72,0.05) 12px 24px),
    rgba(21,11,16,0.85) !important;
}

html[data-theme="valentines"] body::before {
  content: '💕  ❤️  💖  💕  ❤️  💖  💕  ❤️  💖';
  position: fixed;
  top: -2rem;
  left: 0; right: 0;
  text-align: justify;
  pointer-events: none;
  font-size: 1.25rem;
  letter-spacing: 2rem;
  z-index: 9998;
  animation: hearts-fall 14s linear infinite;
  white-space: nowrap;
  overflow: hidden;
}
html[data-theme="valentines"] body::after {
  content: '🌹  💐  💋  🌹  💐  💋';
  position: fixed;
  top: -3rem;
  left: 0; right: 0;
  text-align: justify;
  pointer-events: none;
  font-size: 1rem;
  letter-spacing: 4rem;
  z-index: 9997;
  animation: hearts-fall 20s linear infinite;
  animation-delay: -7s;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
}

@keyframes hearts-fall {
  0%   { transform: translateY(0); }
  100% { transform: translateY(110vh); }
}

/* ============================================================
   KIŞ TEMA — mavi tonlar, kar
   ============================================================ */
html[data-theme="winter"] body {
  background:
    radial-gradient(circle at 20% 0%, rgba(96,165,250,0.12), transparent 50%),
    radial-gradient(circle at 80% 100%, rgba(165,243,252,0.08), transparent 50%),
    #0a0f1a;
}

html[data-theme="winter"] .text-accent  { color: #93c5fd !important; }
html[data-theme="winter"] .bg-accent    { background-color: #2563eb !important; color: #fff !important; }
html[data-theme="winter"] .border-accent{ border-color: #93c5fd !important; }
html[data-theme="winter"] .text-accent2 { color: #67e8f9 !important; }
html[data-theme="winter"] .bg-accent2   { background-color: #0891b2 !important; }
html[data-theme="winter"] .border-accent2{ border-color: #67e8f9 !important; }

html[data-theme="winter"] header {
  border-bottom: 2px solid #2563eb !important;
  background:
    repeating-linear-gradient(135deg,
      rgba(37,99,235,0.05) 0 12px,
      rgba(8,145,178,0.05) 12px 24px),
    rgba(10,15,26,0.9) !important;
}

html[data-theme="winter"] body::before {
  content: '❄  ❄  ❄  ❄  ❄  ❄  ❄  ❄  ❄  ❄  ❄  ❄';
  position: fixed;
  top: -2rem;
  left: 0; right: 0;
  text-align: justify;
  pointer-events: none;
  font-size: 1.4rem;
  color: rgba(165,243,252,0.5);
  letter-spacing: 1.2rem;
  z-index: 9998;
  animation: snow-fall 12s linear infinite;
  white-space: nowrap;
  overflow: hidden;
}

/* Mobilde dekoratif elemanları küçült */
@media (max-width: 640px) {
  html[data-theme="christmas"] body::before,
  html[data-theme="christmas"] body::after,
  html[data-theme="winter"] body::before { font-size: 0.9rem; }
  html[data-theme="halloween"] body::before { font-size: 1.8rem; }
  html[data-theme="halloween"] body::after  { font-size: 1.4rem; }
  html[data-theme="valentines"] body::before,
  html[data-theme="valentines"] body::after { font-size: 0.95rem; }
}
