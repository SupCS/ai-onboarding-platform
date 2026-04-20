'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Avatar,
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

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 84;

const sidebarItems = [
  {
    label: 'Library',
    href: '/library',
    icon: <LibraryBooksOutlinedIcon />,
  },
  {
    label: 'Lessons',
    href: '/lessons',
    icon: <SchoolOutlinedIcon />,
  },
  {
    label: 'Roadmaps',
    href: '/library',
    icon: <RouteOutlinedIcon />,
  },
];

export default function Sidebar({ currentUser }) {
  const pathname = usePathname();
  const router = useRouter();

  const user = currentUser || {
    name: 'User',
    email: '',
    role: 'member',
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });

    router.replace('/login');
    router.refresh();
  };

  return (
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
        borderRight: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflow: 'hidden',
        transition: 'width 0.25s ease',
        '&:hover': {
          width: EXPANDED_WIDTH,
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
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
          sx={{
            width: 40,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
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
            opacity: 0,
            width: 0,
            overflow: 'hidden',
            transform: 'translateX(-8px)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            AI Onboarding
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Training Platform
          </Typography>
        </Box>
      </Box>

      <Divider />

      <List sx={{ p: 0 }}>
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Tooltip key={item.label} title={item.label} placement="right" arrow>
              <ListItemButton
                component={Link}
                href={item.href}
                sx={{
                  mb: 0.5,
                  minHeight: 48,
                  px: 1.25,
                  borderRadius: 3,
                  justifyContent: 'flex-start',
                  backgroundColor: isActive
                    ? 'rgba(25, 118, 210, 0.08)'
                    : 'transparent',
                  color: isActive ? 'primary.main' : 'text.primary',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'primary.main' : 'text.secondary',
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
                      fontWeight: 500,
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

      <Box
        className="sidebar-user"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          px: 1.25,
          pt: 1,
          minHeight: 56,
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
          <Avatar>{user.name.charAt(0)}</Avatar>
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
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {user.name}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block' }}
          >
            {user.email}
          </Typography>

          <Typography variant="caption" color="primary.main">
            {user.role}
          </Typography>
        </Box>
      </Box>

      <Tooltip title="Log out" placement="right" arrow>
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleLogout}
          sx={{
            mt: 1,
            borderRadius: 3,
            minHeight: 44,
            px: 1.25,
            justifyContent: 'flex-start',
          }}
        >
          <Box
            sx={{
              width: 40,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'text.secondary',
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
            Log out
          </Box>
        </Button>
      </Tooltip>
    </Paper>
  );
}
