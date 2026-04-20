/**
 * Complete color scheme configuration for maze rendering and visualization.
 * Defines colors for all maze elements including structure, navigation, pathfinding, and UI.
 * All colors should be valid CSS color strings (hex, rgb, oklch, etc.).
 *
 * @group Geometry
 * @category Color
 */
export type MazeColors = {
  /** Basic cell/floor color for walkable areas */
  cell: string;
  /** Wall color for maze barriers */
  wall: string;
  /** Void/background color for empty space outside the maze */
  void: string;
  /** Tunnel color for special passage connections */
  tunnel: string;
  /** Bridge color for multi-level connections */
  bridge: string;
  /** Entrance point marker color */
  entrance: string;
  /** Exit point marker color */
  exit: string;
  /** Avatar/player position marker color */
  avatar: string;
  /** Solution path color showing the correct route */
  solution: string;
  /** General path color for navigation traces */
  path: string;
  /** Scanned cell color for algorithm visualization */
  scanned: string;
  /** Pruned cell color for backtracking visualization */
  pruned: string;
  /** Blocked cell color for inaccessible areas */
  blocked: string;
  /** Error color for highlighting problems or invalid states */
  error: string;
  /** Text color for labels, coordinates, and annotations */
  text: string;
};

/**
 * Default color scheme using OKLCH color space for consistent perceptual appearance.
 * OKLCH provides better color consistency across different displays and lighting conditions
 * compared to traditional RGB/HSL color spaces.
 *
 * Color scheme design principles:
 * - High contrast between walls and cells for clear maze structure
 * - Distinct colors for entrance (green) and exit (orange) for easy identification
 * - Muted colors for algorithm visualization to avoid overwhelming the main maze
 * - Bright colors for important elements like solution paths and errors
 *
 * @group Geometry
 * @category Color
 */
export const defaultColors: NonNullable<MazeColors> = {
  /** Pure black - provides maximum contrast against walls */
  cell: 'oklch(0 0 0)',
  /** Light gray - clearly visible walls without being harsh */
  wall: 'oklch(0.80 0 0)',
  /** Dark gray - subtle background that doesn't compete with maze */
  void: 'oklch(0.33 0 0)',
  /** Light blue - distinctive color for special tunnel connections */
  tunnel: 'oklch(0.96 0.064 196)',
  /** Muted blue-purple - distinguishable from tunnels, indicates elevation */
  bridge: 'oklch(0.44 0.025 240)',
  /** Bright green - universally recognized as entrance/start color */
  entrance: 'oklch(0.62 0.21 142)',
  /** Bright orange - complementary to entrance, indicates goal/finish */
  exit: 'oklch(0.62 0.26 29)',
  /** Medium blue - calming color for player representation */
  avatar: 'oklch(0.66 0.11 213)',
  /** Bright green-yellow - highly visible solution path */
  solution: 'oklch(0.70 0.18 144)',
  /** Bright yellow - attention-grabbing for navigation traces */
  path: 'oklch(0.81 0.17 83)',
  /** Magenta-purple - distinct color for algorithm visualization */
  scanned: 'oklch(0.52 0.22 330)',
  /** Dark red - indicates backtracking or pruned branches */
  pruned: 'oklch(0.44 0.18 359)',
  /** Orange-red - warning color for blocked or inaccessible areas */
  blocked: 'oklch(0.63 0.21 27)',
  /** Dark red - clearly indicates errors or invalid states */
  error: 'oklch(0.48 0.17 28)',
  /** Pure white - maximum readability for text overlays */
  text: 'oklch(1 0 0)',
};
