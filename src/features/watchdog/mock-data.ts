export type ServiceStatus = 'Healthy' | 'Degraded';

export type Service = {
  name: string;
  rpm: string;
  errorRate: string;
  p50: string;
  p95: string;
  p99: string;
  status: ServiceStatus;
  spark: number[];
};

export const services: Service[] = [
  {
    name: 'checkout-service',
    rpm: '8.7K',
    errorRate: '8.90%',
    p50: '132 ms',
    p95: '624 ms',
    p99: '1.21 s',
    status: 'Degraded',
    spark: [32, 38, 34, 50, 44, 61, 57, 72],
  },
  {
    name: 'payment-service',
    rpm: '7.2K',
    errorRate: '0.67%',
    p50: '92 ms',
    p95: '286 ms',
    p99: '602 ms',
    status: 'Healthy',
    spark: [28, 33, 31, 43, 46, 53, 49, 60],
  },
  {
    name: 'api-gateway',
    rpm: '18.4K',
    errorRate: '0.31%',
    p50: '44 ms',
    p95: '118 ms',
    p99: '267 ms',
    status: 'Healthy',
    spark: [35, 49, 38, 52, 60, 48, 64, 61],
  },
  {
    name: 'user-service',
    rpm: '5.1K',
    errorRate: '0.18%',
    p50: '39 ms',
    p95: '104 ms',
    p99: '188 ms',
    status: 'Healthy',
    spark: [25, 31, 28, 39, 36, 47, 50, 54],
  },
  {
    name: 'inventory-service',
    rpm: '4.8K',
    errorRate: '1.04%',
    p50: '88 ms',
    p95: '238 ms',
    p99: '492 ms',
    status: 'Healthy',
    spark: [30, 29, 38, 34, 48, 42, 53, 58],
  },
  {
    name: 'notification-worker',
    rpm: '1.2K',
    errorRate: '0.06%',
    p50: '21 ms',
    p95: '67 ms',
    p99: '118 ms',
    status: 'Healthy',
    spark: [23, 29, 25, 33, 36, 31, 43, 38],
  },
  {
    name: 'search-service',
    rpm: '2.9K',
    errorRate: '0.42%',
    p50: '62 ms',
    p95: '171 ms',
    p99: '320 ms',
    status: 'Healthy',
    spark: [21, 19, 29, 33, 31, 43, 40, 46],
  },
];

export type LogEntry = {
  time: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  service: string;
  message: string;
};

export const logs: LogEntry[] = [
  {
    time: '09:28:42.912',
    level: 'ERROR',
    service: 'checkout-service',
    message: 'payment authorization failed: timeout after 5000ms',
  },
  {
    time: '09:28:41.104',
    level: 'WARN',
    service: 'checkout-service',
    message: 'retrying payment request attempt=2 provider=stripe',
  },
  {
    time: '09:28:38.551',
    level: 'ERROR',
    service: 'checkout-service',
    message: 'database query exceeded threshold duration=842ms',
  },
  {
    time: '09:28:33.206',
    level: 'INFO',
    service: 'api-gateway',
    message: 'POST /checkout 502 641ms trace_id=8fc1a4…',
  },
  {
    time: '09:28:28.942',
    level: 'WARN',
    service: 'inventory-service',
    message: 'low stock threshold reached sku=WD-1842 remaining=3',
  },
  {
    time: '09:28:19.117',
    level: 'ERROR',
    service: 'checkout-service',
    message: 'failed to reserve inventory sku=WD-4281',
  },
  {
    time: '09:28:12.660',
    level: 'INFO',
    service: 'payment-service',
    message: 'payment intent created amount=129.00 currency=USD',
  },
  {
    time: '09:28:04.382',
    level: 'WARN',
    service: 'checkout-service',
    message: 'circuit breaker half-open dependency=postgres',
  },
];

export type Trace = {
  id: string;
  service: string;
  operation: string;
  duration: string;
  spans: number;
  status: 'Error' | 'OK';
  start: string;
};

export const traces: Trace[] = [
  {
    id: '8fc1a4b5e913…',
    service: 'checkout-service',
    operation: 'POST /checkout',
    duration: '1.42 s',
    spans: 34,
    status: 'Error',
    start: '09:28:33',
  },
  {
    id: '1a62fdc90b27…',
    service: 'checkout-service',
    operation: 'POST /checkout',
    duration: '824 ms',
    spans: 29,
    status: 'Error',
    start: '09:27:58',
  },
  {
    id: 'd1283e99a21c…',
    service: 'checkout-service',
    operation: 'GET /cart',
    duration: '218 ms',
    spans: 16,
    status: 'OK',
    start: '09:27:41',
  },
  {
    id: 'a92c31174fa8…',
    service: 'api-gateway',
    operation: 'POST /checkout',
    duration: '641 ms',
    spans: 31,
    status: 'Error',
    start: '09:27:22',
  },
  {
    id: '018aa2f71ba2…',
    service: 'checkout-service',
    operation: 'GET /cart',
    duration: '174 ms',
    spans: 14,
    status: 'OK',
    start: '09:26:58',
  },
];

export const alertRules = [
  { name: 'Checkout error rate', type: 'Metric', condition: 'error_rate > 5% for 5m', age: '8 sec ago' },
  { name: 'High API latency', type: 'Metric', condition: 'p95_latency > 500ms', age: '8 sec ago' },
  { name: 'Payment timeout logs', type: 'Logs', condition: 'message CONTAINS “timeout”', age: '18 sec ago' },
  { name: 'Trace duration anomaly', type: 'Trace', condition: 'duration > 1s', age: '20 sec ago' },
];

export const operations = [
  { name: 'POST /checkout', requests: '4,188', error: '12.8%', p50: '155 ms', p95: '701 ms' },
  { name: 'GET /cart', requests: '2,714', error: '1.2%', p50: '73 ms', p95: '208 ms' },
  { name: 'POST /coupon/validate', requests: '1,302', error: '2.9%', p50: '93 ms', p95: '320 ms' },
  { name: 'GET /shipping/rates', requests: '941', error: '0.8%', p50: '81 ms', p95: '278 ms' },
];
