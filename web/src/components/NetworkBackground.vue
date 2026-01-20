<script setup>
import { onMounted, onUnmounted, ref } from "vue";

const canvasRef = ref(null);
let animationId = null;

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = canvas.parentElement.offsetWidth);
  let height = (canvas.height = canvas.parentElement.offsetHeight);

  // --- Professional/Enterprise Configuration ---
  const nodeColor = "rgba(99, 102, 241, 0.25)"; // Subtle Indigo
  const lineColor = "rgba(99, 102, 241, 0.08)"; // Very faint Indigo
  const nodeRadius = 2;
  const gridSpacing = 80; // Sparser grid

  // --- Data Structures ---
  const nodes = [];
  const lines = [];
  const pulses = [];

  // --- Initialize Grid of Nodes (Fewer, More Sparse) ---
  for (let x = gridSpacing / 2; x < width; x += gridSpacing) {
    for (let y = gridSpacing / 2; y < height; y += gridSpacing) {
      if (Math.random() > 0.4) {
        // Even more sparse
        nodes.push({
          x: x + (Math.random() - 0.5) * 15,
          y: y + (Math.random() - 0.5) * 15,
        });
      }
    }
  }

  // --- Connect Nodes (Cleaner, Fewer Lines) ---
  nodes.forEach((node, i) => {
    for (let j = i + 1; j < nodes.length; j++) {
      const other = nodes[j];
      const dx = Math.abs(node.x - other.x);
      const dy = Math.abs(node.y - other.y);

      // Connect only if very aligned (straight lines)
      if ((dx < gridSpacing * 1.2 && dy < 10) || (dy < gridSpacing * 1.2 && dx < 10)) {
        if (Math.random() > 0.6) {
          // Fewer connections
          lines.push({ from: node, to: other });
        }
      }
    }
  });

  // --- Create Pulses (Fewer, Subtler) ---
  function createPulse() {
    if (lines.length === 0) return;
    const line = lines[Math.floor(Math.random() * lines.length)];
    pulses.push({
      line: line,
      progress: 0,
      speed: 0.002 + Math.random() * 0.003, // SLOWER for elegance
      reverse: Math.random() > 0.5,
      opacity: 0.4 + Math.random() * 0.3, // Variable subtle opacity
    });
  }

  // Add fewer initial pulses
  for (let i = 0; i < 12; i++) {
    createPulse();
  }

  // --- Animation Loop ---
  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw Lines (Very Subtle)
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    lines.forEach((line) => {
      ctx.beginPath();
      ctx.moveTo(line.from.x, line.from.y);
      ctx.lineTo(line.to.x, line.to.y);
      ctx.stroke();
    });

    // Draw Nodes (Small, Subtle)
    ctx.fillStyle = nodeColor;
    nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Update and Draw Pulses (Elegant Glow)
    pulses.forEach((pulse) => {
      pulse.progress += pulse.speed;
      if (pulse.progress > 1) {
        pulse.line = lines[Math.floor(Math.random() * lines.length)];
        pulse.progress = 0;
        pulse.reverse = Math.random() > 0.5;
        pulse.opacity = 0.4 + Math.random() * 0.3;
      }

      const p = pulse.reverse ? 1 - pulse.progress : pulse.progress;
      const x = pulse.line.from.x + (pulse.line.to.x - pulse.line.from.x) * p;
      const y = pulse.line.from.y + (pulse.line.to.y - pulse.line.from.y) * p;

      // Subtle glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
      gradient.addColorStop(0, `rgba(129, 140, 248, ${pulse.opacity})`);
      gradient.addColorStop(1, "rgba(129, 140, 248, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    animationId = requestAnimationFrame(animate);
  }

  animate();

  // Handle Resize
  const handleResize = () => {
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
  };
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<template>
  <canvas
    ref="canvasRef"
    class="circuit-canvas"
  />
</template>

<style scoped>
.circuit-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}
</style>
