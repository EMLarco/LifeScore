import { Box, Text, Paper, useMantineTheme } from '@mantine/core';

export const HumanBody = ({ gender = 'other', level = 1, size = 120, showLabel = true }) => {
  const theme = useMantineTheme();
  const isDark = theme.colorScheme === 'dark';

  const getColor = (level) => {
    const hue = Math.min(level * 5, 360);
    return `hsl(${hue}, 80%, 60%)`;
  };

  const color = getColor(level);
  const strokeColor = isDark ? 'white' : '#1A1A2E';

  const getSilhouette = (gender) => {
    if (gender === 'male') {
      return `
        <svg viewBox="0 0 100 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="25" r="18" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M32 45 L68 45 L62 90 L38 90 L32 45Z" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M32 50 L15 75 L18 80 L32 60" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M68 50 L85 75 L82 80 L68 60" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M42 90 L38 135 L45 135 L48 90" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M58 90 L62 135 L55 135 L52 90" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
        </svg>
      `;
    } else if (gender === 'female') {
      return `
        <svg viewBox="0 0 100 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="25" r="16" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M35 45 L65 45 L60 90 L40 90 L35 45Z" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M35 52 L20 75 L23 80 L35 62" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M65 52 L80 75 L77 80 L65 62" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M44 90 L40 135 L47 135 L50 90" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
          <path d="M56 90 L60 135 L53 135 L50 90" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 100 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="25" r="17" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
        <path d="M34 45 L66 45 L60 90 L40 90 L34 45Z" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
        <path d="M34 52 L20 75 L23 80 L34 62" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
        <path d="M66 52 L80 75 L77 80 L66 62" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
        <path d="M43 90 L39 135 L46 135 L49 90" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
        <path d="M57 90 L61 135 L54 135 L51 90" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
      </svg>
    `;
  };

  return (
    <Paper
      radius="lg"
      p="md"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: size + 40,
      }}
    >
      <Box
        style={{
          width: size,
          height: size * 1.8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: getSilhouette(gender) }} />
      </Box>
      {showLabel && (
        <Text size="sm" fw={600} mt="xs" ta="center">
          Nivel {level}
        </Text>
      )}
      <Box
        style={{
          width: '80%',
          height: 4,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${color}, #7C3AED)`,
          marginTop: 4,
        }}
      />
    </Paper>
  );
};
