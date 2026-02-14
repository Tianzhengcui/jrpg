export const joy = { x: 0, y: 0 };

/**
 * 虚拟摇杆（最小版）
 * 输出：joy.x / joy.y ∈ [-1, 1]
 * 如果页面没有摇杆 DOM（#stick/.knob/#output），不会报错，只是不启用摇杆。
 */

const knob = document.querySelector(".knob");
const stick = document.getElementById("stick");
const output = document.getElementById("output");

if (!knob || !stick || !output) {
  // 允许别的页面 import { joy }，但不强制必须存在摇杆 UI
  // console.warn("Joystick UI not found; joy stays at 0,0");
} else {
  let active = false;
  let center = { x: 0, y: 0 };
  const radius = 50;

  stick.addEventListener("pointerdown", (e) => {
    active = true;
    stick.setPointerCapture(e.pointerId);
    const rect = stick.getBoundingClientRect();
    center.x = rect.left + rect.width / 2;
    center.y = rect.top + rect.height / 2;
  });

  stick.addEventListener("pointermove", (e) => {
    if (!active) return;

    let dx = e.clientX - center.x;
    let dy = e.clientY - center.y;

    const dist = Math.hypot(dx, dy);
    const clamp = Math.min(dist, radius);
    const k = dist ? clamp / dist : 0;

    dx *= k;
    dy *= k;

    knob.style.transform =
      `translate(${dx}px,${dy}px) translate(-50%,-50%)`;

    joy.x = dx / radius;
    joy.y = dy / radius;

    output.innerHTML = `x: ${joy.x.toFixed(2)}<br>y: ${joy.y.toFixed(2)}`;
  });

  function reset() {
    active = false;
    knob.style.transform = "translate(-50%,-50%)";
    joy.x = 0;
    joy.y = 0;
    output.innerHTML = "x: 0<br>y: 0";
  }

  stick.addEventListener("pointerup", reset);
  stick.addEventListener("pointercancel", reset);
}
