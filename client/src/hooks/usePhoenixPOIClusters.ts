import { useEffect, useState, useRef, useCallback } from 'react'
import { Socket, Channel } from 'phoenix'

// Types
interface Viewport {
  north: number
  south: number
  east: number
  west: number
}

interface POI {
  id: string
  lat: number
  lng: number
  name: string
  category: string
  rating: number
  reviews_count?: number
  formatted_address?: string
  price_level?: number
}

interface Cluster {
  id: string
  lat: number
  lng: number
  count: number
  pois: POI[]
  type: 'single_poi' | 'cluster'
  category_breakdown?: Record<string, number>
  avg_rating?: number
  zoom_level?: number
}

interface POIFilters {
  categories?: string[]
  min_rating?: number
  price_levels?: number[]
  has_reviews?: boolean
}

interface UsePhoenixPOIClustersOptions {
  socketUrl?: string
  authToken?: string | null
  debounceMs?: number
  maxRetries?: number
  retryDelayMs?: number
}

// Main hook
export function usePhoenixPOIClusters(
  viewport: Viewport,
  zoom: number,
  filters: POIFilters = {},
  options: UsePhoenixPOIClustersOptions = {}
) {
  // Configuration with defaults
  const {
    socketUrl = '/socket',
    authToken = null,
    debounceMs = 200,
    maxRetries = 3,
    retryDelayMs = 1000,
  } = options

  // State management
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs for connection management
  const socketRef = useRef<Socket | null>(null)
  const channelRef = useRef<Channel | null>(null)
  const retryCountRef = useRef(0)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Connection setup
  const connectToSocket = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)

      // Create socket connection
      const socketParams = authToken ? { token: authToken } : {}
      const socket = new Socket(socketUrl, { params: socketParams })
      
      socket.onError(() => {
        console.error('Phoenix Socket Error')
        setIsConnected(false)
        setError('Connection error')
      })

      socket.onClose(() => {
        console.log('Phoenix Socket Closed')
        setIsConnected(false)
      })

      // Connect to socket
      socket.connect()
      socketRef.current = socket

      // Join POI channel
      const channel = socket.channel('poi:viewport', {
        bounds: viewport,
        zoom: zoom,
        filters: filters
      })

      // Handle successful connection
      channel.on('phx_reply', (payload) => {
        if (payload.status === 'ok') {
          console.log('POI Channel joined successfully')
          setIsConnected(true)
          setError(null)
          retryCountRef.current = 0
          
          // Initial clusters will arrive via 'clusters_updated' event
          // Keep loading true until we get the first clusters
        }
      })

      // Handle cluster updates
      channel.on('clusters_updated', (payload) => {
        console.log(`Clusters updated: ${payload.cluster_count} clusters (${payload.reason})`)
        setClusters(payload.clusters || [])
        setIsLoading(false)
      })

      // Handle clustering errors
      channel.on('clustering_error', (payload) => {
        console.error('Clustering error:', payload.reason)
        setError(payload.reason)
        setIsLoading(false)
      })

      // Handle channel errors
      channel.onError((reason) => {
        console.error('POI Channel Error:', reason)
        setError(`Channel error: ${reason}`)
        setIsConnected(false)
      })

      // Join the channel
      const joinResponse = await new Promise<any>((resolve, reject) => {
        const push = channel.join()
        push.receive('ok', resolve)
        push.receive('error', reject)
        push.receive('timeout', () => reject(new Error('Join timeout')))
      })

      channelRef.current = channel

      // Set initial clusters
      if (joinResponse.clusters) {
        setClusters(joinResponse.clusters)
      }

      setIsConnected(true)
      setIsLoading(false)

    } catch (error) {
      console.error('Connection failed:', error)
      setError(`Connection failed: ${error}`)
      setIsConnected(false)
      setIsLoading(false)

      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        console.log(`Retrying connection (${retryCountRef.current}/${maxRetries})...`)
        setTimeout(connectToSocket, retryDelayMs * retryCountRef.current)
      }
    }
  }, [socketUrl, authToken, viewport, zoom, filters, maxRetries, retryDelayMs])

  // Debounced viewport updates
  const updateViewport = useCallback((newViewport: Viewport, newZoom: number, newFilters: POIFilters) => {
    if (!channelRef.current) return

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    setIsLoading(true)

    // Debounce the update
    debounceRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.push('bounds_changed', {
          bounds: newViewport,
          zoom: newZoom,
          filters: newFilters
        })
      }
    }, debounceMs)
  }, [debounceMs])

  // Manual refresh
  const refreshClusters = useCallback(() => {
    if (!channelRef.current) return

    setIsLoading(true)
    
    channelRef.current.push('refresh_clusters', {})
      .receive('ok', () => {
        console.log('Clusters refreshed successfully')
      })
      .receive('error', (reason) => {
        console.error('Failed to refresh clusters:', reason)
        setError(`Refresh failed: ${reason}`)
        setIsLoading(false)
      })
  }, [])

  // Connect on mount
  useEffect(() => {
    connectToSocket()

    // Cleanup on unmount
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      
      if (channelRef.current) {
        channelRef.current.leave()
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [connectToSocket])

  // Update viewport when dependencies change
  useEffect(() => {
    if (isConnected) {
      updateViewport(viewport, zoom, filters)
    }
  }, [viewport, zoom, filters, isConnected, updateViewport])

  return {
    // Data
    clusters,
    isLoading,
    isConnected,
    error,

    // Actions
    refreshClusters,
    
    // Connection management
    reconnect: connectToSocket,
    
    // Statistics
    totalClusters: clusters.length,
    singlePOIs: clusters.filter(c => c.type === 'single_poi').length,
    multiPOIClusters: clusters.filter(c => c.type === 'cluster').length
  }
}