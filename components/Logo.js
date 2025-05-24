'use client';

import React from 'react';
import LogoFallback from '../app/components/LogoFallback';

export default function Logo({ width = 200, height = 200, className = "" }) {
  return (
    <LogoFallback width={width} height={height} className={className} />
  );
} 