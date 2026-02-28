import React, { useEffect, useRef, useState } from 'react';

interface Bubble {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
}

interface AnimatedBubblesProps {
    containerWidth?: number;
    containerHeight?: number;
}

const AnimatedBubbles: React.FC<AnimatedBubblesProps> = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const bubblesRef = useRef<Bubble[]>([]);
    const [isReady, setIsReady] = useState(false);

    // Colors from the website's palette
    const colors = [
        'rgba(102, 126, 234, 0.6)',  // #667eea - purple-blue
        'rgba(118, 75, 162, 0.6)',   // #764ba2 - purple
        'rgba(240, 147, 251, 0.5)',  // #f093fb - pink
        'rgba(245, 87, 108, 0.5)',   // #f5576c - coral
        'rgba(79, 172, 254, 0.5)',   // #4facfe - light blue
        'rgba(0, 242, 254, 0.4)',    // #00f2fe - cyan
    ];

    const initBubbles = (width: number, height: number) => {
        if (width === 0 || height === 0) return;

        const bubbleCount = Math.floor((width * height) / 15000);
        const bubbles: Bubble[] = [];

        for (let i = 0; i < Math.min(Math.max(bubbleCount, 8), 20); i++) {
            bubbles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: Math.random() * 30 + 15,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        bubblesRef.current = bubbles;
    };

    useEffect(() => {
        // Small delay to ensure parent has been laid out
        const timeoutId = setTimeout(() => {
            setIsReady(true);
        }, 50);

        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        if (!isReady) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                canvas.width = rect.width;
                canvas.height = rect.height;
                if (bubblesRef.current.length === 0) {
                    initBubbles(rect.width, rect.height);
                }
            }
        };

        resizeCanvas();

        const animate = () => {
            if (!canvas || !ctx || canvas.width === 0 || canvas.height === 0) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            bubblesRef.current.forEach((bubble) => {
                // Update position
                bubble.x += bubble.vx;
                bubble.y += bubble.vy;

                // Bounce off walls
                if (bubble.x - bubble.radius <= 0 || bubble.x + bubble.radius >= canvas.width) {
                    bubble.vx *= -1;
                    bubble.x = Math.max(bubble.radius, Math.min(canvas.width - bubble.radius, bubble.x));
                }
                if (bubble.y - bubble.radius <= 0 || bubble.y + bubble.radius >= canvas.height) {
                    bubble.vy *= -1;
                    bubble.y = Math.max(bubble.radius, Math.min(canvas.height - bubble.radius, bubble.y));
                }

                // Draw bubble with gradient
                const gradient = ctx.createRadialGradient(
                    bubble.x - bubble.radius * 0.3,
                    bubble.y - bubble.radius * 0.3,
                    0,
                    bubble.x,
                    bubble.y,
                    bubble.radius
                );
                gradient.addColorStop(0, bubble.color.replace('0.', '0.8'));
                gradient.addColorStop(0.5, bubble.color);
                gradient.addColorStop(1, bubble.color.replace('0.', '0.2'));

                ctx.beginPath();
                ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Add subtle glow
                ctx.shadowBlur = 20;
                ctx.shadowColor = bubble.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(container);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            resizeObserver.disconnect();
        };
    }, [isReady]);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none w-full h-full"
                style={{ filter: 'blur(2px)' }}
            />
        </div>
    );
};

export default AnimatedBubbles;
