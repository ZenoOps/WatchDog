import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import {
  AppText,
  Card,
  Chevron,
  KeyValue,
  MetricCard,
  MetricGrid,
  PillButton,
  SearchInput,
  SectionTitle,
  SparkBars,
  StatusBadge,
  VolumeBars,
  WatchDogIcon,
  WatchDogScreen,
  watchdogIcons,
} from './components';
import { alertRules, logs, operations, services, traces, type LogEntry, type Service } from './mock-data';
import { watchdogColors as colors, watchdogRadii as radii } from './theme';

const requestVolume = [22, 31, 26, 37, 45, 40, 57, 48, 52, 68, 58, 72, 63, 76, 70, 84, 79, 73, 91, 82, 78, 96];
const logVolume = [22, 30, 38, 31, 42, 48, 52, 45, 56, 61, 68, 63, 75, 72, 79, 84, 77, 88, 81, 92, 85, 88, 98, 91];

function go(router: ReturnType<typeof useRouter>, href: string) {
  router.push(href as Href);
}

function Dot({ tone = 'good' }: { tone?: 'good' | 'bad' | 'warning' | 'info' }) {
  const backgroundColor = {
    good: colors.green,
    bad: colors.red,
    warning: colors.yellow,
    info: colors.blue,
  }[tone];
  return <View style={[styles.dot, { backgroundColor }]} />;
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <AppText muted variant="caption">
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function IncidentCard({
  title,
  detail,
  tone,
  onPress,
}: {
  title: string;
  detail: string;
  tone: 'bad' | 'warning';
  onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.incident, tone === 'bad' ? styles.incidentBad : styles.incidentWarning]}>
        <Dot tone={tone} />
        <View style={styles.flex}>
          <AppText variant="label">{title}</AppText>
          <AppText muted variant="caption">
            {detail}
          </AppText>
        </View>
        {onPress ? <Chevron /> : null}
      </View>
    </Pressable>
  );
}

function CompactServiceRow({ service, onPress }: { service: Service; onPress?: () => void }) {
  const degraded = service.status === 'Degraded';
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
      <View style={styles.serviceNameWrap}>
        <Dot tone={degraded ? 'bad' : 'good'} />
        <View style={styles.flex}>
          <AppText variant="label">{service.name}</AppText>
          <AppText muted variant="caption">
            {service.rpm} req/min · {service.p95}
          </AppText>
        </View>
      </View>
      <StatusBadge label={service.status} tone={degraded ? 'bad' : 'good'} />
      {onPress ? <Chevron /> : null}
    </Pressable>
  );
}

export function OverviewScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const visibleServices = useMemo(
    () => services.filter((service) => service.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5),
    [search],
  );

  return (
    <WatchDogScreen
      subtitle="Unified health across services, logs, traces and infrastructure"
      title="System Overview">
      <SearchInput
        onChangeText={setSearch}
        placeholder="Search services, traces, logs, hosts…"
        value={search}
      />

      <MetricGrid>
        <MetricCard delta="All healthy" label="Services" tone="good" value="12" />
        <MetricCard delta="+8.4%" label="Requests / min" tone="good" value="48.2K" />
        <MetricCard delta="+0.63%" label="Error rate" tone="bad" value="1.82%" />
        <MetricCard delta="+36 ms" label="P95 latency" tone="bad" value="412 ms" />
      </MetricGrid>

      <Card style={styles.chartCard}>
        <SectionTitle title="Request volume & errors" />
        <Legend
          items={[
            { label: 'Requests', color: colors.blue },
            { label: 'Errors', color: colors.red },
          ]}
        />
        <VolumeBars errorIndexes={[9, 15, 20]} height={118} values={requestVolume} />
        <View style={styles.axisLabels}>
          <AppText muted variant="caption">09:00</AppText>
          <AppText muted variant="caption">09:15</AppText>
          <AppText muted variant="caption">09:30</AppText>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <SectionTitle title="Active incidents" />
        <IncidentCard
          detail="Error rate 8.9% · started 12m ago"
          onPress={() => go(router, '/service-detail')}
          title="Checkout API error spike"
          tone="bad"
        />
        <IncidentCard detail="p95 688 ms · started 28m ago" title="DB latency elevated" tone="warning" />
        <Pressable onPress={() => router.replace('/alerts' as Href)}>
          <AppText variant="label" style={styles.linkText}>
            View all incidents →
          </AppText>
        </Pressable>
      </Card>

      <Card style={styles.sectionCard}>
        <SectionTitle
          action={
            <Pressable onPress={() => router.replace('/services' as Href)}>
              <AppText variant="label" style={styles.linkText}>View all</AppText>
            </Pressable>
          }
          title="Service health"
        />
        {visibleServices.map((service) => (
          <CompactServiceRow
            key={service.name}
            onPress={service.name === 'checkout-service' ? () => go(router, '/service-detail') : undefined}
            service={service}
          />
        ))}
      </Card>

      <Card style={styles.sectionCard}>
        <SectionTitle title="Error hotspots" />
        {[
          ['POST /checkout', 'checkout-service', '1,284'],
          ['POST /payments', 'payment-service', '412'],
          ['GET /inventory/:id', 'inventory-service', '221'],
          ['POST /login', 'user-service', '119'],
        ].map(([endpoint, service, count]) => (
          <View key={endpoint} style={styles.hotspotRow}>
            <View style={styles.flex}>
              <AppText variant="label">{endpoint}</AppText>
              <AppText muted variant="caption">{service}</AppText>
            </View>
            <View style={styles.alignEnd}>
              <AppText variant="heading" style={styles.bad}>{count}</AppText>
              <AppText muted variant="caption">errors</AppText>
            </View>
          </View>
        ))}
      </Card>
    </WatchDogScreen>
  );
}

export function ServicesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [environment, setEnvironment] = useState<'All' | 'Production'>('All');
  const visibleServices = services.filter((service) =>
    service.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <WatchDogScreen subtitle="Application performance monitoring" title="Services">
      <SearchInput onChangeText={setSearch} placeholder="Search service" value={search} />
      <ScrollView horizontal contentContainerStyle={styles.filterRow} showsHorizontalScrollIndicator={false}>
        <PillButton
          icon={watchdogIcons.tune}
          label={`Environment: ${environment}`}
          onPress={() => setEnvironment((value) => (value === 'All' ? 'Production' : 'All'))}
        />
        <PillButton label="Sort: Error rate" />
      </ScrollView>

      <View style={styles.serviceCards}>
        {visibleServices.map((service) => {
          const degraded = service.status === 'Degraded';
          return (
            <Pressable
              key={service.name}
              onPress={service.name === 'checkout-service' ? () => go(router, '/service-detail') : undefined}
              style={({ pressed }) => pressed && styles.pressed}>
              <Card style={styles.serviceCard}>
                <View style={styles.serviceCardTop}>
                  <View style={styles.serviceNameWrap}>
                    <Dot tone={degraded ? 'bad' : 'good'} />
                    <View>
                      <AppText variant="heading">{service.name}</AppText>
                      <AppText muted variant="caption">{service.rpm} requests/min</AppText>
                    </View>
                  </View>
                  <SparkBars danger={degraded} values={service.spark} />
                </View>
                <View style={styles.serviceStats}>
                  <KeyValue label="Error rate" value={service.errorRate} valueColor={degraded ? colors.red : undefined} />
                  <KeyValue label="P50" value={service.p50} />
                  <KeyValue label="P95" value={service.p95} />
                  <StatusBadge label={service.status} tone={degraded ? 'bad' : 'good'} />
                </View>
                {service.name === 'checkout-service' ? (
                  <View style={styles.openHint}>
                    <AppText variant="label" style={styles.linkText}>Open service details</AppText>
                    <Chevron />
                  </View>
                ) : null}
              </Card>
            </Pressable>
          );
        })}
      </View>
    </WatchDogScreen>
  );
}

export function ServiceDetailScreen() {
  const router = useRouter();
  return (
    <WatchDogScreen
      backLabel="Services"
      onBack={() => router.back()}
      showTabs={false}
      subtitle="Service details · production"
      title="checkout-service">
      <View style={styles.detailTabs}>
        <View style={[styles.detailTab, styles.detailTabActive]}>
          <AppText variant="label" style={styles.detailTabTextActive}>Overview</AppText>
        </View>
        <Pressable onPress={() => go(router, '/traces')} style={styles.detailTab}>
          <AppText muted variant="label">Traces</AppText>
        </Pressable>
        <Pressable onPress={() => go(router, '/logs')} style={styles.detailTab}>
          <AppText muted variant="label">Logs</AppText>
        </Pressable>
        <View style={styles.detailTab}>
          <AppText muted variant="label">Metrics</AppText>
        </View>
      </View>

      <MetricGrid>
        <MetricCard delta="+12.4%" label="Request rate" tone="good" value="8.7K/min" />
        <MetricCard delta="+6.1%" label="Error rate" tone="bad" value="8.90%" />
        <MetricCard delta="+211 ms" label="P95 latency" tone="bad" value="624 ms" />
        <MetricCard delta="-0.11" label="Apdex" tone="bad" value="0.72" />
      </MetricGrid>

      <Card style={styles.chartCard}>
        <SectionTitle title="Latency by endpoint" />
        <Legend
          items={[
            { label: 'POST /checkout', color: colors.primary },
            { label: 'GET /cart', color: colors.blue },
          ]}
        />
        <VolumeBars errorIndexes={[12, 17, 21]} height={130} values={[24, 28, 26, 41, 36, 52, 44, 58, 51, 63, 58, 72, 66, 78, 69, 84, 80, 93]} />
      </Card>

      <Card style={styles.sectionCard}>
        <SectionTitle title="Dependencies" />
        {[
          ['postgres', '286 ms', '2.1%', 'bad'],
          ['payment-service', '174 ms', '0.7%', 'good'],
          ['redis', '42 ms', '0.1%', 'good'],
        ].map(([name, latency, error, tone]) => (
          <View key={name} style={styles.dependencyRow}>
            <View style={styles.serviceNameWrap}>
              <Dot tone={tone as 'good' | 'bad'} />
              <AppText variant="label">{name}</AppText>
            </View>
            <AppText muted variant="caption">{latency}</AppText>
            <AppText variant="caption" style={tone === 'bad' ? styles.bad : styles.good}>{error}</AppText>
          </View>
        ))}
      </Card>

      <Card style={styles.sectionCard}>
        <SectionTitle title="Top operations" />
        {operations.map((operation, index) => (
          <Pressable
            key={operation.name}
            onPress={index === 0 ? () => go(router, '/trace-detail') : undefined}
            style={({ pressed }) => [styles.operationRow, pressed && styles.pressed]}>
            <View style={styles.flex}>
              <AppText variant="label">{operation.name}</AppText>
              <AppText muted variant="caption">
                {operation.requests} requests · p95 {operation.p95}
              </AppText>
            </View>
            <AppText variant="label" style={Number.parseFloat(operation.error) > 5 ? styles.bad : undefined}>
              {operation.error}
            </AppText>
            {index === 0 ? <Chevron /> : null}
          </Pressable>
        ))}
      </Card>
    </WatchDogScreen>
  );
}

function LevelBadge({ level }: { level: LogEntry['level'] }) {
  return (
    <StatusBadge
      label={level}
      tone={level === 'ERROR' ? 'bad' : level === 'WARN' ? 'warning' : 'info'}
    />
  );
}

export function LogsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('service.name = “checkout-service” AND severity >= WARN');
  const [hasRun, setHasRun] = useState(false);

  return (
    <WatchDogScreen subtitle="Search and investigate structured application logs" title="Logs Explorer">
      <View style={styles.queryRow}>
        <SearchInput containerStyle={styles.flex} onChangeText={setQuery} placeholder="Enter log query" value={query} />
        <PillButton label={hasRun ? 'Updated' : 'Run'} onPress={() => setHasRun(true)} primary />
      </View>

      <Card style={styles.chartCard}>
        <SectionTitle title="Log volume" />
        <VolumeBars errorIndexes={[15, 18, 22]} height={112} values={logVolume} />
        <View style={styles.axisLabels}>
          <AppText muted variant="caption">09:00</AppText>
          <AppText muted variant="caption">09:15</AppText>
          <AppText muted variant="caption">09:30</AppText>
        </View>
      </Card>

      <View style={styles.logList}>
        {logs.map((entry, index) => (
          <Pressable
            key={`${entry.time}-${entry.message}`}
            onPress={entry.level === 'ERROR' ? () => go(router, '/trace-detail') : undefined}
            style={({ pressed }) => pressed && styles.pressed}>
            <Card style={styles.logCard}>
              <View style={styles.logHeader}>
                <LevelBadge level={entry.level} />
                <AppText muted variant="caption">{entry.time}</AppText>
                {entry.level === 'ERROR' ? <Chevron /> : null}
              </View>
              <AppText variant="label">{entry.service}</AppText>
              <AppText variant="mono" style={styles.logMessage}>{entry.message}</AppText>
            </Card>
          </Pressable>
        ))}
      </View>
    </WatchDogScreen>
  );
}

function TraceDistribution() {
  const dotColors = [colors.blue, colors.blue, colors.primary, colors.blue, colors.red, colors.blue];
  return (
    <View style={styles.distribution}>
      {Array.from({ length: 48 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.distributionDot,
            {
              backgroundColor: dotColors[(index * 5 + Math.floor(index / 7)) % dotColors.length],
              marginTop: (index % 4) * 5,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function TracesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('service.name = “checkout-service”');

  return (
    <WatchDogScreen subtitle="Investigate distributed request paths" title="Traces Explorer">
      <View style={styles.queryRow}>
        <SearchInput containerStyle={styles.flex} onChangeText={setQuery} placeholder="Search traces" value={query} />
        <PillButton label="Run" primary />
      </View>

      <Card style={styles.chartCard}>
        <SectionTitle title="Trace duration distribution" />
        <TraceDistribution />
        <View style={styles.axisLabels}>
          <AppText muted variant="caption">0 ms</AppText>
          <AppText muted variant="caption">500 ms</AppText>
          <AppText muted variant="caption">1s+</AppText>
        </View>
      </Card>

      <View style={styles.traceList}>
        {traces.map((trace) => {
          const error = trace.status === 'Error';
          return (
            <Pressable
              key={trace.id}
              onPress={() => go(router, '/trace-detail')}
              style={({ pressed }) => pressed && styles.pressed}>
              <Card style={styles.traceCard}>
                <View style={styles.traceTopRow}>
                  <AppText variant="mono" style={styles.traceId}>{trace.id}</AppText>
                  <StatusBadge label={trace.status} tone={error ? 'bad' : 'good'} />
                  <Chevron />
                </View>
                <AppText variant="label">{trace.operation}</AppText>
                <AppText muted variant="caption">{trace.service} · {trace.spans} spans · {trace.start}</AppText>
                <View style={styles.traceDurationRow}>
                  <View style={[styles.traceDurationBar, { width: error ? '82%' : '35%', backgroundColor: error ? colors.red : colors.green }]} />
                  <AppText variant="label" style={error ? styles.bad : styles.good}>{trace.duration}</AppText>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </WatchDogScreen>
  );
}

const waterfallSpans: {
  name: string;
  operation: string;
  duration: string;
  left: `${number}%`;
  width: `${number}%`;
  color: string;
  indent: number;
}[] = [
  { name: 'checkout-service', operation: 'POST /checkout', duration: '1420 ms', left: '0%', width: '96%', color: colors.primary, indent: 0 },
  { name: 'checkout-service', operation: 'validate_cart', duration: '155 ms', left: '3%', width: '18%', color: colors.blue, indent: 1 },
  { name: 'inventory-service', operation: 'reserve_items', duration: '147 ms', left: '13%', width: '17%', color: colors.blue, indent: 1 },
  { name: 'postgres', operation: 'SELECT inventory', duration: '32 ms', left: '16%', width: '5%', color: colors.green, indent: 2 },
  { name: 'payment-service', operation: 'authorize_payment', duration: '735 ms', left: '25%', width: '54%', color: colors.red, indent: 1 },
  { name: 'payment-provider', operation: 'POST /authorize', duration: '645 ms', left: '29%', width: '46%', color: colors.red, indent: 2 },
  { name: 'redis', operation: 'GET payment-session', duration: '70 ms', left: '76%', width: '8%', color: colors.purple, indent: 2 },
  { name: 'checkout-service', operation: 'persist_order', duration: '174 ms', left: '82%', width: '14%', color: colors.blue, indent: 1 },
  { name: 'postgres', operation: 'INSERT orders', duration: '128 ms', left: '84%', width: '12%', color: colors.green, indent: 2 },
];

export function TraceDetailScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [errorsOnly, setErrorsOnly] = useState(false);
  return (
    <WatchDogScreen
      backLabel="Traces"
      onBack={() => router.back()}
      showTabs={false}
      subtitle="POST /checkout · checkout-service · 1.42 s"
      title="Trace 8fc1a4b5e913…">
      <SearchInput
        onChangeText={setSearch}
        placeholder="Search spans by service, operation or attribute"
        value={search}
      />
      <View style={styles.filterRow}>
        <PillButton label="Waterfall" />
        <PillButton
          label={errorsOnly ? 'Showing errors' : 'Show errors only'}
          onPress={() => setErrorsOnly((value) => !value)}
          primary={errorsOnly}
        />
      </View>

      <Card style={styles.sectionCard}>
        <SectionTitle title="Span waterfall" />
        <View style={styles.waterfallAxis}>
          {['0', '250', '500', '750', '1000', '1420 ms'].map((label) => (
            <AppText key={label} muted variant="caption">{label}</AppText>
          ))}
        </View>
        {waterfallSpans
          .filter((span) => !errorsOnly || span.color === colors.red)
          .map((span) => (
            <View key={`${span.name}-${span.operation}`} style={styles.spanRow}>
              <View style={[styles.spanLabel, { paddingLeft: span.indent * 12 }]}>
                <AppText numberOfLines={1} variant="caption">{span.indent ? '└ ' : ''}{span.name}</AppText>
                <AppText numberOfLines={1} muted variant="caption">{span.operation}</AppText>
              </View>
              <View style={styles.spanTrack}>
                <View style={[styles.spanBar, { marginLeft: span.left, width: span.width, backgroundColor: span.color }]} />
              </View>
              <AppText variant="caption" style={{ color: span.color }}>{span.duration}</AppText>
            </View>
          ))}
      </Card>

      <Card style={styles.sectionCard}>
        <SectionTitle title="Span details" />
        <View>
          <AppText variant="heading">payment-service</AppText>
          <AppText muted variant="caption">authorize_payment</AppText>
        </View>
        <StatusBadge label="ERROR" tone="bad" />
        <KeyValue label="Duration" value="735 ms" />
        <KeyValue label="Start time" value="09:28:33.581" />
        <View style={styles.divider} />
        <AppText variant="label">Attributes</AppText>
        <KeyValue label="http.method" value="POST" />
        <KeyValue label="http.status_code" value="504" />
        <KeyValue label="peer.service" value="stripe" />
        <KeyValue label="retry.count" value="2" />
        <KeyValue label="region" value="ap-southeast-1" />
      </Card>

      <Card style={styles.sectionCard}>
        <SectionTitle title="Related signals" />
        <View style={styles.relatedButtons}>
          <PillButton label="View logs (14)" onPress={() => go(router, '/logs')} />
          <PillButton label="View service" onPress={() => go(router, '/service-detail')} />
        </View>
        <View style={styles.exceptionCard}>
          <AppText variant="label" style={styles.bad}>TimeoutError</AppText>
          <AppText variant="mono">provider did not respond within configured timeout of 5000ms</AppText>
          <AppText muted variant="caption">payment/client.go:188</AppText>
        </View>
      </Card>
    </WatchDogScreen>
  );
}

export function AlertsScreen() {
  const router = useRouter();
  const [showDraft, setShowDraft] = useState(false);
  return (
    <WatchDogScreen subtitle="Rules, incidents and notification status" title="Alerts">
      <MetricGrid>
        <MetricCard delta="2 critical" label="Firing" tone="bad" value="3" />
        <MetricCard delta="Needs attention" label="Pending" tone="bad" value="2" />
        <MetricCard delta="+24%" label="Resolved today" tone="good" value="18" />
        <MetricCard delta="24 enabled" label="Rules" tone="good" value="26" />
      </MetricGrid>

      <Card style={styles.sectionCard}>
        <SectionTitle title="Active incidents" />
        <IncidentCard
          detail="checkout-service · firing · 12 min ago"
          onPress={() => go(router, '/service-detail')}
          title="Checkout error rate > 5%"
          tone="bad"
        />
        <IncidentCard detail="postgres · firing · 28 min ago" title="Postgres p95 latency > 500ms" tone="warning" />
        <IncidentCard detail="worker-03 · pending · 6 min ago" title="CPU saturation > 85%" tone="warning" />
      </Card>

      <Card style={styles.sectionCard}>
        <SectionTitle
          action={<PillButton label="+ New rule" onPress={() => setShowDraft((value) => !value)} primary />}
          title="Alert rules"
        />
        {showDraft ? (
          <View style={styles.draftRule}>
            <AppText variant="label">New alert rule</AppText>
            <AppText muted variant="caption">UI preview only · connect a backend later to save rules.</AppText>
          </View>
        ) : null}
        {alertRules.map((rule) => (
          <View key={rule.name} style={styles.ruleRow}>
            <View style={styles.flex}>
              <AppText variant="label">{rule.name}</AppText>
              <AppText muted variant="caption">{rule.type} · {rule.condition}</AppText>
            </View>
            <View style={styles.alignEnd}>
              <View style={styles.enabledRow}>
                <Dot />
                <AppText variant="caption" style={styles.good}>Enabled</AppText>
              </View>
              <AppText muted variant="caption">{rule.age}</AppText>
            </View>
          </View>
        ))}
      </Card>
    </WatchDogScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.66 },
  bad: { color: colors.red },
  good: { color: colors.green },
  linkText: { color: colors.primary },
  alignEnd: { alignItems: 'flex-end' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legend: { flexDirection: 'row', justifyContent: 'flex-end', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  chartCard: { gap: 12 },
  sectionCard: { gap: 10 },
  axisLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  incident: {
    minHeight: 68,
    padding: 12,
    borderRadius: radii.small,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  incidentBad: { backgroundColor: '#23171B', borderColor: '#4A252C' },
  incidentWarning: { backgroundColor: '#1D1D17', borderColor: '#353521' },
  listRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  serviceNameWrap: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  hotspotRow: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  filterRow: { flexDirection: 'row', gap: 8 },
  serviceCards: { gap: 10 },
  serviceCard: { gap: 12 },
  serviceCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  serviceStats: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 7,
  },
  openHint: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 },
  detailTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  detailTab: { minHeight: 38, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  detailTabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  detailTabTextActive: { color: colors.primary },
  dependencyRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  operationRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  queryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logList: { gap: 8 },
  logCard: { gap: 7 },
  logHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  logMessage: { color: colors.text, fontSize: 11 },
  distribution: {
    minHeight: 118,
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'space-around',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  distributionDot: { width: 5, height: 5, borderRadius: 3, marginHorizontal: 4 },
  traceList: { gap: 8 },
  traceCard: { gap: 7 },
  traceTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  traceId: { flex: 1, color: colors.primary, fontWeight: '700' },
  traceDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  traceDurationBar: { height: 5, borderRadius: 3, opacity: 0.82 },
  waterfallAxis: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: '34%' },
  spanRow: { minHeight: 54, justifyContent: 'center', gap: 5 },
  spanLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spanTrack: { height: 12, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden' },
  spanBar: { height: 12, borderRadius: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 3 },
  relatedButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exceptionCard: { padding: 12, borderWidth: 1, borderColor: '#4A252C', borderRadius: radii.small, gap: 6, backgroundColor: '#1C1418' },
  draftRule: { padding: 12, borderRadius: radii.small, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primarySoft, gap: 3 },
  ruleRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  enabledRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
