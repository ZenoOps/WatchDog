import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { type Href, usePathname, useRouter } from 'expo-router';
import { type ComponentProps, type ReactNode, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
  View,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth-context';

import { watchdogColors as colors, watchdogRadii as radii } from './theme';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

const icons = {
  overview: { ios: 'rectangle.grid.2x2.fill', android: 'dashboard', web: 'dashboard' },
  services: { ios: 'server.rack', android: 'dns', web: 'dns' },
  logs: { ios: 'text.alignleft', android: 'article', web: 'article' },
  traces: { ios: 'point.3.connected.trianglepath.dotted', android: 'timeline', web: 'timeline' },
  alerts: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  tune: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  bolt: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
} satisfies Record<string, SymbolName>;

const tabItems: { label: string; href: string; icon: SymbolName }[] = [
  { label: 'Overview', href: '/overview', icon: icons.overview },
  { label: 'Services', href: '/services', icon: icons.services },
  { label: 'Logs', href: '/logs', icon: icons.logs },
  { label: 'Traces', href: '/traces', icon: icons.traces },
  { label: 'Alerts', href: '/alerts', icon: icons.alerts },
];

export function WatchDogIcon({
  name,
  color = colors.textMuted,
  size = 20,
}: {
  name: SymbolName;
  color?: string;
  size?: number;
}) {
  return (
    <SymbolView
      name={name}
      tintColor={color}
      size={size}
      fallback={<Text style={{ color, fontSize: size * 0.72 }}>•</Text>}
    />
  );
}

function BrandMark() {
  return (
    <View style={styles.brandMark}>
      <View style={styles.brandEyes}>
        <View style={styles.brandEye} />
        <View style={styles.brandEye} />
      </View>
      <View style={styles.brandSmile} />
    </View>
  );
}

function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabItems.map((item) => {
        const target = String(item.href);
        const active = pathname === target;
        return (
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={item.label}
            onPress={() => router.replace(item.href as Href)}
            style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
            <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
              <WatchDogIcon
                name={item.icon}
                color={active ? colors.primary : colors.textMuted}
                size={20}
              />
            </View>
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AppText({
  variant = 'body',
  muted,
  style,
  ...props
}: TextProps & {
  variant?: 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'mono';
  muted?: boolean;
}) {
  return (
    <Text
      {...props}
      style={[
        styles.text,
        styles[`text_${variant}`],
        muted && styles.textMuted,
        style,
      ]}
    />
  );
}

export function WatchDogScreen({
  title,
  subtitle,
  children,
  backLabel,
  onBack,
  showTabs = true,
  showTimeControls = true,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  backLabel?: string;
  onBack?: () => void;
  showTabs?: boolean;
  showTimeControls?: boolean;
}) {
  const { signOut, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [timeRange, setTimeRange] = useState<'30m' | '1h' | '6h'>('30m');
  const ranges: Record<typeof timeRange, string> = {
    '30m': 'Last 30 minutes',
    '1h': 'Last hour',
    '6h': 'Last 6 hours',
  };

  const cycleTimeRange = () => {
    setTimeRange((current) => (current === '30m' ? '1h' : current === '1h' ? '6h' : '30m'));
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.brandRow}>
        <View style={styles.brandGroup}>
          <BrandMark />
          <AppText variant="heading">WatchDog</AppText>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.environmentChip}>
            <View style={styles.environmentDot} />
            <AppText variant="caption" style={styles.environmentText}>
              Production
            </AppText>
          </View>
          <Pressable
            accessibilityLabel={`Sign out ${user?.email ?? 'of WatchDog'}`}
            accessibilityRole="button"
            disabled={signingOut}
            onPress={() => void handleSignOut()}
            style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}>
            <AppText variant="caption" style={styles.signOutText}>
              {signingOut ? 'Wait…' : 'Sign out'}
            </AppText>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.contentWidth}>
          {backLabel && onBack ? (
            <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <WatchDogIcon name={icons.back} color={colors.primary} size={17} />
              <AppText variant="label" style={styles.backLabel}>
                {backLabel}
              </AppText>
            </Pressable>
          ) : null}

          <View style={styles.titleBlock}>
            <AppText variant="display">{title}</AppText>
            <AppText muted variant="caption">
              {subtitle}
            </AppText>
          </View>

          {showTimeControls ? (
            <View style={styles.timeControls}>
              <Pressable onPress={cycleTimeRange} style={({ pressed }) => [styles.timeChip, pressed && styles.pressed]}>
                <WatchDogIcon name={icons.clock} size={15} />
                <AppText variant="caption">{ranges[timeRange]}</AppText>
              </Pressable>
              <Pressable accessibilityLabel="Refresh mock data" style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <WatchDogIcon name={icons.refresh} size={17} />
              </Pressable>
              <View style={styles.liveChip}>
                <View style={styles.liveDot} />
                <AppText variant="label" style={styles.liveText}>
                  Live
                </AppText>
              </View>
            </View>
          ) : null}

          <View style={styles.screenBody}>{children}</View>
        </View>
      </ScrollView>
      {showTabs ? <BottomNavigation /> : null}
    </SafeAreaView>
  );
}

export function Card({ style, children, ...props }: ViewProps & { style?: ViewStyle | ViewStyle[] }) {
  return (
    <View {...props} style={[styles.card, style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <AppText variant="heading">{title}</AppText>
      {action}
    </View>
  );
}

export function SearchInput({
  value,
  onChangeText,
  placeholder,
  containerStyle,
  ...props
}: TextInputProps & { containerStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.searchWrap, containerStyle]}>
      <WatchDogIcon name={icons.search} size={18} />
      <TextInput
        {...props}
        autoCapitalize="none"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        selectionColor={colors.primary}
        showSoftInputOnFocus
        style={styles.searchInput}
        value={value}
      />
    </View>
  );
}

export function PillButton({
  label,
  onPress,
  primary,
  icon,
}: {
  label: string;
  onPress?: () => void;
  primary?: boolean;
  icon?: SymbolName;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pillButton,
        primary && styles.pillButtonPrimary,
        pressed && styles.pressed,
      ]}>
      {icon ? <WatchDogIcon name={icon} color={primary ? colors.background : colors.textMuted} size={15} /> : null}
      <AppText variant="label" style={primary ? styles.pillButtonPrimaryText : undefined}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  delta: string;
  tone?: 'neutral' | 'good' | 'bad';
}) {
  return (
    <Card style={styles.metricCard}>
      <AppText muted variant="caption">
        {label}
      </AppText>
      <View style={styles.metricValueRow}>
        <AppText variant="title">{value}</AppText>
        <AppText
          variant="caption"
          style={tone === 'good' ? styles.good : tone === 'bad' ? styles.bad : styles.mutedDelta}>
          {delta}
        </AppText>
      </View>
    </Card>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <View style={styles.metricGrid}>{children}</View>;
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'good' | 'bad' | 'warning' | 'info';
}) {
  const toneStyle = {
    good: styles.badgeGood,
    bad: styles.badgeBad,
    warning: styles.badgeWarning,
    info: styles.badgeInfo,
  }[tone];
  const textStyle = {
    good: styles.good,
    bad: styles.bad,
    warning: styles.warning,
    info: styles.info,
  }[tone];
  return (
    <View style={[styles.badge, toneStyle]}>
      <AppText variant="caption" style={[styles.badgeText, textStyle]}>
        {label}
      </AppText>
    </View>
  );
}

export function SparkBars({ values, danger }: { values: number[]; danger?: boolean }) {
  const max = Math.max(...values);
  return (
    <View style={styles.sparkBars}>
      {values.map((value, index) => (
        <View
          key={`${value}-${index}`}
          style={[
            styles.sparkBar,
            {
              height: Math.max(4, (value / max) * 28),
              backgroundColor: danger ? colors.red : colors.blue,
              opacity: 0.58 + index * 0.05,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function VolumeBars({
  values,
  errorIndexes = [],
  height = 96,
}: {
  values: number[];
  errorIndexes?: number[];
  height?: number;
}) {
  const max = Math.max(...values);
  return (
    <View style={[styles.volumeBars, { height }]}>
      {values.map((value, index) => (
        <View
          key={`${value}-${index}`}
          style={[
            styles.volumeBar,
            {
              height: Math.max(5, (value / max) * (height - 12)),
              backgroundColor: errorIndexes.includes(index) ? colors.red : colors.blue,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function KeyValue({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.keyValue}>
      <AppText muted variant="caption">
        {label}
      </AppText>
      <AppText variant="label" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </AppText>
    </View>
  );
}

export function Chevron() {
  return <WatchDogIcon name={icons.chevron} size={18} />;
}

export const watchdogIcons = icons;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  contentWidth: {
    width: '100%',
    maxWidth: 720,
  },
  brandRow: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEyes: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  brandEye: {
    width: 2.5,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.background,
  },
  brandSmile: {
    width: 9,
    height: 5,
    borderBottomWidth: 1.5,
    borderColor: colors.background,
    borderRadius: 8,
    marginTop: 1,
  },
  environmentChip: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  environmentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  environmentText: {
    color: colors.text,
  },
  signOutButton: {
    minHeight: 30,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  text: {
    color: colors.text,
  },
  text_display: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  text_title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  text_heading: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  text_body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  text_label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  text_caption: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  text_mono: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  textMuted: {
    color: colors.textMuted,
  },
  titleBlock: {
    gap: 3,
    paddingTop: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 14,
    paddingVertical: 5,
    paddingRight: 8,
  },
  backLabel: {
    color: colors.primary,
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  timeChip: {
    height: 34,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.small,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  liveChip: {
    height: 34,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.small,
    backgroundColor: colors.primary,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background,
  },
  liveText: {
    color: colors.background,
  },
  screenBody: {
    gap: 14,
    paddingTop: 16,
  },
  bottomNav: {
    minHeight: 62,
    paddingTop: 7,
    paddingHorizontal: 7,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  navIconWrap: {
    minWidth: 46,
    height: 28,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: colors.primarySoft,
  },
  navLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.68,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  searchWrap: {
    minHeight: 44,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    minHeight: 42,
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  pillButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  pillButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillButtonPrimaryText: {
    color: colors.background,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 145,
    gap: 8,
  },
  metricValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 6,
  },
  good: {
    color: colors.green,
  },
  bad: {
    color: colors.red,
  },
  warning: {
    color: colors.yellow,
  },
  info: {
    color: colors.blue,
  },
  mutedDelta: {
    color: colors.textMuted,
  },
  badge: {
    minHeight: 24,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeGood: {
    backgroundColor: colors.greenSoft,
  },
  badgeBad: {
    backgroundColor: colors.redSoft,
  },
  badgeWarning: {
    backgroundColor: colors.yellowSoft,
  },
  badgeInfo: {
    backgroundColor: colors.blueSoft,
  },
  sparkBars: {
    height: 30,
    minWidth: 72,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  sparkBar: {
    flex: 1,
    minWidth: 3,
    borderRadius: 2,
  },
  volumeBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
  },
  volumeBar: {
    flex: 1,
    minWidth: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    opacity: 0.85,
  },
  keyValue: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
