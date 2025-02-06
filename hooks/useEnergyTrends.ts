import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:3000' // Update with your backend URL

// 📌 Define device types
export type DeviceType = 'fridge' | 'oven' | 'lights' | 'ev charger'

// 📌 Define API response structure
export interface TrendData extends Record<string, unknown> {
  x: string
  fridge: number
  oven: number
  lights: number
  'ev charger': number
}

export interface TrendResponse {
  total_usage_kwh: string
  device_breakdown: Record<DeviceType, number>
  data: TrendData[]
}

export function useEnergyTrends(
  trend: 'daily' | 'weekly' | 'monthly',
  period: string
) {
  const [data, setData] = useState<TrendData[]>([])
  const [totalUsage, setTotalUsage] = useState<string>('0')
  const [deviceBreakdown, setDeviceBreakdown] = useState<
    Record<DeviceType, number>
  >({ fridge: 0, oven: 0, lights: 0, 'ev charger': 0 })
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const userTimezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone

    const fetchData = async () => {
      try {
        let url = `${API_URL}/trends/${trend}?date=${period}&&timezone=${userTimezone}`
        console.log({ url })
        const response = await fetch(url)
        const json: TrendResponse = await response.json()

        setData(json.data)
        setTotalUsage(json.total_usage_kwh)
        setDeviceBreakdown(json.device_breakdown)
      } catch (error) {
        console.error('🚨 Error fetching energy trends:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [trend, period])

  return { data, totalUsage, deviceBreakdown, loading }
}
