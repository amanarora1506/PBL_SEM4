document.addEventListener('DOMContentLoaded', () => {

    // --- PLANNER FORM ---
    const plannerForm = document.getElementById('plannerForm');
    const generateBtn = document.getElementById('generateBtn');

    // Auto-calculate area
    const plotLenInput = document.getElementById('plot_length');
    const plotWidInput = document.getElementById('plot_width');
    const areaDisplay = document.getElementById('total_area_display');
    
    if (plotLenInput && plotWidInput && areaDisplay) {
        const calculateArea = () => {
            const l = parseFloat(plotLenInput.value) || 0;
            const w = parseFloat(plotWidInput.value) || 0;
            areaDisplay.textContent = (l * w).toLocaleString() + ' sq.ft';
        };
        plotLenInput.addEventListener('input', calculateArea);
        plotWidInput.addEventListener('input', calculateArea);
    }

    if (plannerForm && generateBtn) {
        generateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const formData = new FormData(plannerForm);
            const data = Object.fromEntries(formData.entries());
            
            if (!data.length || !data.width || data.length <= 0 || data.width <= 0) {
                alert("Please valid enter plot dimensions.");
                return;
            }

            localStorage.setItem('plannerData', JSON.stringify(data));
            window.location.href = `/results?l=${data.length}&w=${data.width}`;
        });
    }

    // --- RESULTS LOGIC ---
    const resultsContainer = document.querySelector('.results-layout');
    
    if (resultsContainer) {
        let currentLayouts = [];
        let activeLayoutIndex = 0;
        
        let plotLen = window.plotLength || 50;
        let plotW = window.plotWidth || 30;

        async function fetchLayouts() {
            const plannerData = JSON.parse(localStorage.getItem('plannerData')) || {};
            plannerData.length = plotLen;
            plannerData.width = plotW;

            try {
                const response = await fetch('/api/generate_layout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(plannerData)
                });
                const result = await response.json();
                
                if (result.layouts && result.layouts.length > 0) {
                    currentLayouts = result.layouts;
                    renderLayoutOptions();
                    selectLayout(0);
                } else {
                    console.error("No layouts received.");
                }
            } catch (error) {
                console.error("Error fetching layout:", error);
            }
        }
        
        function renderLayoutOptions() {
            const container = document.getElementById('layout-options');
            container.innerHTML = '';
            
            currentLayouts.forEach((layoutObj, idx) => {
                const isAct = idx === activeLayoutIndex ? 'active' : '';
                const div = document.createElement('div');
                div.className = `layout-card ${isAct}`;
                div.innerHTML = `
                    <h4>${layoutObj.type} Layout</h4>
                    <p>Efficiency Score: ${layoutObj.score}</p>
                `;
                div.addEventListener('click', () => {
                    document.querySelectorAll('.layout-card').forEach(n => n.classList.remove('active'));
                    div.classList.add('active');
                    selectLayout(idx);
                });
                container.appendChild(div);
            });
        }
        
        function selectLayout(idx) {
            activeLayoutIndex = idx;
            const layout = currentLayouts[idx];
            
            document.getElementById('score-display').innerHTML = `Score: <span class="gradient-text">${layout.score}</span>`;
            
            updateRoomList(layout.rooms);
            draw2D(layout.rooms);
            draw3D(layout.rooms);
        }
        
        function updateRoomList(rooms) {
            const list = document.getElementById('room-list');
            list.innerHTML = '';
            
            const getZoneColor = (zone) => {
                if(zone === 'Public') return '#3b82f6'; // Blue
                if(zone === 'Utility') return '#f59e0b'; // Amber
                if(zone === 'Private') return '#10b981'; // Green
                return '#94a3b8';
            };

            rooms.forEach(r => {
                const color = getZoneColor(r.zone);
                const li = document.createElement('li');
                li.className = 'room-item';
                li.innerHTML = `
                    <div style="display:flex; align-items:center;">
                        <span class="zone-dot" style="background-color: ${color}; color: ${color};"></span>
                        <span style="font-weight: 600">${r.name}</span>
                    </div>
                    <div style="color: #cbd5e1;">${Math.round(r.area)} sq.ft</div>
                `;
                list.appendChild(li);
            });
        }

        // --- 2D CANVAS ---
        function draw2D(rooms) {
            const canvas = document.getElementById('blueprint-canvas');
            const ctx = canvas.getContext('2d');
            
            const ratio = plotW / plotLen;
            
            // Extra padding
            const viewPadding = 50; 
            const containerWidth = canvas.parentElement.clientWidth - (viewPadding * 2);
            const containerHeight = canvas.parentElement.clientHeight - (viewPadding * 2);
            
            let cW, cH;
            if (ratio > (containerWidth / containerHeight)) {
                cW = containerWidth;
                cH = cW / ratio;
            } else {
                cH = containerHeight;
                cW = cH * ratio;
            }
            
            canvas.width = (cW + viewPadding * 2) * 2;
            canvas.height = (cH + viewPadding * 2) * 2;
            canvas.style.width = (cW + viewPadding * 2) + 'px';
            canvas.style.height = (cH + viewPadding * 2) + 'px';
            
            ctx.scale(2, 2);
            ctx.translate(viewPadding, viewPadding);
            ctx.clearRect(-viewPadding, -viewPadding, canvas.width, canvas.height); // Dark blue background handles this
            
            // --- DRAW GRID (Blueprint style) ---
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            const pxPerFtW = cW / plotW;
            const pxPerFtH = cH / plotLen;
            const pxPerFt = (pxPerFtW + pxPerFtH) / 2;
            
            for(let x = 0; x <= cW; x += pxPerFt) { 
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cH); ctx.stroke(); 
            }
            for(let y = 0; y <= cH; y += pxPerFt) { 
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cW, y); ctx.stroke(); 
            }

            // Function to draw simple dimension lines
            function drawDimensionLine(x1, y1, x2, y2, text, color='#94a3b8', isOuter=false) {
                ctx.strokeStyle = color;
                ctx.fillStyle = color;
                ctx.lineWidth = 1;
                
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                
                const tickLen = isOuter ? 8 : 4;
                if (Math.abs(y1 - y2) < 1) { // horizontal
                    ctx.beginPath(); ctx.moveTo(x1, y1-tickLen); ctx.lineTo(x1, y1+tickLen); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x2, y2-tickLen); ctx.lineTo(x2, y2+tickLen); ctx.stroke();
                    
                    ctx.font = isOuter ? '600 12px "Outfit", sans-serif' : '10px "Outfit", sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    const tw = ctx.measureText(text).width + 8;
                    ctx.clearRect(x1 + (x2-x1)/2 - tw/2, y1 - 8, tw, 16);
                    ctx.fillText(text, x1 + (x2-x1)/2, y1);
                } else { // vertical
                    ctx.beginPath(); ctx.moveTo(x1-tickLen, y1); ctx.lineTo(x1+tickLen, y1); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x2-tickLen, y2); ctx.lineTo(x2+tickLen, y2); ctx.stroke();
                    
                    ctx.save();
                    ctx.translate(x1, y1 + (y2-y1)/2); ctx.rotate(-Math.PI/2);
                    ctx.font = isOuter ? '600 12px "Outfit", sans-serif' : '10px "Outfit", sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    const tw = ctx.measureText(text).width + 8;
                    ctx.clearRect(-tw/2, -8, tw, 16);
                    ctx.fillText(text, 0, 0);
                    ctx.restore();
                }
            }

            // --- DRAW OUTER PERIMETER ---
            const wallThickness = 4; // Visual thickness
            ctx.fillStyle = '#94a3b8'; // Outer wall fill
            ctx.fillRect(-wallThickness, -wallThickness, cW + wallThickness*2, cH + wallThickness*2);
            
            ctx.clearRect(0, 0, cW, cH);
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(-wallThickness, -wallThickness, cW + wallThickness*2, cH + wallThickness*2);
            ctx.strokeRect(0, 0, cW, cH);

            // --- DRAW ROOMS ---
            rooms.forEach((r, i) => {
                const rx = r.x * cW;
                const ry = r.y * cH;
                const rw = r.w * cW;
                const rh = r.h * cH;
                
                // Inner walls
                ctx.fillStyle = '#64748b'; 
                const innerWT = 2;
                ctx.fillRect(rx - innerWT, ry - innerWT, rw + innerWT*2, rh + innerWT*2);
                
                // Clear room interior with glassmorphic zone color
                let fill = 'rgba(255,255,255,0.02)';
                if(r.zone === 'Public'){ fill = 'rgba(59, 130, 246, 0.15)'; } // Blue
                if(r.zone === 'Utility'){ fill = 'rgba(245, 158, 11, 0.15)'; } // Yellow/Orange
                if(r.zone === 'Private'){ fill = 'rgba(16, 185, 129, 0.15)'; } // Green
                
                ctx.fillStyle = fill;
                ctx.fillRect(rx, ry, rw, rh);
                
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#cbd5e1';
                ctx.strokeRect(rx, ry, rw, rh);
                
                // --- DRAW DOORS ---
                ctx.fillStyle = fill; 
                const doorSize = Math.min(rw, rh, 20); 
                if (doorSize > 12 && rw > doorSize*2) {
                    ctx.beginPath();
                    ctx.clearRect(rx + rw/2 - doorSize/2, ry + rh - innerWT, doorSize, innerWT*2);
                    ctx.strokeStyle = '#fbbf24'; 
                    ctx.lineWidth = 1;
                    ctx.arc(rx + rw/2 - doorSize/2, ry + rh, doorSize, 0, -Math.PI/2, true);
                    ctx.stroke();
                    ctx.strokeStyle = '#cbd5e1'; 
                }

                // --- ARCHITECTURAL DIMENSIONS ---
                const ftW = (r.w * plotW).toFixed(1);
                const ftH = (r.h * plotLen).toFixed(1);
                
                if (rw > 40) { drawDimensionLine(rx + 5, ry + 12, rx + rw - 5, ry + 12, `${ftW}'`, '#94a3b8'); }
                if (rh > 40) { drawDimensionLine(rx + 12, ry + 5, rx + 12, ry + rh - 5, `${ftH}'`, '#94a3b8'); }
                
                // --- DRAW INTERNAL ROOM LABELS ---
                ctx.fillStyle = '#f8fafc';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const textX = rx + rw / 2;
                const textY = ry + rh / 2;
                
                if(rw > 10 && rh > 10) {
                    ctx.font = '600 7px "Inter", sans-serif';
                    ctx.fillText(r.name.toUpperCase(), textX, textY - 8);
                    
                    ctx.font = '500 6px "Inter", sans-serif';
                    ctx.fillStyle = '#cbd5e1';
                    ctx.fillText(`${(r.area / 10.764).toFixed(1)} M2`, textX, textY); 
                    
                    const real_w = (r.w * plotW).toFixed(1);
                    const real_h = (r.h * plotLen).toFixed(1);
                    const start_x = (r.x * plotW).toFixed(1);
                    const start_y = (r.y * plotLen).toFixed(1);
                    
                    ctx.font = '400 5px "Inter", sans-serif';
                    ctx.fillStyle = '#94a3b8'; 
                    ctx.fillText(`Size: ${real_w}'x${real_h}'`, textX, textY + 8);
                    ctx.fillText(`Pos: (${start_x}',${start_y}')`, textX, textY + 14);
                }
            });

            // --- DRAW OVERALL EXTERNAL DIMENSIONS ---
            drawDimensionLine(0, -25, cW, -25, `${plotW} FT TOTAL WIDTH`, '#fbbf24', true);
            drawDimensionLine(-25, 0, -25, cH, `${plotLen} FT TOTAL LENGTH`, '#fbbf24', true);
        }

        // --- 3D THREE.JS ---
        let scene, camera, renderer, controls;
        let threeInitialized = false;
        
        function initThreeJS() {
            if(threeInitialized) return;
            threeInitialized = true;
            
            const container = document.getElementById('three-container');
            const w = container.clientWidth;
            const h = container.clientHeight;
            
            scene = new THREE.Scene();
            // Match the glass panel dark bg
            scene.background = new THREE.Color(0x0f172a);
            
            camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
            
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(w, h);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            container.appendChild(renderer.domElement);
            
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below ground
            
            // Lighting
            const ambient = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambient);
            
            const dirLight = new THREE.DirectionalLight(0xffffff, 1);
            dirLight.position.set(50, 80, 50);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            scene.add(dirLight);
            
            const fillLight = new THREE.DirectionalLight(0xa5b4fc, 0.3);
            fillLight.position.set(-50, 40, -50);
            scene.add(fillLight);
            
            const animate = function () {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };
            animate();
            
            window.addEventListener('resize', () => {
                if(container.clientWidth > 0) {
                    camera.aspect = container.clientWidth / container.clientHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(container.clientWidth, container.clientHeight);
                }
            });
        }
        
        let customMeshes = [];

        function draw3D(rooms) {
            const container = document.getElementById('three-container');
            // If hidden initially, three element has 0 size, we initialize but might need resize trigger when visible.
            initThreeJS();
            
            customMeshes.forEach(m => scene.remove(m));
            customMeshes = [];
            
            const maxDim = Math.max(plotLen, plotW);
            const scaleFactor = 60 / maxDim; // Map true size to ~60 units in WebGL
            
            const baseW = plotW * scaleFactor;
            const baseL = plotLen * scaleFactor;
            
            // Main Concrete Ground Base
            const planeGeo = new THREE.BoxGeometry(baseW + 2, 1, baseL + 2);
            const planeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
            const ground = new THREE.Mesh(planeGeo, planeMat);
            ground.position.y = -0.5;
            ground.receiveShadow = true;
            scene.add(ground);
            customMeshes.push(ground);

            const offsetX = baseW / 2;
            const offsetZ = baseL / 2;
            
            const wallH = 6;
            
            const zMap = {
                'Public': 0x3b82f6,
                'Utility': 0xf59e0b,
                'Private': 0x10b981
            };

            rooms.forEach((r, idx) => {
                const rw = r.w * baseW;
                const rl = r.h * baseL;
                
                // Inner room box (translucent glass block style)
                const geo = new THREE.BoxGeometry(rw - 0.4, wallH, rl - 0.4); // 0.4 gap
                
                const c = zMap[r.zone] || 0x64748b;
                const mat = new THREE.MeshPhysicalMaterial({
                    color: c,
                    transparent: true,
                    opacity: 0.8,
                    roughness: 0.2,
                    transmission: 0.5,
                    thickness: 1.0,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.1
                });
                
                const mesh = new THREE.Mesh(geo, mat);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                const px = (r.x * baseW) + (rw / 2) - offsetX;
                const pz = (r.y * baseL) + (rl / 2) - offsetZ;
                
                mesh.position.set(px, wallH / 2, pz);
                
                // entry animation pop effect
                mesh.scale.y = 0.01;
                scene.add(mesh);
                customMeshes.push(mesh);
                
                // Simple pop-up animation
                setTimeout(() => {
                    let s = 0.01;
                    const interval = setInterval(() => {
                        s += 0.1;
                        if(s >= 1) {
                            mesh.scale.y = 1;
                            clearInterval(interval);
                        } else {
                            mesh.scale.y = s;
                            mesh.position.y = (wallH * s) / 2;
                        }
                    }, 16);
                }, idx * 50);
            });
            
            controls.target.set(0, 0, 0);
            camera.position.set(baseW * 1.5, baseL * 1.5, baseL * 1.8);
            controls.update();
        }

        // --- TOGGLES ---
        const btn2d = document.getElementById('btn-2d');
        const btn3d = document.getElementById('btn-3d');
        const view2d = document.getElementById('view-2d');
        const view3d = document.getElementById('view-3d');

        btn2d.addEventListener('click', () => {
            btn2d.classList.add('active');
            btn3d.classList.remove('active');
            view2d.classList.add('active-layer');
            view2d.classList.remove('hidden-layer');
            view3d.classList.remove('active-layer');
            view3d.classList.add('hidden-layer');
        });

        btn3d.addEventListener('click', () => {
            btn3d.classList.add('active');
            btn2d.classList.remove('active');
            view3d.classList.add('active-layer');
            view3d.classList.remove('hidden-layer');
            view2d.classList.remove('active-layer');
            view2d.classList.add('hidden-layer');
            
            // Trigger resize just in case window resized while hidden
            window.dispatchEvent(new Event('resize'));
        });

        fetchLayouts();
    }
});
