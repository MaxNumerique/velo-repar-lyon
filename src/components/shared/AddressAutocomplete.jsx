'use client'

import React, { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'

let isConfigured = false

export default function AddressAutocomplete({ value, onChange, onLocationSelect, placeholder = "Saisir une adresse..." }) {
  const inputRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isConfigured) {
      setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API, v: "weekly", language: "fr" })
      isConfigured = true
    }

    const init = async () => {
      const { Autocomplete } = await importLibrary('places')
      if (!inputRef.current) return

      const lyonBounds = {
        north: 45.92,
        south: 45.55,
        east: 5.05,
        west: 4.65
      }

      const autocomplete = new Autocomplete(inputRef.current, {
        bounds: lyonBounds,
        strictBounds: true,
        componentRestrictions: { country: "fr" },
        fields: ["formatted_address", "geometry"],
        types: ["address"],
      })

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()
        if (place.geometry) {
          const addr = place.formatted_address
          onChange(addr)
          onLocationSelect?.({ address: addr, lat: place.geometry.location.lat(), lng: place.geometry.location.lng() })
        }
      })
      setLoaded(true)
    }
    init()
  }, [])

  return (
    <div className="relative w-full">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        autoComplete="off"
      />
      {!loaded && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
    </div>
  )
}
