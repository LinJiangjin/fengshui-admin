<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

import { fetchStats } from '@/api/stats'
import type { StatsInfo } from '@/api/types'

// 按需注册，避免把整个 echarts 打进包里
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const loading = ref(true)
const stats = ref<StatsInfo | null>(null)

const chartEl = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

const cards = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: '总用户数', value: s.total_users, icon: 'User', color: '#409eff' },
    { label: '今日新增', value: s.new_today, icon: 'Plus', color: '#67c23a' },
    { label: '近 7 天新增', value: s.new_7d, icon: 'TrendCharts', color: '#e6a23c' },
    { label: '近 7 天活跃', value: s.active_7d, icon: 'Histogram', color: '#909399' },
    { label: '封禁用户', value: s.banned_users, icon: 'CircleClose', color: '#f56c6c' },
    { label: '房屋总数', value: s.total_houses, icon: 'OfficeBuilding', color: '#409eff' },
    {
      label: '已测量房屋',
      value: s.measured_houses,
      icon: 'Compass',
      color: '#67c23a',
    },
  ]
})

function renderChart(data: StatsInfo) {
  if (!chartEl.value) return
  if (!chart) {
    chart = echarts.init(chartEl.value)
  }

  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 24, top: 24, bottom: 36 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.trend.map((point) => point.date.slice(5)), // 只显示 MM-DD
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#909399' },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#f0f2f5' } },
      axisLabel: { color: '#909399' },
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: data.trend.map((point) => point.new_users),
        itemStyle: { color: '#409eff' },
        lineStyle: { color: '#409eff', width: 2 },
        areaStyle: { color: 'rgba(64, 158, 255, 0.12)' },
      },
    ],
  })
}

function handleResize() {
  chart?.resize()
}

async function load() {
  loading.value = true
  try {
    const data = await fetchStats()
    stats.value = data
    // DOM 需要等 v-if 的卡片渲染完，放下一帧更稳
    requestAnimationFrame(() => renderChart(data))
  } catch {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div class="page" v-loading="loading">
    <div class="page-header">
      <div>
        <h2 class="page-title">数据看板</h2>
        <p class="page-subtitle">统计口径按东八区自然日切分，趋势展示近 14 天新增用户</p>
      </div>
      <el-button :icon="'Refresh'" @click="load">刷新</el-button>
    </div>

    <el-row :gutter="16">
      <el-col v-for="card in cards" :key="card.label" :xs="12" :sm="8" :md="6" :lg="6">
        <el-card class="stat-card" shadow="never">
          <div class="stat-card__body">
            <el-icon class="stat-card__icon" :style="{ color: card.color }">
              <component :is="card.icon" />
            </el-icon>
            <div>
              <div class="stat-card__value">{{ card.value }}</div>
              <div class="stat-card__label">{{ card.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-card" shadow="never">
      <template #header>
        <span>近 14 天新增用户</span>
      </template>
      <div ref="chartEl" class="chart"></div>
    </el-card>
  </div>
</template>

<style scoped>
.stat-card {
  margin-bottom: 16px;
  border-radius: 10px;
}

.stat-card__body {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-card__icon {
  font-size: 26px;
}

.stat-card__value {
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
}

.stat-card__label {
  color: var(--admin-text-secondary);
  font-size: 13px;
}

.chart-card {
  margin-top: 4px;
  border-radius: 10px;
}

.chart {
  width: 100%;
  height: 320px;
}
</style>
