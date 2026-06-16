import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useMediaQuery } from "../utils/useMediaQuery";

// Default images
const defaultImages = [
  {
    url: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200",
    alt: "Church building"
  },
  {
    url: "https://files.catbox.moe/writqh.png",
    alt: "Worship service"
  },
  {
    url: "https://images.unsplash.com/photo-1601577670944-ef04d03cd680?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200",
    alt: "Church community gathering"
  },
  {
    url: "https://images.unsplash.com/photo-1552057426-9f23e61fa7b1?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200",
    alt: "Prayer service"
  },
  {
    url: "https://files.catbox.moe/klmxnl.jpg",
    alt: "Community outreach"
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

// Component props interface
interface SlideshowProps {
  images?: Array<{ url: string; alt: string }>;
  rotationSpeed?: number; // seconds per full rotation
  slideWidth?: number; // width in pixels
  slideHeight?: number; // height in pixels
  slideCount?: number; // number of slides to show
}

export function Slideshow({
  images = defaultImages,
  rotationSpeed = 20,
  slideWidth = 350,
  slideHeight = 400,
  slideCount = 8
}: SlideshowProps) {
  // Check if on mobile
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Adjust dimensions for mobile
  const responsiveWidth = isMobile ? 280 : slideWidth;
  const responsiveHeight = isMobile ? 320 : slideHeight;
  const responsiveCount = isMobile ? 5 : slideCount;
  
  // If provided slideCount is less than images length, trim images array
  const displayImages = images.slice(0, Math.min(responsiveCount, images.length));
  
  // Animation reference
  const carouselRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(rotation);
  
  // Make sure we have enough images
  while (displayImages.length < responsiveCount) {
    // If we don't have enough images, duplicate existing ones
    displayImages.push(...images.slice(0, Math.min(responsiveCount - displayImages.length, images.length)));
  }
  
  // Calculate the angle between each item in the carousel
  const angleIncrement = 360 / responsiveCount;
  
  // Handle animation timing
  useEffect(() => {
    let animationFrameId: number;
    let startTime: number;
    
    // Animation function
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      
      // Calculate rotation based on time and speed
      // rotationSpeed is in seconds, so convert to ms
      const degreesPerMs = 360 / (rotationSpeed * 1000);
      const newRotation = (elapsedTime * degreesPerMs) % 360;
      
      setRotation(newRotation);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [rotationSpeed]);

  return (
    <div className="w-full md:h-[600px] h-[400px] flex items-center justify-center">
      <div 
        className="relative" 
        style={{ 
          perspective: '1000px',
          width: `${responsiveWidth + 100}px`,
          height: `${responsiveHeight + 100}px`
        }}
      >
        <div 
          ref={carouselRef}
          className="absolute w-full h-full transition-transform transform-style-3d"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotation}deg)`,
            transition: 'transform 0.01s linear'
          }}
        >
          {displayImages.map((image, index) => {
            // Calculate the position for this panel
            const angle = angleIncrement * index;
            const radians = (angle * Math.PI) / 180;
            
            // Calculate radius based on slide dimensions
            const radius = (responsiveWidth / 2) / Math.tan(Math.PI / responsiveCount);
            
            return (
              <div
                key={`slide-${index}`}
                className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-lg shadow-lg"
                style={{
                  width: `${responsiveWidth}px`,
                  height: `${responsiveHeight}px`,
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: 'hidden',
                  transition: 'transform 0.5s ease-out',
                }}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover object-center object-top"
                  style={{
                    filter: 'brightness(0.9)'
                  }}
                  loading="eager"
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4"
                >
                  <p className="text-white font-medium truncate">{image.alt}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      

      
      {/* Add global CSS for 3D effects */}
      <style>{`
        .transform-style-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}
