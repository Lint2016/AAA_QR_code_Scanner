const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const output = document.getElementById("output");
  const ctx = canvas.getContext("2d");

  // Ask for camera access
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" } // back camera on phones
      });
      video.srcObject = stream;
      requestAnimationFrame(scanLoop);
    } catch (err) {
      output.textContent = "❌ Camera access denied or not available.";
      output.style.color = "red";
    }
  }

  function scanLoop() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        // ✅ Found a QR code
        output.textContent = `QR Code: ${code.data}`;
        output.style.color = "green";
        // 🎵 Play success beep
      const beep = document.getElementById("beep");
      beep.currentTime = 0;   // rewind if it’s still playing
      beep.play().catch(() => {});

      // 📳 Vibrate phone (most mobile devices)
      if (navigator.vibrate) {
        navigator.vibrate(200); // vibrate for 200ms
      }

        // Draw box around QR
        ctx.beginPath();
        ctx.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
        ctx.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
        ctx.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
        ctx.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
        ctx.closePath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "lime";
        ctx.stroke();
      }else{
          const errorSound = document.getElementById("error-sound");
       errorSound.currentTime = 0;
       errorSound.play().catch(() => {});
      }
    }
    requestAnimationFrame(scanLoop); // keep scanning
  }

  startCamera();