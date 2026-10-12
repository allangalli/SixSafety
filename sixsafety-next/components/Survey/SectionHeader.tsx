"use client";

import { Shield, Home, Users, Lock } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon?: 'shield' | 'home' | 'users' | 'lock';
}

/**
 * Section header with icon to separate conversation stages
 * Examples: "Enhancing Safety and Security", "Security Enhancements Preferences"
 */
export function SectionHeader({ title, icon = 'shield' }: SectionHeaderProps) {
  const IconComponent = {
    shield: Shield,
    home: Home,
    users: Users,
    lock: Lock,
  }[icon];

  return (
    <div className="flex items-center gap-3 my-6">
      <div className="bg-brand-orange rounded-full p-2">
        <IconComponent className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      <div className="flex-1 h-0.5 bg-gradient-to-r from-brand-orange to-transparent ml-4" />
    </div>
  );
}
