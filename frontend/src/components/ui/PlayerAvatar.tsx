interface PlayerAvatarProps {
  avatar: string;
  color: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rank?: number;
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-base',
  md: 'w-12 h-12 text-xl',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-20 h-20 text-3xl',
};

export default function PlayerAvatar({ avatar, color, name, size = 'md', rank, className = '' }: PlayerAvatarProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${sizeMap[size]} rounded-full ${className}`}
      style={{ 
        background: `radial-gradient(circle at 35% 35%, ${color}33, ${color}11)`,
        border: `2px solid ${color}44`,
        boxShadow: `0 0 15px ${color}22`,
      }}>
      <span role="img" aria-label={name}>{avatar}</span>
      {rank !== undefined && (
        <span className={`rank-badge rank-${rank} absolute -bottom-1 -right-1 w-5 h-5 text-[10px]`}>
          {rank}
        </span>
      )}
    </div>
  );
}
