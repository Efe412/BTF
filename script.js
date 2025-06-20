let currentPage = 1;
function nextPage() {
  document.getElementById(`page${currentPage}`).classList.remove('active');
  currentPage++;
  if (document.getElementById(`page${currentPage}`))
    document.getElementById(`page${currentPage}`).classList.add('active');
}

// Kalp animasyonu
const canvas = document.getElementById("hearts");
const ctx = canvas.getContext("2d");

let width, height;
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let hearts = [];

function createHeart() {
  hearts.push({
    x: Math.random() * width,
    y: -50,
    size: 20 + Math.random() * 20,
    speed: 0.5 + Math.random() * 1
  });
}

function drawHeart(x, y, size) {
  ctx.font = size + "px Arial";
  ctx.fillText("❤️", x, y);
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  if (Math.random() < 0.05) createHeart();
  hearts.forEach((heart, index) => {
    heart.y += heart.speed;
    drawHeart(heart.x, heart.y, heart.size);
    if (heart.y > height + 50) hearts.splice(index, 1);
  });
  requestAnimationFrame(animate);
}

ctx.font = "30px Arial";
animate();
