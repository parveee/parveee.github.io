document.addEventListener('DOMContentLoaded', () => {
    // Check if libraries are loaded
    if (typeof gsap === 'undefined') {
        console.error('GSAP not loaded');
        return;
    }

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    /**
     * Function to initialize BlurText animation
     */
    const initBlurText = (selector, options = {}) => {
        const elements = document.querySelectorAll(selector);

        elements.forEach(el => {
            try {
                // Ensure SplitType is available
                if (typeof SplitType === 'undefined') {
                    console.error('SplitType not loaded');
                    el.style.opacity = '1'; // Fallback
                    return;
                }

                const animateBy = options.animateBy || 'words';
                const direction = options.direction || 'top';
                const delay = options.delay || 150;
                const stepDuration = options.stepDuration || 0.35;
                const threshold = options.threshold || 0.1;

                // Initial state
                const fromSnapshot = options.animationFrom || {
                    filter: 'blur(10px)',
                    opacity: 0,
                    y: direction === 'top' ? -50 : 50
                };

                // Steps
                const toSnapshots = options.animationTo || [
                    {
                        filter: 'blur(5px)',
                        opacity: 0.5,
                        y: direction === 'top' ? 5 : -5
                    },
                    { filter: 'blur(0px)', opacity: 1, y: 0 }
                ];

                // Split text
                const split = new SplitType(el, {
                    types: animateBy === 'words' ? 'words' : 'chars',
                    wordClass: 'split-word',
                    charClass: 'split-char'
                });

                const targets = animateBy === 'words' ? split.words : split.chars;

                // Animate
                gsap.fromTo(targets,
                    { ...fromSnapshot },
                    {
                        keyframes: toSnapshots,
                        duration: stepDuration * toSnapshots.length,
                        stagger: delay / 1000,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: el,
                            start: `top ${(1 - threshold) * 100}%`,
                            once: true,
                            onEnter: () => gsap.set(el, { opacity: 1 }) // Ensure parent is visible when animation starts
                        }
                    }
                );

            } catch (err) {
                console.error('Error initializing BlurText:', err);
                el.style.opacity = '1'; // Fallback to visibility
            }
        });
    };

    // Initialize animation for hero content
    // We set explicit opacity fallback just in case
    document.querySelectorAll('.hero-cnt h1, .hero-cnt p').forEach(el => el.style.opacity = '1');

    initBlurText('.hero-cnt h1', {
        animateBy: 'chars',
        direction: 'top',
        delay: 80,         // Slower letter-by-letter delay
        stepDuration: 0.6  // Slower blur transition
    });

    initBlurText('.hero-cnt p', {
        animateBy: 'words',
        direction: 'top',
        delay: 250,        // Slower word-by-word delay
        stepDuration: 0.5  // Slower blur transition
    });

    /**
     * Function to initialize ShapeGrid animation (Vanilla adaptation of React Bits ShapeGrid)
     */
    const initShapeGrid = (canvasId, options = {}) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const direction = options.direction || 'right';
        const speed = options.speed || 1;
        const borderColor = options.borderColor || '#999';
        const squareSize = options.squareSize || 40;
        const hoverFillColor = options.hoverFillColor || '#222';
        const hoverTrailAmount = options.hoverTrailAmount || 0;

        let gridOffset = { x: 0, y: 0 };
        let hoveredSquare = null;
        let trailCells = [];
        let cellOpacities = new Map();
        let requestRef;

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const drawGrid = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
            const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;

            const cols = Math.ceil(canvas.width / squareSize) + 3;
            const rows = Math.ceil(canvas.height / squareSize) + 3;

            for (let col = -2; col < cols; col++) {
                for (let row = -2; row < rows; row++) {
                    const sx = col * squareSize + offsetX;
                    const sy = row * squareSize + offsetY;

                    const cellKey = `${col},${row}`;
                    const alpha = cellOpacities.get(cellKey);
                    if (alpha) {
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = hoverFillColor;
                        ctx.fillRect(sx, sy, squareSize, squareSize);
                        ctx.globalAlpha = 1;
                    }

                    ctx.strokeStyle = borderColor;
                    ctx.beginPath();
                    ctx.rect(sx, sy, squareSize, squareSize);
                    ctx.stroke();
                }
            }

            // Radial gradient overlay to fade out edges/corners for a premium aesthetic
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        const updateAnimation = () => {
            const effectiveSpeed = Math.max(speed, 0.1);
            const wrap = squareSize;

            switch (direction) {
                case 'right': gridOffset.x = (gridOffset.x - effectiveSpeed + wrap) % wrap; break;
                case 'left': gridOffset.x = (gridOffset.x + effectiveSpeed + wrap) % wrap; break;
                case 'up': gridOffset.y = (gridOffset.y + effectiveSpeed + wrap) % wrap; break;
                case 'down': gridOffset.y = (gridOffset.y - effectiveSpeed + wrap) % wrap; break;
                case 'diagonal':
                    gridOffset.x = (gridOffset.x - effectiveSpeed + wrap) % wrap;
                    gridOffset.y = (gridOffset.y - effectiveSpeed + wrap) % wrap;
                    break;
            }

            updateCellOpacities();
            drawGrid();
            requestRef = requestAnimationFrame(updateAnimation);
        };

        const updateCellOpacities = () => {
            const targets = new Map();
            if (hoveredSquare) targets.set(`${hoveredSquare.x},${hoveredSquare.y}`, 1);
            if (hoverTrailAmount > 0) {
                for (let i = 0; i < trailCells.length; i++) {
                    const t = trailCells[i];
                    const targetOpacity = (trailCells.length - i) / (trailCells.length + 1);
                    targets.set(`${t.x},${t.y}`, targetOpacity);
                }
            }

            for (const [key] of targets) if (!cellOpacities.has(key)) cellOpacities.set(key, 0);
            for (const [key, opacity] of cellOpacities) {
                const target = targets.get(key) || 0;
                const next = opacity + (target - opacity) * 0.15;
                if (next < 0.005) cellOpacities.delete(key);
                else cellOpacities.set(key, next);
            }
        };

        const handleMouseMove = event => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
            const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
            const col = Math.floor((mouseX - offsetX) / squareSize);
            const row = Math.floor((mouseY - offsetY) / squareSize);

            if (!hoveredSquare || hoveredSquare.x !== col || hoveredSquare.y !== row) {
                if (hoveredSquare && hoverTrailAmount > 0) {
                    trailCells.unshift({ ...hoveredSquare });
                    if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
                }
                hoveredSquare = { x: col, y: row };
            }
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', () => hoveredSquare = null);
        requestRef = requestAnimationFrame(updateAnimation);
    };

    // Initialize ShapeGrid in the Hero Section
    initShapeGrid('hero-shape-grid', {
        direction: 'diagonal',
        speed: 0.5,
        squareSize: 45,
        borderColor: 'rgba(159, 193, 49, 0.1)', // Subtle theme green
        hoverFillColor: 'rgba(159, 193, 49, 0.2)', // Interactive theme green
        hoverTrailAmount: 8
    });
});
