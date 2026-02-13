'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'

// Single initialization flag
let isMapsConfigured = false

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  onLocationSelect, 
  placeholder = "Commencez à saisir une adresse..." 
}) {
  const inputRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader')
        
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API
        if (!apiKey) {
          throw new Error("Clé API Google Maps manquante")
        }

        if (!isMapsConfigured) {
          setOptions({
            key: apiKey,
            v: "weekly",
            language: "fr"
          })
          isMapsConfigured = true
        }

        const { Autocomplete } = await importLibrary('places')
        
        if (!mounted || !inputRef.current) return

        const autocomplete = new Autocomplete(inputRef.current, {
          componentRestrictions: { country: "fr" },
          fields: ["formatted_address", "geometry"],
          types: ["address"],
        })

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()
          if (!place.geometry) return

          const formattedAddress = place.formatted_address || ''
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          onChange(formattedAddress)
          if (onLocationSelect) {
            onLocationSelect({ address: formattedAddress, lat, lng })
          }
        })

        setIsLoaded(true)
      } catch (err) {
        console.error("Google Maps Autocomplete Error:", err)
        if (mounted) setError(err.message)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="relative w-full">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={error ? `Erreur: ${error}` : placeholder}
        className={`pl-9 ${error ? 'border-red-500' : ''}`}
        autoComplete="off"
      />
      {!isLoaded && !error && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        </div>
      )}
    </div>
  )
}
