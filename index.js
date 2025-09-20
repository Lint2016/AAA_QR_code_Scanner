const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const output = document.getElementById("output");
const beep = document.getElementById("beep");

let lastScanned = null;
const cooldown = 2000; // 2 sec between same QR scans

// Start camera
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
  .then(stream => {
    video.srcObject = stream;
    video.setAttribute("playsinline", true); // iOS compatibility
    video.play();
    setInterval(scanLoop, 70); // ~14 FPS instead of 60
  })
  .catch(err => {
    console.error("Camera error:", err);
    output.textContent = "Error accessing camera.";
    output.style.color = "red";
  });

function scanLoop() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      handleQRCode(code.data, code.location);
    }
  }
}

function handleQRCode(data, location) {
  const now = Date.now();
  if (lastScanned && now - lastScanned < cooldown) return; // prevent double scan
  lastScanned = now;

  // ✅ Local feedback (instant)
  beep.currentTime = 0;
  beep.play().catch(() => {});
  if (navigator.vibrate) navigator.vibrate(200);

  // Draw green box
  ctx.beginPath();
  ctx.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
  ctx.lineTo(location.topRightCorner.x, location.topRightCorner.y);
  ctx.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
  ctx.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
  ctx.closePath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "lime";
  ctx.stroke();

  // ✅ Update UI
  output.textContent = `QR Code: ${data}`;
  output.style.color = "green";

  // ✅ Call backend to validate ticket
  validateTicket(data);
}

// Placeholder for backend validation
async function validateTicket(ticketId) {
  try {
    // Example: Replace with your Firebase or server API
    const res = await fetch(`/api/validate-ticket?id=${encodeURIComponent(ticketId)}`);
    const result = await res.json();

    if (result.valid) {
      output.textContent = `✅ Ticket OK: ${ticketId}`;
      output.style.color = "green";
    } else {
      output.textContent = `❌ Invalid/Used Ticket: ${ticketId}`;
      output.style.color = "red";

      // Error feedback
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // buzz-buzz
    }
  } catch (err) {
    console.error("Validation error:", err);
    output.textContent = "⚠️ Network error";
    output.style.color = "orange";
  }
}
