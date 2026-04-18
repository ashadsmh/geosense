'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const libraries: ("places" | "geometry")[] = ['places', 'geometry'];

export default function AddressInput({ 
  defaultAddress = '',
  defaultHomeSizeSqft = 20000,
  defaultHeatingFuel = 'gas',
  defaultEnergyCost = 18000,
  defaultLotSize = 50000,
  disableTypewriter = false
}: { 
  defaultAddress?: string;
  defaultHomeSizeSqft?: string | number;
  defaultHeatingFuel?: string;
  defaultEnergyCost?: string | number;
  defaultLotSize?: string | number;
  disableTypewriter?: boolean;
}) {
  const router = useRouter();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [address, setAddress] = useState(defaultAddress);
  const [placeholderText, setPlaceholderText] = useState("Enter property address...");
  const [lat, setLat] = useState<number | null>(40.34335913656855);
  const [lng, setLng] = useState<number | null>(-74.65503353339038);
  const [zipCode, setZipCode] = useState('08540');
  const [stateCode, setStateCode] = useState('NJ');
  const [lotSize, setLotSize] = useState(Number(defaultLotSize));
  const [viewportBounds, setViewportBounds] = useState<{north: number, south: number, east: number, west: number} | null>(null);

  const [homeSizeSqft, setHomeSizeSqft] = useState(Number(defaultHomeSizeSqft));
  const [heatingFuel, setHeatingFuel] = useState(defaultHeatingFuel);
  const [annualEnergyCost, setAnnualEnergyCost] = useState(Number(defaultEnergyCost));

  const [isFocused, setIsFocused] = useState(false);
  const typewriterHasRun = useRef(false);
  const typewriterTimeouts = useRef<NodeJS.Timeout[]>([]);
  const userHasTyped = useRef(false);

  useEffect(() => {
    if (disableTypewriter) {
      if (defaultAddress) setAddress(defaultAddress);
      return;
    }
    typewriterHasRun.current = true;
    
    setAddress('');

    const targetAddress = defaultAddress || "Poe Field, Princeton University, Princeton, NJ 08544";
    
    const initialDelay = setTimeout(() => {
      targetAddress.split('').forEach((char, index) => {
        const t = setTimeout(() => {
          if (!userHasTyped.current) {
            setAddress(prev => prev + char);
          }
        }, index * 55);
        typewriterTimeouts.current.push(t);
      });

      const lockInDelay = setTimeout(() => {
        if (!userHasTyped.current) {
          setAddress(targetAddress);
          setLat(40.34335913656855);
          setLng(-74.65503353339038);
          setZipCode("08540");
          setStateCode("NJ");
          setLotSize(Number(defaultLotSize));
        }
      }, targetAddress.length * 55 + 500);
      typewriterTimeouts.current.push(lockInDelay);
    }, 1000);
    
    typewriterTimeouts.current.push(initialDelay);

    return () => {
      typewriterTimeouts.current.forEach(clearTimeout);
    };
  }, [defaultAddress, disableTypewriter, defaultLotSize]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    userHasTyped.current = true;
    typewriterTimeouts.current.forEach(clearTimeout);
    setAddress(e.target.value);
  };

  const handleFocus = () => {
    userHasTyped.current = true;
    typewriterTimeouts.current.forEach(clearTimeout);
    setIsFocused(true);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading) {
      setShowSlowWarning(false);
      return;
    }
    const timeout = setTimeout(() => {
      setShowSlowWarning(true);
    }, 8000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) setAddress(place.formatted_address);
      if (place.geometry?.location) {
        setLat(place.geometry.location.lat());
        setLng(place.geometry.location.lng());
      }
      
      let zip = '';
      let state = '';
      place.address_components?.forEach(comp => {
        if (comp.types.includes('postal_code')) zip = comp.long_name;
        if (comp.types.includes('administrative_area_level_1')) state = comp.short_name;
      });
      if (zip) setZipCode(zip);
      if (state) setStateCode(state);

      const isPrincetonSelection = (
        place.geometry?.location &&
        Math.abs(place.geometry.location.lat() - 40.3431) < 0.01 &&
        Math.abs(place.geometry.location.lng() - (-74.6551)) < 0.01
      ) || zip === '08544' || zip === '08540';

      if (isPrincetonSelection) {
        setLotSize(50000);
      } else if (place.geometry?.viewport && window.google) {
        const ne = place.geometry.viewport.getNorthEast();
        const sw = place.geometry.viewport.getSouthWest();
        const width = google.maps.geometry.spherical.computeDistanceBetween(ne, new google.maps.LatLng(ne.lat(), sw.lng()));
        const height = google.maps.geometry.spherical.computeDistanceBetween(ne, new google.maps.LatLng(sw.lat(), ne.lng()));
        const areaSqFt = (width * height) * 10.764;
        setLotSize(Math.max(2000, Math.min(100000, Math.round(areaSqFt))));
        setViewportBounds({
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng()
        });
      } else {
        setLotSize(7500);
        setViewportBounds(null);
      }
    }
  };

  const prefetchGeoData = async (
    zipCode: string
  ): Promise<void> => {
    try {
      const response = await fetch(
        `/api/geodata?zip=${zipCode}`
      )
      if (!response.ok) return
      const data = await response.json()
      
      localStorage.setItem(
        'geosense_geo_data',
        JSON.stringify({
          zip_code: zipCode,
          address: address,
          lat: lat,
          lng: lng,
          soil: data.soil,
          climate: data.climate,
          timestamp: Date.now()
        })
      )
    } catch (e) {
      console.log('prefetch failed silently', e)
    }
  }

  const getErrorMessage = (errorMsg: string) => {
    const lowerError = errorMsg.toLowerCase();
    if (lowerError.includes('quota') || lowerError.includes('429')) {
      return 'AI service is busy — please wait 30 seconds and try again.';
    }
    if (lowerError.includes('zip') || lowerError.includes('soil')) {
      return 'Address not found in our database. Try a nearby address or major city.';
    }
    if (lowerError.includes('network') || lowerError.includes('fetch')) {
      return 'Network error — please check your connection and try again.';
    }
    return 'Analysis failed — please try again.';
  };

  const handleAnalyze = async () => {
    setError('');
    if (!address || !homeSizeSqft || !heatingFuel || !annualEnergyCost) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const [_, res] = await Promise.all([
        prefetchGeoData(zipCode),
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            lat,
            lng,
            zip_code: zipCode,
            lot_size_sqft: lotSize,
            home_size_sqft: homeSizeSqft,
            current_heating_fuel: heatingFuel,
            annual_energy_cost_usd: annualEnergyCost,
            viewportBounds
          })
        })
      ]);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze');

      try {
        localStorage.setItem('geosense_last_report_id', data.report_id);
        localStorage.setItem('geosense_last_address', address);
        localStorage.setItem('geosense_has_session', 'true');
      } catch (e) {}

      router.push(`/analyze?id=${data.report_id}`);
    } catch (err: any) {
      setError(getErrorMessage(err.message || String(err)));
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setError('');
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="relative mb-2">
        {isLoaded ? (
          <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
            <input 
              type="text" 
              value={address}
              onChange={handleAddressChange}
              onFocus={handleFocus}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholderText}
              disabled={isLoading}
              className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-lg text-slate-900 disabled:opacity-50 disabled:bg-slate-50"
            />
          </Autocomplete>
        ) : (
          <input 
            type="text" 
            value={address}
            onChange={handleAddressChange}
            placeholder="Loading map..." 
            className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-300 outline-none text-lg bg-slate-50 text-slate-900"
            disabled
          />
        )}
        <div className="absolute left-4 top-4 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      </div>
      
      {address && (
        <div className="text-xs text-slate-500 mb-6 pl-2">
          Estimated lot: ~{lotSize.toLocaleString()} sq ft · {address.split(',').slice(-2).join(',').trim()}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Home size (sq ft)</label>
          <input 
            type="number" 
            value={homeSizeSqft}
            onChange={(e) => setHomeSizeSqft(Number(e.target.value))}
            placeholder="e.g. 2,000" 
            disabled={isLoading}
            className="w-full h-12 px-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-slate-900 disabled:opacity-50 disabled:bg-slate-50"
          />
        </div>
        <div className="w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Current heating fuel</label>
          <select 
            value={heatingFuel}
            onChange={(e) => setHeatingFuel(e.target.value)}
            disabled={isLoading}
            className="w-full h-12 px-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-slate-900 disabled:opacity-50 disabled:bg-slate-50"
          >
            <option value="gas">Natural Gas</option>
            <option value="oil">Heating Oil</option>
            <option value="electric">Electric Baseboard</option>
            <option value="propane">Propane</option>
          </select>
        </div>
        <div className="w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Energy Bill ($/yr)</label>
          <input 
            type="number" 
            value={annualEnergyCost}
            onChange={(e) => setAnnualEnergyCost(Number(e.target.value))}
            placeholder="e.g. 3,200" 
            disabled={isLoading}
            className="w-full h-12 px-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-slate-900 disabled:opacity-50 disabled:bg-slate-50"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 mb-4">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-red-700">Analysis failed</p>
            <p className="text-xs text-red-500 mt-0.5">
              {error}
            </p>
          </div>
        </div>
      )}

      <button 
        onClick={handleAnalyze}
        disabled={isLoading}
        className="w-full bg-gray-900 hover:bg-gray-700 text-white font-medium py-4 rounded-xl transition-colors text-lg flex items-center justify-center disabled:opacity-70 relative overflow-hidden"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
            <div 
              className="absolute bottom-0 left-0 h-1 bg-green-400 rounded-b-lg"
              style={{ animation: 'buttonProgress 10s linear forwards' }}
            />
          </>
        ) : (
          'Analyze →'
        )}
      </button>

      {showSlowWarning && !error && (
        <p className="text-sm text-gray-400 animate-pulse text-center mt-3">
          Groq AI is modeling your subsurface — almost there...
        </p>
      )}
    </div>
  );
}
