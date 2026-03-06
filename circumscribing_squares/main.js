// --- Vector Math Helpers ---
function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
function scale(a, s) { return [a[0] * s, a[1] * s]; }
function dist(p1, p2) { return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2)); }
function normalize(v) { const d = dist([0,0], v); return d > 0 ? scale(v, 1/d) : [0,0]; }

/**
 * A robust function to find the intersection of two infinite lines.
 */
function linear_intersection(line1, line2) {
    const [p1, p2] = line1; const [p3, p4] = line2;
    const [x1, y1] = p1; const [x2, y2] = p2; const [x3, y3] = p3; const [x4, y4] = p4;
    const dx1 = x2 - x1; const dx2 = x4 - x3; const dy1 = y2 - y1; const dy2 = y4 - y3;

    if (dx1 === 0 && dx2 === 0) return x1 === x3 ? [x1, Infinity] : false;
    if (dx1 === 0 || dx2 === 0) {
        let x, y;
        if (dx1 === 0) { x = x1; const m = dy2 / dx2; const b = y3 - m * x3; y = m * x + b;
        } else { x = x3; const m = dy1 / dx1; const b = y1 - m * x1; y = m * x + b; }
        return [x, y];
    }
    const m1 = dy1 / dx1; const m2 = dy2 / dx2;
    const b1 = y1 - m1 * x1; const b2 = y3 - m2 * x3;
    if (Math.abs(m1 - m2) < 1e-9) return Math.abs(b1 - b2) < 1e-9;
    const x = (b2 - b1) / (m1 - m2);
    const y = m1 * x + b1;
    return [x, y];
}

// --- Main Application ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const ref_len = Math.min(canvas.width, canvas.height);
const p_initial = [ canvas.width / 2, (canvas.height / 2) + (0.15 * ref_len) ];
const q_initial = [p_initial[0], p_initial[1] - 0.30 * ref_len];
const r_disp = 0.15 * ref_len * (1 / Math.sqrt(2));
const r_initial = [p_initial[0] + r_disp, p_initial[1] - r_disp];

const handles = [
    { position: q_initial, radius: 10, color: 'white' }, // Q
    { position: p_initial, radius: 10, color: 'white' }, // P
    { position: r_initial, radius: 10, color: 'white' }  // R
];

let point_grabbed = null;

// --- UI State and Definitions ---
let constrainAngleActive = false;
let constrainSizeActive = false;

const angleToggle = { x: 0, y: 10, width: 150, height: 30, text: "Constrain Angle" };
const sizeToggle = { x: 0, y: 50, width: 150, height: 30, text: "Constrain Size" };
angleToggle.x = canvas.width - angleToggle.width - 10;
sizeToggle.x = canvas.width - sizeToggle.width - 10;


function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // --- CONSTRAINT LOGIC ---
    const q_pos = handles[0].position;
    const p_pos = handles[1].position;
    let r_pos = handles[2].position;

    if (constrainSizeActive) {
        const len_pq = dist(p_pos, q_pos);
        const vec_pr_dir = normalize(sub(r_pos, p_pos));
        r_pos = add(p_pos, scale(vec_pr_dir, len_pq));
        handles[2].position = r_pos;
    }

    if (constrainAngleActive) {
        const vec_pq = sub(q_pos, p_pos);
        const len_pr = dist(p_pos, r_pos);
        const angle_pq = Math.atan2(vec_pq[1], vec_pq[0]);
        // Corrected from subtraction to addition for counter-clockwise rotation
        const target_angle = angle_pq + (Math.PI / 4); // +45 degrees
        const new_r_vec = [len_pr * Math.cos(target_angle), len_pr * Math.sin(target_angle)];
        handles[2].position = add(p_pos, new_r_vec);
    }
    
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);

    // --- Shape Calculations ---
    const adjacent_corner_q = handles[0].position;
    const square_a_corner = handles[1].position;
    const q_minus_p = sub(adjacent_corner_q, square_a_corner);
    const delta_x = (q_minus_p[0] + q_minus_p[1]) / 2;
    const delta_y = (q_minus_p[1] - q_minus_p[0]) / 2;
    const square_a_delta = [delta_x, delta_y];
    const square_a_origin = add(square_a_corner, square_a_delta);
    const square_a_delta_right = [square_a_delta[1], -square_a_delta[0]];
    const pts1 = [ sub(square_a_origin, square_a_delta_right), add(square_a_origin, square_a_delta), add(square_a_origin, square_a_delta_right), square_a_corner ];

    const square_b_corner = handles[2].position;
    const square_b_delta = scale(sub(square_b_corner, square_a_corner), 0.5);
    const square_b_delta_right = [-square_b_delta[1], square_b_delta[0]];
    const square_b_origin = add(add(square_a_corner, square_b_delta), square_b_delta_right);
    const pts2 = [ square_a_corner, square_b_corner, add(add(square_b_origin, square_b_delta), square_b_delta_right), add(sub(square_b_origin, square_b_delta), square_b_delta_right) ];

    // --- Draw Shapes and Segments ---
    drawPolygon(pts1, 'rgba(0, 255, 255, 0.25)');
    drawLines(pts1, 'rgb(200, 200, 200)');
    drawCircles(pts1, 10, 'rgba(0, 255, 255, 0.5)');
    drawPolygon(pts2, 'rgba(0, 255, 255, 0.25)');
    drawLines(pts2, 'rgb(200, 200, 200)');
    drawCircles(pts2, 10, 'rgba(0, 255, 255, 0.5)');
    const a2 = pts1[2]; const b2 = pts2[3];
    drawSegment(a2, b2, 'rgb(200, 200, 200)', 2);

    // --- Define and Draw Construction Lines ---
    const line1 = [square_a_origin, add(square_a_origin, add(square_a_delta, square_a_delta_right))];
    const line2 = [square_b_origin, scale(add(square_a_corner, square_b_corner), 0.5)];
    const segment_center = scale(add(a2, b2), 0.5);
    const perp_dir = [-sub(b2, a2)[1], sub(b2, a2)[0]];
    const line3 = [segment_center, add(segment_center, perp_dir)];
    drawExtendedLine(line1[0], line1[1], 'rgba(255, 255, 0, 0.3)', 1);
    drawExtendedLine(line2[0], line2[1], 'rgba(255, 255, 0, 0.3)', 1);
    drawExtendedLine(line3[0], line3[1], 'rgba(255, 255, 0, 0.3)', 1);

    // --- Calculate and Draw Intersections ---
    const all_shape_points = pts1.concat(pts2);
    drawIntersectionCircle(linear_intersection(line1, line2), all_shape_points, "C1");
    drawIntersectionCircle(linear_intersection(line1, line3), all_shape_points, "C2");
    drawIntersectionCircle(linear_intersection(line2, line3), all_shape_points, "C3");

    // --- Draw Labels last to be on top ---
    drawLabel(pts1[0], "Q"); drawLabel(pts1[1], "A1"); drawLabel(pts1[2], "A2");
    drawLabel(pts1[3], "P"); drawLabel(pts2[1], "R"); drawLabel(pts2[2], "B1"); drawLabel(pts2[3], "B2");
    
    handles.forEach(p => drawCircle(p.position, p.radius, p.color));
    
    ctx.restore();

    // --- DRAW UI TOGGLES ---
    drawToggle(angleToggle, constrainAngleActive);
    drawToggle(sizeToggle, constrainSizeActive);

    requestAnimationFrame(draw);
}

// --- Drawing Helpers ---
function drawPolygon(pts, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill(); }
function drawLines(pts, color) { ctx.strokeStyle = color; ctx.lineWidth = 2; for (let i = 0; i < pts.length; i++) { ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1]); ctx.stroke(); } }
function drawCircles(pts, radius, color) { pts.forEach(pt => drawCircle(pt, radius, color)); }
function drawCircle(pos, radius, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(pos[0], pos[1], radius, 0, Math.PI * 2); ctx.fill(); }
function drawSegment(p1, p2, color, thickness) { ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); }
function drawExtendedLine(p1, p2, color, thickness) { const dir = sub(p2, p1); if (dist([0,0], dir) < 1e-6) return; const k = 10000; const start = add(p1, scale(dir, -k)); const end = add(p1, scale(dir, k)); drawSegment(start, end, color, thickness); }
function drawLabel(pos, text) { const yOffset = 30; ctx.save(); ctx.scale(1, -1); ctx.font = "14px Arial"; ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(text, pos[0], -pos[1] - yOffset); ctx.restore(); }
function drawIntersectionCircle(center, points, label) {
    if (typeof center !== 'object' || center === null || !Array.isArray(center)) return;
    drawCircle(center, 10, 'rgba(255, 255, 0, 0.8)');
    drawLabel(center, label);
    let radius = 0;
    for (const p of points) { const c = dist(center, p); if (c > radius) radius = c; }
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.arc(center[0], center[1], radius, 0, Math.PI * 2); ctx.stroke();
}
function drawToggle(toggle, isActive) {
    ctx.fillStyle = isActive ? '#4CAF50' : '#555';
    ctx.fillRect(toggle.x, toggle.y, toggle.width, toggle.height);
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(toggle.text, toggle.x + toggle.width / 2, toggle.y + toggle.height / 2);
}

// --- Event Handlers ---
canvas.addEventListener('mousedown', e => {
    const mousePos = [e.clientX, e.clientY];
    
    if (mousePos[0] > angleToggle.x && mousePos[0] < angleToggle.x + angleToggle.width &&
        mousePos[1] > angleToggle.y && mousePos[1] < angleToggle.y + angleToggle.height) {
        constrainAngleActive = !constrainAngleActive;
        return;
    }
    if (mousePos[0] > sizeToggle.x && mousePos[0] < sizeToggle.x + sizeToggle.width &&
        mousePos[1] > sizeToggle.y && mousePos[1] < sizeToggle.y + sizeToggle.height) {
        constrainSizeActive = !constrainSizeActive;
        return;
    }

    const flippedMousePos = [e.clientX, canvas.height - e.clientY];
    for (const p of handles) {
        if (dist(flippedMousePos, p.position) < p.radius) {
            point_grabbed = p;
            p.color = 'red';
            break;
        }
    }
});
canvas.addEventListener('mousemove', e => { if (point_grabbed) point_grabbed.position = [e.clientX, canvas.height - e.clientY]; });
canvas.addEventListener('mouseup', () => { if (point_grabbed) { point_grabbed.color = 'white'; point_grabbed = null; } });

// --- Start the animation ---
requestAnimationFrame(draw);