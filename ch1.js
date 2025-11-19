let scene, camera, renderer, particles;
const count = 12000;
let currentState = 'sphere';
let currentScheme = 'cosmic';
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.getElementById('container').appendChild(renderer.domElement);

    camera.position.z = 25;

    createParticles();
    setupEventListeners();
    setupDrag();
    setupColorControls();
    setupMorphControls();
    setupChat();
    animate();
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        
        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi)
        };
    }

    for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);
        
        positions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

        const color = new THREE.Color();
        const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
        color.setHSL(0.5 + depth * 0.2, 0.7, 0.4 + depth * 0.3);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    if (particles) scene.remove(particles);
    particles = new THREE.Points(geometry, material);
    particles.rotation.x = 0;
    particles.rotation.y = 0;
    particles.rotation.z = 0;
    scene.add(particles);
}

function setupEventListeners() {
    const typeBtn = document.getElementById('typeBtn');
    const input = document.getElementById('morphText');

    typeBtn.addEventListener('click', () => {
        const text = input.value.trim();
        if (text) {
            morphToText(text);
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const text = input.value.trim();
            if (text) {
                morphToText(text);
            }
        }
    });
}

function createTextPoints(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 100;
    const padding = 20;

    ctx.font = `bold ${fontSize}px Arial`;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const points = [];
    const threshold = 128;

    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > threshold) {
            const x = (i / 4) % canvas.width;
            const y = Math.floor((i / 4) / canvas.width);
            
                if (Math.random() < 0.3) {
                points.push({
                    x: (x - canvas.width / 2) / (fontSize / 10),
                    y: -(y - canvas.height / 2) / (fontSize / 10)
                });
            }
        }
    }

    return points;
}

function morphToText(text) {
    currentState = 'text';
    const textPoints = createTextPoints(text);
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(count * 3);

    gsap.to(particles.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5
    });

    for (let i = 0; i < count; i++) {
        if (i < textPoints.length) {
            targetPositions[i * 3] = textPoints[i].x;
            targetPositions[i * 3 + 1] = textPoints[i].y;
            targetPositions[i * 3 + 2] = 0;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 20 + 10;
            targetPositions[i * 3] = Math.cos(angle) * radius;
            targetPositions[i * 3 + 1] = Math.sin(angle) * radius;
            targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
    }

    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(particles.geometry.attributes.position.array, {
            [i]: targetPositions[i],
            [i + 1]: targetPositions[i + 1],
            [i + 2]: targetPositions[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    setTimeout(() => {
        morphToCircle();
    }, 4000);
}

function morphToCircle() {
    currentState = 'sphere';
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(count * 3);
    const colors = particles.geometry.attributes.color.array;

    function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;

        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi)
        };
    }

    for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);

        targetPositions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

        const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
        const color = new THREE.Color();
        color.setHSL(0.5 + depth * 0.2, 0.7, 0.4 + depth * 0.3);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(particles.geometry.attributes.position.array, {
            [i]: targetPositions[i],
            [i + 1]: targetPositions[i + 1],
            [i + 2]: targetPositions[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    for (let i = 0; i < colors.length; i += 3) {
        gsap.to(particles.geometry.attributes.color.array, {
            [i]: colors[i],
            [i + 1]: colors[i + 1],
            [i + 2]: colors[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.color.needsUpdate = true;
            }
        });
    }
}

function setupDrag() {
    const inputContainer = document.querySelector('.input-container');

    inputContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragOffset.x = e.clientX - inputContainer.offsetLeft;
        dragOffset.y = e.clientY - inputContainer.offsetTop;
        inputContainer.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            inputContainer.style.left = newX + 'px';
            inputContainer.style.top = newY + 'px';
            inputContainer.style.transform = 'none';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        inputContainer.style.cursor = 'grab';
    });
}

function setupColorControls() {
    const buttons = document.querySelectorAll('.color-scheme button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentScheme = button.dataset.scheme;
            updateColors();
        });
    });
}

function updateColors() {
    const colors = particles.geometry.attributes.color.array;
    const schemes = {
        cosmic: (depth) => new THREE.Color().setHSL(0.5 + depth * 0.2, 0.7, 0.4 + depth * 0.3),
        neon: (depth) => new THREE.Color().setHSL(0.3 + depth * 0.1, 0.8, 0.5 + depth * 0.4),
        sunset: (depth) => new THREE.Color().setHSL(0.05 + depth * 0.1, 0.9, 0.4 + depth * 0.3),
        ocean: (depth) => new THREE.Color().setHSL(0.6 + depth * 0.1, 0.7, 0.3 + depth * 0.4)
    };

    for (let i = 0; i < count; i++) {
        const x = particles.geometry.attributes.position.array[i * 3];
        const y = particles.geometry.attributes.position.array[i * 3 + 1];
        const z = particles.geometry.attributes.position.array[i * 3 + 2];
        const depth = Math.sqrt(x * x + y * y + z * z) / 8;
        const color = schemes[currentScheme](depth);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    particles.geometry.attributes.color.needsUpdate = true;
}

function setupMorphControls() {
    const sphereBtn = document.getElementById('sphereBtn');
    const cubeBtn = document.getElementById('cubeBtn');
    const torusBtn = document.getElementById('torusBtn');

    sphereBtn.addEventListener('click', () => {
        morphToSphere();
        setActiveButton(sphereBtn);
    });

    cubeBtn.addEventListener('click', () => {
        morphToCube();
        setActiveButton(cubeBtn);
    });

    torusBtn.addEventListener('click', () => {
        morphToTorus();
        setActiveButton(torusBtn);
    });
}

function setActiveButton(activeBtn) {
    document.querySelectorAll('.controls button').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

function morphToSphere() {
    currentState = 'sphere';
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(count * 3);

    function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;

        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi)
        };
    }

    for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);
        targetPositions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;
    }

    animateMorph(targetPositions);
}

function morphToCube() {
    currentState = 'cube';
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const face = Math.floor(Math.random() * 6);
        let x, y, z;
        switch (face) {
            case 0: x = (Math.random() - 0.5) * 16; y = (Math.random() - 0.5) * 16; z = 8; break;
            case 1: x = (Math.random() - 0.5) * 16; y = (Math.random() - 0.5) * 16; z = -8; break;
            case 2: x = 8; y = (Math.random() - 0.5) * 16; z = (Math.random() - 0.5) * 16; break;
            case 3: x = -8; y = (Math.random() - 0.5) * 16; z = (Math.random() - 0.5) * 16; break;
            case 4: x = (Math.random() - 0.5) * 16; y = 8; z = (Math.random() - 0.5) * 16; break;
            case 5: x = (Math.random() - 0.5) * 16; y = -8; z = (Math.random() - 0.5) * 16; break;
        }
        targetPositions[i * 3] = x;
        targetPositions[i * 3 + 1] = y;
        targetPositions[i * 3 + 2] = z;
    }

    animateMorph(targetPositions);
}

function morphToTorus() {
    currentState = 'torus';
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        const R = 6;
        const r = 3;
        const x = (R + r * Math.cos(v)) * Math.cos(u);
        const y = (R + r * Math.cos(v)) * Math.sin(u);
        const z = r * Math.sin(v);
        targetPositions[i * 3] = x;
        targetPositions[i * 3 + 1] = y;
        targetPositions[i * 3 + 2] = z;
    }

    animateMorph(targetPositions);
}

function animateMorph(targetPositions) {
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(particles.geometry.attributes.position.array, {
            [i]: targetPositions[i],
            [i + 1]: targetPositions[i + 1],
            [i + 2]: targetPositions[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }
}

function setupChat() {
    const chatBtn = document.getElementById('chatBtn');
    const chatInput = document.getElementById('chatInput');

    chatBtn.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
            addMessage('You: ' + message);
            getAIResponse(message);
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value.trim();
            if (message) {
                addMessage('You: ' + message);
                getAIResponse(message);
                chatInput.value = '';
            }
        }
    });
}

function addMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function getAIResponse(message) {
    addMessage('AI: Thinking...');
    try {
        const API_KEY = 'YOUR_OPENAI_API_KEY_HERE'; // Replace with your actual API key
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: message }],
                max_tokens: 150
            })
        });
        const data = await response.json();
        const aiMessage = data.choices[0].message.content;
        chatMessages.lastChild.textContent = 'AI: ' + aiMessage;
    } catch (error) {
        chatMessages.lastChild.textContent = 'AI: Sorry, I couldn\'t process your request.';
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (currentState === 'sphere') {
        particles.rotation.y += 0.002;
    }
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
