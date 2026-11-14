/**
 * A picture of what a word means, for the sign guide's tiles whose sign has
 * no hand drawing yet (`shapeForSign` in `@souty/vocabulary`). It stands in
 * for the drawing, so the tile still says something instead of showing an
 * empty frame; it is a hint about the word, not about how the sign is made.
 *
 * A sign without an entry falls back to its category's icon.
 */
import {
  Banknote,
  BookOpen,
  CalendarDays,
  CarTaxiFront,
  ClipboardList,
  FileText,
  FileUser,
  Gavel,
  GraduationCap,
  Hand,
  HandHelping,
  Heart,
  HeartPulse,
  House,
  Landmark,
  Mail,
  MessageCircleQuestion,
  PenLine,
  PersonStanding,
  Radio,
  Sun,
  Theater,
  Tv,
  User,
  UserCheck,
  UserRound,
  Users,
  Building2,
  type LucideIcon,
} from "lucide-react";

export const MEANING_ICONS: Readonly<Record<string, LucideIcon>> = {
  // Requests
  "3aslema": Hand,
  demande: FileText,
  cv: FileUser,
  n3awnek: HandHelping,
  nekteblk: PenLine,
  t7eb: MessageCircleQuestion,
  enti: User,
  barnamjk: ClipboardList,
  ta9ra: BookOpen,
  ta3lim: GraduationCap,
  se7a: HeartPulse,
  tha9afa: Theater,
  chabeb: PersonStanding,
  radio: Radio,
  telvza: Tv,
  // Places
  baladya: Landmark,
  wzara: Building2,
  ma7kma: Gavel,
  bousta: Mail,
  banka: Banknote,
  dar: House,
  // Family
  om: Heart,
  "3ayla": Users,
  "5ou": User,
  o5t: UserRound,
  "5al-3am": UserCheck,
  // Days
  lyoum: Sun,
  thleth: CalendarDays,
  erb3a: CalendarDays,
  jom3a: CalendarDays,
  a7ad: CalendarDays,
  // Transport
  taxi: CarTaxiFront,
};
