import React from 'react'
import { Heart } from 'lucide-react'

export interface HeartParticle {
  id: number
  x: number
  size: number
  duration: number
}

interface FloatingHeartsProps {
  hearts: HeartParticle[]
}

export const FloatingHearts: React.FC<FloatingHeartsProps> = ({ hearts }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {hearts.map((h) => (
        <div
          key={h.id}
          className="absolute bottom-0 text-[#ec4899] opacity-90 transition-all"
          style={{
            left: `${h.x}%`,
            animation: `floatUp ${h.duration}s ease-out forwards`,
          }}
        >
          <Heart
            className="fill-[#ec4899] text-[#ec4899] drop-shadow-sm"
            style={{ width: `${h.size}px`, height: `${h.size}px` }}
          />
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.7) rotate(0deg);
            opacity: 0.9;
          }
          50% {
            transform: translateY(-50vh) scale(1.1) rotate(10deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-105vh) scale(0.9) rotate(-10deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
