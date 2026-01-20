import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const API_BASE = 'http://localhost:4000'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_BASE}/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          logout()
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        logout()
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchUserProfile()
    } else {
      setLoading(false)
    }
  }, [token, logout])

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        setUser(data.user)
        return { success: true, user: data.user }  // Return user for role checking
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }, [])

  const register = useCallback(async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }, [])

  const apiCall = useCallback(async (endpoint, options = {}) => {
    console.log('Making API call to:', `${API_BASE}${endpoint}`)
    console.log('With options:', options)

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }

      if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      })

      console.log('API response status:', response.status)
      return response
    } catch (error) {
      console.error('API call error:', error)
      throw error
    }
  }, [token])

  const value = useMemo(() => ({
    user,
    loading,
    token,
    login,
    register,
    logout,
    apiCall,
    setUser
  }), [user, loading, token, login, register, logout, apiCall])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
