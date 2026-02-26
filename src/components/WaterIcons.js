import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export const IconGlass = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M7 4h10l-1.5 14H8.5L7 4z" />
  </Svg>
);

export const IconBottle = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 2h6v2H9z" />
    <Path d="M9 4v1a4 4 0 0 0-1 3v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8a4 4 0 0 0-1-3V4H9z" />
  </Svg>
);

export const IconMug = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 6h10v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V6z" />
    <Path d="M15 8h2a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-2" />
  </Svg>
);

export const IconBlender = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 2h6v2H9z" />
    <Path d="M8 4l-1 16h10L16 4H8z" />
    <Path d="M7 10h10" />
    <Path d="M7 15h10" />
  </Svg>
);

export const IconJug = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H8v3h6V2z" />
    <Path d="M7 5L5 9v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9l-2-4H7z" />
    <Path d="M17 10h1v6h-1" />
  </Svg>
);

export const getContainerIcon = (type, size = 24, color = '#FFFFFF') => {
  switch (type) {
    case 'wine-outline': return <IconGlass size={size} color={color} />;
    case 'bottle-outline': return <IconBottle size={size} color={color} />;
    case 'cafe-outline': return <IconMug size={size} color={color} />;
    case 'flask-outline': return <IconBlender size={size} color={color} />;
    case 'library-outline': return <IconJug size={size} color={color} />;
    default: return <IconGlass size={size} color={color} />;
  }
};
