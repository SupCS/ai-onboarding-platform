import { Avatar } from '@mui/material';
import { AI_DIGITAL_COLORS } from '../../lib/brandColors';

export function getUserAvatarLetter(user = {}) {
  const source = String(user.name || user.email || 'User').trim();
  return (source[0] || 'U').toUpperCase();
}

export function getUserAvatarSrc(user = {}) {
  if (!user.avatarStorageKey) {
    return undefined;
  }

  return `/api/files/object?storageKey=${encodeURIComponent(user.avatarStorageKey)}`;
}

export default function UserAvatar({ user = {}, sx, ...props }) {
  return (
    <Avatar
      src={getUserAvatarSrc(user)}
      alt={user.name || user.email || 'User'}
      sx={{
        bgcolor: AI_DIGITAL_COLORS.yvesKleinBlue,
        color: '#fff',
        fontWeight: 800,
        ...sx,
      }}
      {...props}
    >
      {getUserAvatarLetter(user)}
    </Avatar>
  );
}
