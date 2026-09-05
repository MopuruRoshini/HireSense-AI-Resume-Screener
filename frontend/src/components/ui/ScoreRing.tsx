import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));

  // Sizes in px
  const dimensions = {
    sm: { size: 48, stroke: 4, text: 'text-xs', labelText: 'text-[9px]' },
    md: { size: 72, stroke: 6, text: 'text-base font-bold', labelText: 'text-[10px]' },
    lg: { size: 108, stroke: 8, text: 'text-2xl font-bold', labelText: 'text-xs' },
    xl: { size: 140, stroke: 10, text: 'text-3xl font-extrabold', labelText: 'text-sm' },
  }[size];

  const radius = (dimensions.size - dimensions.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Determine color scheme based on score: emerald for high (>=75), amber for medium (50-74), rose/muted for lower
  const getColor = () => {
    if (normalizedScore >= 75) {
      return {
        stroke: '#10B981',
        glow: 'rgba(16, 185, 129, 0.4)',
        textColor: 'text-emerald-400',
        bgStroke: 'rgba(16, 185, 129, 0.15)',
      };
    }
    if (normalizedScore >= 50) {
      return {
        stroke: '#F59E0B',
        glow: 'rgba(245, 158, 11, 0.4)',
        textColor: 'text-amber-400',
        bgStroke: 'rgba(245, 158, 11, 0.15)',
      };
    }
    return {
      stroke: '#EF4444',
      glow: 'rgba(239, 68, 68, 0.3)',
      textColor: 'text-rose-400',
      bgStroke: 'rgba(239, 68, 68, 0.15)',
    };
  };

  const colors = getColor();

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: dimensions.size, height: dimensions.size }}
    >
      <svg
        width={dimensions.size}
        height={dimensions.size}
        className="-rotate-90 transform transition-all duration-700 ease-out"
      >
        {/* Background track */}
        <circle
          cx={dimensions.size / 2}
          cy={dimensions.size / 2}
          r={radius}
          stroke={colors.bgStroke}
          strokeWidth={dimensions.stroke}
          fill="none"
        />
        {/* Animated score ring */}
        <circle
          cx={dimensions.size / 2}
          cy={dimensions.size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={dimensions.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{
            filter: `drop-shadow(0 0 6px ${colors.glow})`,
            transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>
      {/* Inner Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`${dimensions.text} ${colors.textColor} leading-none font-mono`}>
          {normalizedScore}%
        </span>
        {showLabel && size !== 'sm' && (
          <span className={`${dimensions.labelText} text-slate-400 uppercase tracking-wider font-semibold mt-0.5`}>
            Match
          </span>
        )}
      </div>
    </div>
  );
};
