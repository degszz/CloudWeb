'use client';

import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CaretDown,
  Clock,
  Coffee,
  Envelope,
  Eye,
  Globe,
  Heart,
  House,
  ImageSquare,
  List,
  MagnifyingGlass,
  MapPin,
  Minus,
  PaperPlaneTilt,
  Phone,
  Plus,
  Sparkle,
  Storefront,
  User,
  WifiHigh,
  X,
  type Icon as PhosphorIcon,
  type IconProps,
} from '@phosphor-icons/react';

/**
 * Wrapper único de iconos del proyecto.
 *
 * Razón: minimalist_ui.md §2 prohíbe Lucide. Centralizar imports en
 * este archivo hace imposible importar Lucide sin que se note.
 *
 * Uso:
 *   import { Icon } from '@/components/ui/icon';
 *   <Icon name="coffee" weight="bold" size={20} />
 */

export const ICON_MAP = {
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  calendar: Calendar,
  check: Check,
  'chevron-down': CaretDown,
  clock: Clock,
  coffee: Coffee,
  envelope: Envelope,
  eye: Eye,
  globe: Globe,
  heart: Heart,
  house: House,
  image: ImageSquare,
  list: List,
  search: MagnifyingGlass,
  'map-pin': MapPin,
  minus: Minus,
  'paper-plane': PaperPlaneTilt,
  phone: Phone,
  plus: Plus,
  sparkle: Sparkle,
  storefront: Storefront,
  user: User,
  wifi: WifiHigh,
  x: X,
} as const satisfies Record<string, PhosphorIcon>;

export type { IconName } from '@/components/ui/icon-names';
import type { IconName } from '@/components/ui/icon-names';

interface IconComponentProps extends Omit<IconProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, weight = 'bold', size = 20, ...rest }: IconComponentProps) {
  const Component = ICON_MAP[name];
  return <Component weight={weight} size={size} {...rest} />;
}
