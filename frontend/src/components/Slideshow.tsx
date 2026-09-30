import { useEffect, useRef, useState } from "react";
import { mountPhotoTorus } from "../utils/photoTorus";

// Default images
const defaultImages = [
  {
    url: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200",
    alt: "Church building"
  },
  {
    url: "/images/worship-service.jpg",
    alt: "Worship service"
  },
  {
    url: "https://images.unsplash.com/photo-1552057426-9f23e61fa7b1?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200",
    alt: "Prayer service"
  },
  {
    url: "/images/community-outreach.jpg",
    alt: "Community outreach at Global Empowerment Mission"
  },
  {
    url: "https://images.unsplash.com/photo-1478147427282-58a87a120781?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200",
    alt: "Worship community"
  },
  {
    url: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200",
    alt: "Sabbath service"
  },
  {
    url: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200",
    alt: "Bible study"
  }
];

interface SlideshowProps {
  images?: Array<{ url: string; alt: string }>;
  rotationSpeed?: number; // seconds per full rotation
}

/** Home page photo torus: smooth WebGL version, or tiled CSS 3D where WebGL is unavailable. */
export function Slideshow({ images = defaultImages, rotationSpeed = 40 }: SlideshowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanup = mountPhotoTorus(canvasRef.current, images, rotationSpeed);
    if (!cleanup) setWebgl(false);
    return cleanup ?? undefined;
  }, [images, rotationSpeed]);

  if (!webgl) return <CssTorus images={images} rotationSpeed={rotationSpeed} />;
  return (
    <div
      className="w-full md:h-[600px] h-[400px]"
      role="img"
      aria-label={`Rotating photos: ${images.map((i) => i.alt).join(", ")}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

// Fallback: the torus built from flat CSS 3D tiles. The ring spins around its
// vertical axis; each photo wraps the outer half of the tube over one sector.
const RING_RADIUS = 265; // center of the ring to the center of the tube
const TUBE_RADIUS = 110;
const SLICES_PER_PHOTO = 3; // columns per photo, so the ring looks round
const TUBE_SEGMENTS = 12; // rows around the tube; the outer half shows the photo
const TILT_DEG = -24; // tip the top toward the viewer so it reads as a donut

function CssTorus({ images, rotationSpeed }: Required<SlideshowProps>) {
  const columns = images.length * SLICES_PER_PHOTO;
  const rowHeight = (2 * Math.PI * TUBE_RADIUS) / TUBE_SEGMENTS;
  const photoRows = TUBE_SEGMENTS / 2;

  const tiles = [];
  for (let row = 0; row < TUBE_SEGMENTS; row++) {
    // Row 0 sits on top of the tube; rows run over the outside, then back through the hole.
    const stepDeg = 360 / TUBE_SEGMENTS;
    const tubeDeg = 90 - (row + 0.5) * stepDeg;
    const tubeRad = (tubeDeg * Math.PI) / 180;
    // Tiles are wider on the outside of the ring than on the inside. Size each
    // row to its wider edge so neighbours overlap instead of leaving wedges.
    const widestCos = Math.max(
      Math.cos(((tubeDeg + stepDeg / 2) * Math.PI) / 180),
      Math.cos(((tubeDeg - stepDeg / 2) * Math.PI) / 180),
    );
    const width = (2 * Math.PI * (RING_RADIUS + TUBE_RADIUS * widestCos)) / columns;
    const inner = row >= photoRows;
    // Fake lighting: darker toward the bottom and inside the hole.
    const shade = inner ? 0.6 : 0.3 * Math.max(0, -Math.sin(tubeRad)) + 0.05;
    const photoRow = row % photoRows;

    for (let col = 0; col < columns; col++) {
      const image = images[Math.floor(col / SLICES_PER_PHOTO)];
      const slice = col % SLICES_PER_PHOTO;
      tiles.push(
        <div
          key={`${row}-${col}`}
          className="torus-tile"
          style={{
            width: width + 2, // slight overlap hides seams
            height: rowHeight + 2,
            marginLeft: -width / 2,
            marginTop: -rowHeight / 2,
            transform: `rotateY(${(col + 0.5) * (360 / columns)}deg) translateZ(${RING_RADIUS}px) rotateX(${tubeDeg}deg) translateZ(${TUBE_RADIUS}px)`,
            backgroundImage: `linear-gradient(rgba(0,0,0,${shade}), rgba(0,0,0,${shade})), url("${image.url}")`,
            backgroundSize: `100% 100%, ${width * SLICES_PER_PHOTO}px ${rowHeight * photoRows}px`,
            backgroundPosition: `0 0, ${-slice * width}px ${-photoRow * rowHeight}px`,
          }}
        />,
      );
    }
  }

  return (
    <div
      className="w-full md:h-[600px] h-[400px] flex items-center justify-center overflow-hidden"
      role="img"
      aria-label={`Rotating photos: ${images.map((i) => i.alt).join(", ")}`}
    >
      <div className="torus-scale">
        <div className="torus-stage">
          <div className="torus-tilt">
            <div className="torus-spin" style={{ animationDuration: `${rotationSpeed}s` }}>
              {tiles}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .torus-scale { transform: scale(0.45); }
        @media (min-width: 768px) { .torus-scale { transform: scale(0.8); } }
        @media (min-width: 1024px) { .torus-scale { transform: scale(1); } }
        .torus-stage {
          width: ${2 * (RING_RADIUS + TUBE_RADIUS)}px;
          height: ${2 * (RING_RADIUS + TUBE_RADIUS)}px;
          perspective: 1400px;
        }
        .torus-tilt, .torus-spin {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }
        .torus-tilt { transform: rotateX(${TILT_DEG}deg); }
        .torus-spin { animation: torus-spin linear infinite; }
        .torus-spin:hover { animation-play-state: paused; }
        .torus-tile {
          position: absolute;
          left: 50%;
          top: 50%;
          backface-visibility: hidden;
          background-repeat: no-repeat;
          background-color: #27272a; /* keeps the ring solid if a photo fails to load */
        }
        @keyframes torus-spin { to { transform: rotateY(-360deg); } }
        @media (prefers-reduced-motion: reduce) { .torus-spin { animation: none; } }
      `}</style>
    </div>
  );
}
