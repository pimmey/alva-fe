import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StyleSheet
} from 'react-native'

const API_URL = 'http://localhost:3000' // Update later

export default function InsightsScreen() {
  const [insights, setInsights] = useState<
    { title: string; insight: string; emoji: string }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/insights`)
      .then(res => res.json())
      .then(json => {
        setInsights(json)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <ActivityIndicator size="large" />

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <ScrollView>
        <View style={styles.screenContainer}>
          <Text style={styles.screenTitle}>
            Weekly energy insights
          </Text>

          {insights.map((insight, index) => {
            return (
              <View key={index} style={styles.insightContainer}>
                <View style={styles.insightTitleContainer}>
                  <Text style={styles.insightTitle}>
                    {insight.title}
                  </Text>
                  <Text>{insight.emoji}</Text>
                </View>
                <Text>{insight.insight}</Text>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screenContainer: {
    gap: 16
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16
  },
  insightContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'column',
    gap: 8
  },
  insightTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  insightTitle: {
    fontSize: 18
  }
})
