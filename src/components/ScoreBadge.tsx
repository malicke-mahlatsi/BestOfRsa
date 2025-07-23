import React from 'react';
import { motion } from 'framer-motion';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, size = 'md', showLabel = false }) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-gradient-to-br from-green-400 to-green-600';
    if (score >= 6) return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
    return 'bg-gradient-to-br from-red-400 to-red-600';
  };

  const getScoreText = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    return 'Fair';
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`${getScoreColor(score)} text-white rounded-full ${sizeClasses[size]} 
                   flex items-center justify-center font-bold shadow-lg border-2 border-white/20`}
        title={`Score: ${score}/10 - ${getScoreText(score)}`}
      >
        {score.toFixed(1)}
      </motion.div>
      {showLabel && (
        <span className={`text-sm font-medium ${
          score >= 8 ? 'text-green-600' : score >= 6 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {getScoreText(score)}
        </span>
      )}
    </div>
  );
};

export default ScoreBadge;