'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

const RepairContext = createContext(null)
const STORAGE_KEY = 'velo_repair_request'

export function RepairProvider({ children }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({})
  const [isLoaded, setIsLoaded] = useState(false)
  const [userBikes, setUserBikes] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setFormData(JSON.parse(saved))
      } catch (e) {
        console.error('Error parsing saved data', e)
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/admin/users/me')
        if (res.ok) {
          const userData = await res.json()
          setFormData((prev) => ({
            ...prev,
            firstName: prev.firstName || userData.firstName || clerkUser?.firstName || '',
            lastName: prev.lastName || userData.lastName || clerkUser?.lastName || '',
            email: prev.email || userData.email || clerkUser?.primaryEmailAddress?.emailAddress || '',
            phone: prev.phone || userData.phone || '',
            address: prev.address || userData.requests?.[0]?.address || ''
          }))
        }
      } catch (error) {
        console.error('Failed to pre-fill user data', error)
      }
    }

    const fetchUserBikes = async () => {
      try {
        const res = await fetch('/api/bikes')
        if (res.ok) {
          const bikes = await res.json()
          setUserBikes(bikes)
        }
      } catch (error) {
        console.error('Failed to fetch user bikes', error)
      }
    }

    if (isLoaded && clerkLoaded && clerkUser) {
      fetchUserData()
      fetchUserBikes()
    }
  }, [isLoaded, clerkLoaded, clerkUser])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
    }
  }, [formData, isLoaded])

  const updateFormData = (newData) => {
    setFormData((prev) => {
      const resolvedData = { ...newData }
      Object.keys(newData).forEach((key) => {
        if (typeof newData[key] === 'function') {
          resolvedData[key] = newData[key](prev[key])
        }
      })
      return { ...prev, ...resolvedData }
    })
  }

  const validateStep = () => {
    if (currentStep === 1) {
      return !!formData.bikeType && !!formData.bikeModel
    }
    if (currentStep === 2) {
      return !!formData.servicePackageId
    }
    if (currentStep === 3) {
      return (
        formData.firstName &&
        formData.lastName &&
        formData.phone &&
        formData.address
      )
    }
    if (currentStep === 4) {
      return !!formData.scheduledAt
    }
    return true
  }

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 5))
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo(0, 0)
  }

  const resetStore = () => {
    setFormData({})
    setCurrentStep(1)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = {
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    updateFormData,
    isLoaded,
    userBikes,
    setUserBikes,
    validateStep,
    nextStep,
    prevStep,
    resetStore
  }

  return (
    <RepairContext.Provider value={value}>
      {children}
    </RepairContext.Provider>
  )
}

export function useRepair() {
  const context = useContext(RepairContext)
  if (!context) {
    throw new Error('useRepair must be used within a RepairProvider')
  }
  return context
}
