import * as THREE from 'three';
import { gsap } from 'gsap';

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: THREE.Points | null = null;
  private count: number = 12000;
  private currentState: 'sphere' | 'text' = 'sphere';
  private isAnimating: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  initialize() {
    this.createParticles();
  }

  private createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      const point = this.sphericalDistribution(i);
      
      positions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

      const color = new THREE.Color();
      const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
      color.setHSL(0.55 + depth * 0.15, 0.8, 0.5 + depth * 0.2);

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
      opacity: 0.9,
      sizeAttenuation: true
    });

    if (this.particles) this.scene.remove(this.particles);
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private sphericalDistribution(i: number) {
    const phi = Math.acos(-1 + (2 * i) / this.count);
    const theta = Math.sqrt(this.count * Math.PI) * phi;
    
    return {
      x: 8 * Math.cos(theta) * Math.sin(phi),
      y: 8 * Math.sin(theta) * Math.sin(phi),
      z: 8 * Math.cos(phi)
    };
  }

  private createTextPoints(text: string) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

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
    const points: { x: number; y: number }[] = [];
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

  morphToText(text: string) {
    if (!this.particles || this.isAnimating) return;
    
    this.isAnimating = true;
    this.currentState = 'text';
    const textPoints = this.createTextPoints(text);
    const positions = this.particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(this.count * 3);

    gsap.to(this.particles.rotation, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.5
    });

    for (let i = 0; i < this.count; i++) {
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
      gsap.to(this.particles.geometry.attributes.position.array, {
        [i]: targetPositions[i],
        [i + 1]: targetPositions[i + 1],
        [i + 2]: targetPositions[i + 2],
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          if (this.particles) {
            this.particles.geometry.attributes.position.needsUpdate = true;
          }
        }
      });
    }

    setTimeout(() => {
      this.morphToSphere();
    }, 4000);
  }

  private morphToSphere() {
    if (!this.particles) return;

    this.currentState = 'sphere';
    const positions = this.particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(this.count * 3);
    const colors = this.particles.geometry.attributes.color.array;

    for (let i = 0; i < this.count; i++) {
      const point = this.sphericalDistribution(i);
      
      targetPositions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
      targetPositions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
      targetPositions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

      const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
      const color = new THREE.Color();
      color.setHSL(0.55 + depth * 0.15, 0.8, 0.5 + depth * 0.2);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    for (let i = 0; i < positions.length; i += 3) {
      gsap.to(this.particles.geometry.attributes.position.array, {
        [i]: targetPositions[i],
        [i + 1]: targetPositions[i + 1],
        [i + 2]: targetPositions[i + 2],
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          if (this.particles) {
            this.particles.geometry.attributes.position.needsUpdate = true;
          }
        },
        onComplete: () => {
          this.isAnimating = false;
        }
      });
    }

    for (let i = 0; i < colors.length; i += 3) {
      gsap.to(this.particles.geometry.attributes.color.array, {
        [i]: colors[i],
        [i + 1]: colors[i + 1],
        [i + 2]: colors[i + 2],
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          if (this.particles) {
            this.particles.geometry.attributes.color.needsUpdate = true;
          }
        }
      });
    }
  }

  update() {
    if (this.particles && this.currentState === 'sphere' && !this.isAnimating) {
      this.particles.rotation.y += 0.002;
    }
  }

  getParticles() {
    return this.particles;
  }
}
