import { useMemo, useState } from 'react'
import {
  View,
  Button,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList
} from 'react-native'
import { useEnergyTrends, DeviceType } from '@/hooks/useEnergyTrends'
import { CartesianChart, StackedBar } from 'victory-native'
import { useFont } from '@shopify/react-native-skia'

import inter from '@/assets/fonts/inter-medium.ttf'

const deviceColors: Record<string, string> = {
  fridge: 'blue',
  oven: 'red',
  lights: 'yellow',
  'ev charger': 'green'
}

export default function EnergyChart() {
  const [trend, setTrend] = useState<'daily' | 'weekly' | 'monthly'>(
    'daily'
  )
  const [period, setPeriod] = useState<string>(
    new Date().toISOString().split('T')[0]
  ) // Default to today

  const [selectedDevice, setSelectedDevice] =
    useState<DeviceType | null>(null)

  const { data, totalUsage, deviceBreakdown, loading } =
    useEnergyTrends(trend, period)

  const changePeriod = (direction: 'prev' | 'next') => {
    const currentDate = new Date(period)

    if (trend === 'daily') {
      currentDate.setDate(
        currentDate.getDate() + (direction === 'next' ? 1 : -1)
      )
      setPeriod(currentDate.toISOString().split('T')[0]) // YYYY-MM-DD
    } else if (trend === 'weekly') {
      currentDate.setDate(
        currentDate.getDate() + (direction === 'next' ? 7 : -7)
      )
      setPeriod(currentDate.toISOString().split('T')[0]) // Start of the new week
    } else if (trend === 'monthly') {
      currentDate.setMonth(
        currentDate.getMonth() + (direction === 'next' ? 1 : -1)
      )
      setPeriod(currentDate.toISOString().split('T')[0].slice(0, 7)) // YYYY-MM
    }
  }

  const font = useFont(inter, 12)

  // 📌 Compute yDomain dynamically based on max total stacked usage
  const yDomain: [number, number] = useMemo(() => {
    if (!data.length) return [0, 10] // Default range if no data
    const maxUsage = Math.max(
      ...data.map(
        d =>
          Object.keys(d)
            .filter(key => key !== 'x') // Exclude x-axis labels
            .reduce((sum, key) => sum + (d[key] as number), 0) // Sum all device usages
      )
    )
    return [0, Math.ceil(maxUsage * 1.2)] // 20% padding above max value
  }, [data])

  const toggleSelection = (device: DeviceType) => {
    setSelectedDevice((prev: DeviceType | null) =>
      prev === device ? null : device
    )
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly'
        }}
      >
        <Button
          title="Daily"
          color={trend === 'daily' ? 'coral' : undefined}
          onPress={() => {
            setTrend('daily')
            setPeriod(new Date().toISOString().split('T')[0]) // Today
          }}
        />
        <Button
          title="Weekly"
          color={trend === 'weekly' ? 'coral' : undefined}
          onPress={() => {
            const today = new Date()
            const startOfWeek = new Date(
              today.setDate(today.getDate() - today.getDay())
            )
            setTrend('weekly')
            setPeriod(startOfWeek.toISOString().split('T')[0]) // YYYY-MM-DD
          }}
        />
        <Button
          title="Monthly"
          color={trend === 'monthly' ? 'coral' : undefined}
          onPress={() => {
            const today = new Date()
            const currentMonth = today
              .toISOString()
              .split('T')[0]
              .slice(0, 7) // YYYY-MM
            setTrend('monthly')
            setPeriod(currentMonth)
          }}
        />
      </View>

      <View
        style={{
          height: 300,
          borderRadius: 16,
          backgroundColor: 'white',
          marginHorizontal: 16
        }}
      >
        {data?.length > 0 ? (
          <CartesianChart
            data={data}
            padding={8}
            frame={{ lineColor: 'transparent' }}
            domain={{ y: yDomain }}
            domainPadding={{ left: 24, right: 24, top: 24 }}
            xKey="x"
            yKeys={['fridge', 'oven', 'lights', 'ev charger']}
            axisOptions={{
              font,
              labelColor: 'black',
              lineColor: 'transparent',
              formatXLabel: val => {
                if (trend === 'daily') {
                  return val
                }
                if (trend === 'monthly') {
                  return new Date(val).getDate().toString()
                }
                return new Date(val).toLocaleString('en-us', {
                  weekday: 'narrow'
                })
              }
            }}
          >
            {({ points, chartBounds }) => (
              <StackedBar
                barCount={
                  trend === 'daily' ? 24 : trend === 'weekly' ? 7 : 30
                }
                barOptions={({ isBottom, isTop, columnIndex }) => {
                  const deviceIndex = [
                    'fridge',
                    'oven',
                    'lights',
                    'ev charger'
                  ]
                  const color =
                    selectedDevice &&
                    deviceIndex.indexOf(selectedDevice) ===
                      columnIndex
                      ? 'coral'
                      : 'gray'

                  const BORDER_RADIUS = 6

                  // 👇 customize each individual bar as desired
                  return {
                    roundedCorners:
                      isTop && isBottom
                        ? {
                            topLeft: BORDER_RADIUS,
                            topRight: BORDER_RADIUS,
                            bottomRight: BORDER_RADIUS,
                            bottomLeft: BORDER_RADIUS
                          }
                        : isTop
                          ? {
                              topLeft: BORDER_RADIUS,
                              topRight: BORDER_RADIUS
                            }
                          : isBottom
                            ? {
                                bottomRight: BORDER_RADIUS,
                                bottomLeft: BORDER_RADIUS
                              }
                            : undefined,
                    color,
                    antiAlias: false
                  }
                }}
                chartBounds={chartBounds}
                points={[
                  points['fridge'] || [],
                  points['oven'] || [],
                  points['lights'] || [],
                  points['ev charger'] || []
                ]}
              />
            )}
          </CartesianChart>
        ) : (
          <Text>No data :(</Text>
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonsContainer}>
        <Button title="← Prev" onPress={() => changePeriod('prev')} />
        <Text>
          {trend !== 'weekly'
            ? period
            : `${data[0]?.x}...${data[data.length - 1]?.x}`}
        </Text>
        <Button title="Next →" onPress={() => changePeriod('next')} />
      </View>

      <View style={styles.deviceContainer}>
        <View style={styles.row}>
          <Text>Total</Text>
          <Text>{totalUsage} kWh</Text>
        </View>
        <FlatList
          data={
            Object.entries(deviceBreakdown) as [DeviceType, number][]
          } // ✅ Ensure correct type
          keyExtractor={([device]) => device}
          renderItem={({ item: [device, usage] }) => (
            <TouchableOpacity onPress={() => toggleSelection(device)}>
              <View
                style={[
                  styles.row,
                  selectedDevice === device && styles.selectedRow
                ]}
              >
                <Text>{device}</Text>
                <Text>{usage.toFixed(2)} kWh</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    gap: 16
  },
  periodButton: {
    backgroundColor: '#fff'
  },
  buttonsContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  },
  deviceContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16
  },
  selectedRow: {
    backgroundColor: 'coral'
  }
})
