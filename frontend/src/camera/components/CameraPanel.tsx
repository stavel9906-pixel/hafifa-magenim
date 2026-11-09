import {
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { useCameraEnabled } from '../../hooks/useCameraEnabled';
import { useCameraStream } from '../../hooks/useCameraStream';
import {
  CAMERA_ASPECT_RATIO,
  CAMERA_PANEL_WIDTH,
} from '../constants/camera.constants';
import { CameraPtzControls } from './CameraPtzControls';

export function CameraPanel() {
  const enabled = useCameraEnabled();
  const [opened, setOpened] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const { stream, status } = useCameraStream(enabled && opened, attempt);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, opened]);

  if (!enabled) {
    return null;
  }

  return (
    <Paper
      shadow="md"
      pos="absolute"
      bottom={16}
      left={16}
      w={CAMERA_PANEL_WIDTH}
      maw="calc(100% - 32px)"
      style={{ zIndex: 1, overflow: 'hidden' }}
    >
      <Group justify="space-between" px="sm" py={6}>
        <Group gap="xs">
          <Text fw={600} size="sm">
            Camera
          </Text>
          {opened && status === 'live' && (
            <Badge size="xs" color="red" variant="filled">
              Live
            </Badge>
          )}
        </Group>
        <Button
          variant="subtle"
          size="compact-xs"
          onClick={() => {
            if (!opened) setAttempt((value) => value + 1);
            setOpened(!opened);
          }}
        >
          {opened ? 'Hide' : 'Show'}
        </Button>
      </Group>

      {opened && (
        <Box
          pos="relative"
          bg="dark.9"
          style={{ aspectRatio: CAMERA_ASPECT_RATIO }}
        >
          <video
            ref={videoRef}
            aria-label="Live camera feed"
            autoPlay
            muted
            playsInline
            style={{
              display: status === 'error' ? 'none' : 'block',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
          {status === 'live' && <CameraPtzControls />}
          {status === 'loading' && (
            <Center pos="absolute" inset={0}>
              <Loader size="sm" color="gray" />
            </Center>
          )}
          {status === 'error' && (
            <Center pos="absolute" inset={0}>
              <Stack align="center" gap="xs">
                <Text size="sm" c="gray.3">
                  Camera unavailable
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  Try again
                </Button>
              </Stack>
            </Center>
          )}
        </Box>
      )}
    </Paper>
  );
}
