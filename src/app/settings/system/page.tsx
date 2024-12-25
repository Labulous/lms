'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import Settings from '../page';

export default function SystemSettings() {
  return <Settings defaultTab="system" />;
}
