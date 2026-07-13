import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators';

@ApiTags('Health Check')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  /**
   * Combined check (kept for backwards compatibility / manual inspection).
   * Orchestrators should prefer the dedicated /live and /ready probes below.
   */
  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check application health status' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);
  }

  /**
   * Liveness: is the process itself still running and not deadlocked/OOM?
   * Deliberately has no external dependencies (no DB) — a DB outage should
   * not cause the orchestrator to kill and restart otherwise-healthy pods.
   */
  @Public()
  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe (process health only)' })
  live() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);
  }

  /**
   * Readiness: can the app currently serve traffic (i.e. can it reach its
   * dependencies, like the database)? Used to gate load-balancer traffic.
   */
  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe (includes dependency checks)' })
  ready() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
