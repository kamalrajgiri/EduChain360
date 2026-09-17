export default function Avatar({ user, size = 'md', className = '' }) {
  const initials = user?.full_name?.split(' ').map((s) => s[0]).slice(0, 2).join('') || 'U';
  const sizeMap = {
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
    xl: 'h-24 w-24 text-2xl'
  };
  const cls = sizeMap[size] || sizeMap.md;

  if (user?.avatar_data) {
    return (
      <img
        src={user.avatar_data}
        alt={user.full_name}
        className={`${cls} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }
  return (
    <div className={`${cls} rounded-full bg-primary text-text-inverse grid place-items-center
                     font-bold shrink-0 ${className}`}>
      {initials}
    </div>
  );
}