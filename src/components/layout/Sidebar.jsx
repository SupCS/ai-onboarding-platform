'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { AI_DIGITAL_COLORS } from '../../lib/brandColors';
import ProfileDialog from '../profile/ProfileDialog';
import UserAvatar from '../ui/UserAvatar';

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 84;

const sidebarItems = [
  {
    label: 'Library',
    href: '/library',
    icon: <LibraryBooksOutlinedIcon />,
  },
  {
    label: 'My Lessons',
    href: '/lessons',
    icon: <SchoolOutlinedIcon />,
  },
  {
    label: 'My Roadmaps',
    href: '/roadmaps',
    icon: <RouteOutlinedIcon />,
  },
  {
    label: 'Team progress',
    href: '/team-progress',
    icon: <QueryStatsOutlinedIcon />,
    teamLeadOnly: true,
  },
  {
    label: 'Teams',
    href: '/teams',
    icon: <GroupsOutlinedIcon />,
  },
];

export default function Sidebar({ currentUser, currentUserPermissions = {} }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(currentUser);

  const user = profileUser || {
    name: 'User',
    email: '',
    role: 'member',
    position: '',
    avatarStorageKey: '',
  };
  const visibleSidebarItems = [
    ...sidebarItems.filter((item) => !item.teamLeadOnly || user.role === 'teamlead'),
    ...(currentUserPermissions['admin.manage_roles']
      ? [
          {
            label: 'Admin',
            href: '/admin',
            icon: <AdminPanelSettingsOutlinedIcon />,
          },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });

    router.replace('/login');
    router.refresh();
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1300,
          width: COLLAPSED_WIDTH,
          height: '100vh',
          borderRadius: 0,
          borderRight: '1px solid rgba(0, 9, 220, 0.18)',
          backgroundColor: '#fff',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflow: 'hidden',
          transition: 'width 0.25s ease',
          '&:hover': {
            width: EXPANDED_WIDTH,
            boxShadow: '0 8px 30px rgba(11, 11, 11, 0.08)',
          },
          '&:hover .sidebar-text': {
            opacity: 1,
            width: 'auto',
            transform: 'translateX(0)',
            pointerEvents: 'auto',
          },
          '&:hover .sidebar-user-details': {
            opacity: 1,
            maxWidth: '200px',
            transform: 'translateX(0)',
            pointerEvents: 'auto',
          },
          '&:hover .sidebar-logout-text': {
            opacity: 1,
            width: 'auto',
            transform: 'translateX(0)',
          },
        }}
      >
      <Box
        className="sidebar-header"
        sx={{
          px: 1.25,
          pt: 0.5,
          minHeight: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <Box
          component={Link}
          href="/"
          sx={{
            width: 40,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
            color: 'inherit',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              filter: 'drop-shadow(0 0 12px rgba(25, 118, 210, 0.6))',
            },
          }}
        >
          <Image
            src="/aidlogo.png"
            alt="AI Onboarding Logo"
            width={40}
            height={40}
            priority
            style={{ objectFit: 'contain', borderRadius: '8px' }}
          />
        </Box>

        <Box
          className="sidebar-text"
          sx={{
            ml: 1.5,
            height: 40,
            opacity: 0,
            width: 0,
            overflow: 'hidden',
            transform: 'translateX(-8px)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            AI Digital
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#80808E',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.04em',
              lineHeight: 1.2,
              mt: 0.5,
              textTransform: 'uppercase',
            }}
          >
            Learning Hub
          </Typography>
        </Box>
      </Box>

      <Divider />

      <List sx={{ p: 0 }}>
        {visibleSidebarItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Tooltip key={item.label} title={item.label} placement="right" arrow>
              <ListItemButton
                component={Link}
                href={item.href}
                sx={{
                  mb: 0.5,
                  minHeight: 48,
                  px: 1.25,
                  borderRadius: 1.25,
                  justifyContent: 'flex-start',
                  position: 'relative',
                  backgroundColor: isActive
                    ? '#F5F5FE'
                    : 'transparent',
                  color: isActive ? AI_DIGITAL_COLORS.yvesKleinBlue : '#33344A',
                  transition: 'background-color 140ms ease, color 140ms ease',
                  '&:hover': {
                    backgroundColor: isActive
                      ? '#F5F5FE'
                      : 'rgba(0, 9, 220, 0.04)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 2,
                    backgroundColor: isActive ? AI_DIGITAL_COLORS.yvesKleinBlue : 'transparent',
                    opacity: isActive ? 1 : 0,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? AI_DIGITAL_COLORS.yvesKleinBlue : '#33344A',
                    minWidth: 0,
                    width: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  className="sidebar-text"
                  sx={{
                    opacity: 0,
                    width: 0,
                    overflow: 'hidden',
                    transform: 'translateX(-8px)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    '& .MuiTypography-root': {
                      color: 'inherit',
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: 0,
                    },
                  }}
                />
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />

      <Button
        className="sidebar-user"
        onClick={() => setProfileOpen(true)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          px: 1.25,
          pt: 1,
          pb: 1,
          minHeight: 56,
          width: '100%',
          borderRadius: 1.25,
          color: 'inherit',
          textAlign: 'left',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: 'rgba(0, 9, 220, 0.04)',
          },
        }}
      >
        <Box
          sx={{
            width: 40,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <UserAvatar user={user} />
        </Box>

        <Box
          className="sidebar-user-details"
          sx={{
            ml: 1.5,
            minWidth: 0,
            maxWidth: 0,
            overflow: 'hidden',
            opacity: 0,
            transform: 'translateX(-8px)',
            transition: 'all 0.2s ease',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <Typography variant="body2" sx={{ color: '#0B0B0B', fontWeight: 700 }}>
            {user.name}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block' }}
          >
            {user.email}
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: AI_DIGITAL_COLORS.yvesKleinBlue, textTransform: 'capitalize' }}
          >
            {user.position || user.role}
          </Typography>
        </Box>
      </Button>

      <Tooltip title="Log out" placement="right" arrow>
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleLogout}
          sx={{
            mt: 1,
            borderRadius: 1.25,
            borderColor: 'rgba(0, 9, 220, 0.18)',
            minHeight: 44,
            px: 1.25,
            color: '#33344A',
            justifyContent: 'flex-start',
            textTransform: 'none',
            fontSize: 13,
            fontWeight: 600,
            '&:hover': {
              borderColor: 'rgba(0, 9, 220, 0.32)',
              backgroundColor: 'rgba(0, 9, 220, 0.04)',
            },
          }}
        >
          <Box
            sx={{
              width: 40,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'inherit',
            }}
          >
            <LogoutOutlinedIcon fontSize="small" />
          </Box>

          <Box
            className="sidebar-logout-text"
            sx={{
              opacity: 0,
              width: 0,
              overflow: 'hidden',
              transform: 'translateX(-8px)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            Sign out
          </Box>
        </Button>
      </Tooltip>
      </Paper>

      <ProfileDialog
        open={profileOpen}
        user={user}
        onClose={() => setProfileOpen(false)}
        onSaved={(updatedUser) => {
          setProfileUser(updatedUser);
          router.refresh();
        }}
      />
    </>
  );
}
