import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

// Drinking glass (tapered, wider at top)
export const IconGlass = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M7 3h10l-2 18H9L7 3z" />
    <Path d="M9 9h6" />
  </Svg>
);

// Water bottle (cap + narrow neck + body)
export const IconBottle = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="9" y="2" width="6" height="2" rx="1" />
    <Path d="M9 4v2a4 4 0 0 0-2 3v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a4 4 0 0 0-2-3V4" />
    <Path d="M7 14h10" />
  </Svg>
);

// Coffee / tea mug with handle
export const IconMug = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 7h11v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7z" />
    <Path d="M16 9h2a2 2 0 0 1 0 4h-2" />
  </Svg>
);

// Sports / large water bottle (wider, with grip line and flip cap)
export const IconSportsBottle = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="9" y="2" width="6" height="3" rx="1" />
    <Path d="M7 5h10v15a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5z" />
    <Path d="M7 12h10" />
    <Path d="M10 9h4" />
  </Svg>
);

// Pitcher / jug with handle and spout
export const IconJug = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 4h12v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4z" />
    <Path d="M18 8h1a2 2 0 0 1 0 4h-1" />
    <Path d="M6 4Q5 2 3 2" />
  </Svg>
);

export const getContainerIcon = (type, size = 24, color = '#FFFFFF') => {
  switch (type) {
    case 'wine-outline':    return <IconGlass size={size} color={color} />;
    case 'water-outline':   return <IconBottle size={size} color={color} />;
    case 'cafe-outline':    return <IconMug size={size} color={color} />;
    case 'flask-outline':   return <IconSportsBottle size={size} color={color} />;
    case 'beer-outline':    return <IconJug size={size} color={color} />;
    // legacy mappings so old stored containers still render
    case 'bottle-outline':  return <IconBottle size={size} color={color} />;
    case 'library-outline': return <IconJug size={size} color={color} />;
    default:                return <IconGlass size={size} color={color} />;
  }
};
