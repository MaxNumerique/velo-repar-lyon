'use client';
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Trash2, Save, Map as MapIcon, Loader2, Users, Plus, Check, AlertTriangle, Layers, Palette } from 'lucide-react';
import { showToast } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { getTechnicians } from '@/features/users/services/userService';
import { getSectors, saveSector, deleteSector } from '@/features/sectors/services/sectorService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRESET_COLORS = [
  "#3bb2d0",
  "#fbb03b",
  "#22c55e",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export default function SectorMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  
  const [sectors, setSectors] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sectorName, setSectorName] = useState('');
  const [sectorColor, setSectorColor] = useState('#3bb2d0');
  const [assignedTechId, setAssignedTechId] = useState('none');
  
  const [isSaving, setIsSaving] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mapStyle, setMapStyle] = useState('streets-v2');

  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const LYON_BOUNDS = [[4.70, 45.65], [4.95, 45.85]];

  useEffect(() => {
    fetchTechnicians();
  }, []);

  useEffect(() => {
    if (map.current && maptilerKey) {
        map.current.setStyle(`https://api.maptiler.com/maps/${mapStyle}/style.json?key=${maptilerKey}`);
    }
  }, [mapStyle, maptilerKey]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialStyle = maptilerKey 
      ? `https://api.maptiler.com/maps/${mapStyle}/style.json?key=${maptilerKey}`
      : 'https://demotiles.maplibre.org/style.json';

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle,
      center: [4.8357, 45.7640],
      zoom: 12,
      maxBounds: LYON_BOUNDS,
      trackResize: true
    });

    const safeStyles = [
      {
        'id': 'gl-draw-polygon-fill-inactive',
        'type': 'fill',
        'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
        'paint': {
          'fill-color': ['coalesce', ['get', 'user_color'], '#3bb2d0'],
          'fill-opacity': 0.2
        }
      },
      {
        'id': 'gl-draw-polygon-fill-active',
        'type': 'fill',
        'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
        'paint': {
          'fill-color': ['coalesce', ['get', 'user_color'], '#3bb2d0'],
          'fill-opacity': 0.5
        }
      },
      {
        'id': 'gl-draw-polygon-stroke-inactive',
        'type': 'line',
        'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
        'paint': {
          'line-color': ['coalesce', ['get', 'user_color'], '#3bb2d0'],
          'line-width': 2
        }
      },
      {
        'id': 'gl-draw-polygon-stroke-active',
        'type': 'line',
        'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
        'paint': {
          'line-color': '#ffffff',
          'line-width': 2.5
        }
      },
      {
        'id': 'gl-draw-point-inactive',
        'type': 'circle',
        'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Point']],
        'paint': {
          'circle-radius': 3,
          'circle-color': ['coalesce', ['get', 'color'], '#3bb2d0']
        }
      },
      {
        'id': 'gl-draw-point-active',
        'type': 'circle',
        'filter': ['all', 
          ['==', '$type', 'Point'], 
          ['==', 'active', 'true'], 
          ['!=', 'meta', 'midpoint']
        ],
        'paint': {
          'circle-radius': 7,
          'circle-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#3bb2d0'
        }
      },
      {
        'id': 'gl-draw-point-midpoint',
        'type': 'circle',
        'filter': ['all', 
          ['==', '$type', 'Point'], 
          ['==', 'meta', 'midpoint']
        ],
        'paint': {
          'circle-radius': 4,
          'circle-color': '#ffffff',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#3bb2d0',
          'circle-opacity': 0.7
        }
      }
    ];

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: 'simple_select',
      styles: safeStyles,
      userProperties: true
    });

    map.current.addControl(draw.current);
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.on('load', () => {
      setMapLoaded(true);
      fetchSectors();
    });

    map.current.on('draw.modechange', (e) => setIsDrawing(e.mode === 'draw_polygon'));
    
    map.current.on('draw.selectionchange', (e) => {
      setSelectedId(e.features.length > 0 ? e.features[0].id : null);
    });

    map.current.on('draw.create', (e) => {
        if (e.features.length > 0) {
            setSelectedId(e.features[0].id);
        }
    });

    return () => {
      map.current?.remove();
      map.current = null;
      draw.current = null;
    };
  }, []);

  useEffect(() => {
    if (selectedId) {
      const sec = sectors.find(s => s.id === selectedId);
      setSectorName(sec ? sec.name : 'Nouveau Secteur');
      const color = sec ? (sec.color || '#3bb2d0') : '#3bb2d0';
      setSectorColor(color);
      
      const techId = sec?.technicians?.[0]?.id || 'none';
      setAssignedTechId(techId);
      
      if (draw.current) {
          draw.current.setFeatureProperty(selectedId, 'color', color);
      }
    } else {
      setSectorName('');
      setSectorColor('#3bb2d0');
      setAssignedTechId('none');
    }
  }, [selectedId, sectors]);

  const fetchTechnicians = async () => {
    try {
      const data = await getTechnicians();
      setTechnicians(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Fetch techs error:', err); }
  };

  const fetchSectors = async () => {
    try {
      const data = await getSectors();
      setSectors(data);
      
      if (draw.current) {
        const existingIds = draw.current.getAll().features.map(f => f.id);
        data.forEach(sector => {
          if (!existingIds.includes(sector.id)) {
            draw.current.add({
              id: sector.id,
              type: 'Feature',
              properties: { 
                  name: sector.name,
                  color: sector.color || '#3bb2d0'
              },
              geometry: sector.boundary
            });
          } else {
              draw.current.setFeatureProperty(sector.id, 'color', sector.color || '#3bb2d0');
          }
        });
      }
    } catch (err) { console.error('Fetch sectors error:', err); }
  };

  const handleSaveSector = async () => {
    if (!selectedId) return;
    setIsSaving(true);
    const feature = draw.current.get(selectedId);
    
    try {
      const isExisting = sectors.some(s => s.id === selectedId);
      await saveSector({
        id: isExisting ? selectedId : null,
        name: sectorName || 'Nouveau Secteur',
        color: sectorColor,
        geojson: feature.geometry,
        technicianIds: assignedTechId === 'none' ? [] : [assignedTechId]
      });

      await fetchSectors();
      showToast.sector.saved();
    } catch (err) { showToast.sector.error(); } 
    finally { setIsSaving(false); }
  };

  const handleDeleteSector = async () => {
    if (!selectedId) return;
    setIsDeleteDialogOpen(false);

    try {
      await deleteSector(selectedId);
      draw.current.delete(selectedId);
      setSelectedId(null);
      await fetchSectors();
      showToast.sector.deleted();
    } catch (err) { showToast.sector.error(); }
  };

  const updateColor = (color) => {
      setSectorColor(color);
      if (selectedId && draw.current) {
          draw.current.setFeatureProperty(selectedId, 'color', color);
          const feature = draw.current.get(selectedId);
          if (feature) {
            draw.current.add(feature);
          }
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
      <style>{`
        .drawing-active canvas.maplibregl-canvas {
          cursor: crosshair !important;
        }
        /* Prevents dragging of existing sectors by styling handles if needed, 
           but easiest is to educate user or intercept draw.update. 
           MapboxDraw simple_select doesn't have a built-in "locked" prop per feature easily. */
      `}</style>

      <div className="lg:col-span-3">
        <div 
          className={cn(
            "relative w-full h-[350px] md:h-[600px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm transition-all",
            isDrawing && "ring-2 ring-primary/30 drawing-active"
          )}
        >
          {!mapLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-10 transition-opacity">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-xs text-slate-400">Chargement de la carte...</p>
            </div>
          )}
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
          
          <div className="absolute bottom-3 right-3 md:top-4 md:right-14 md:bottom-auto z-20 flex bg-white/90 backdrop-blur rounded-lg border border-slate-200 shadow-lg p-0.5 md:p-1">
             <Button 
                onClick={() => setMapStyle('streets-v2')} 
                variant={mapStyle === 'streets-v2' ? 'default' : 'ghost'}
                size="sm" 
                className="h-7 md:h-8 text-[10px] md:text-[11px] font-bold px-2 md:px-3"
             >
                PLAN
             </Button>
             <Button 
                onClick={() => setMapStyle('hybrid')} 
                variant={mapStyle === 'hybrid' ? 'default' : 'ghost'}
                size="sm" 
                className="h-7 md:h-8 text-[10px] md:text-[11px] font-bold px-2 md:px-3"
             >
                SAT
             </Button>
          </div>

          <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20 flex gap-2">
            {!isDrawing ? (
              <Button 
                onClick={() => { setSelectedId(null); draw.current.changeMode('draw_polygon'); setIsDrawing(true); }} 
                size="sm" 
                className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 shadow-xl font-bold gap-1.5 md:gap-2 ring-1 ring-slate-200 animate-in fade-in zoom-in duration-300 text-xs md:text-sm"
              >
                <Plus className="w-4 h-4 text-primary" /> <span className="hidden sm:inline">Nouveau</span> Secteur
              </Button>
            ) : (
              <Button 
                onClick={() => { draw.current.changeMode('simple_select'); setIsDrawing(false); }} 
                size="sm" 
                className="bg-primary hover:bg-primary/90 text-white shadow-xl font-bold gap-2 animate-in slide-in-from-left-4 duration-300"
              >
                <Check className="w-4 h-4" /> Terminer le tracé
              </Button>
            )}
          </div>
          
          {isDrawing && (
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                <p className="text-white text-[11px] font-medium flex items-center gap-2">
                   <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                   Cliquez pour ajouter des points, double-cliquez pour finir.
                </p>
             </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <Card className="shadow-none border-slate-200 dark:border-slate-800">
          <CardHeader className="py-4 border-b border-slate-50 dark:border-slate-800/50">
            <CardTitle className="text-base flex items-center gap-2 font-bold uppercase tracking-tight">
              <MapIcon className="w-4 h-4 text-primary" /> Édition
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm">
            {selectedId ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="sector-name" className="text-[10px] uppercase font-bold text-slate-400">Nom du secteur</Label>
                  <Input id="sector-name" value={sectorName} onChange={(e) => setSectorName(e.target.value)} className="h-9 font-medium" />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                       <Palette className="w-3.5 h-3.5" /> Couleur du secteur
                    </Label>
                    <div className="flex gap-2 flex-wrap pb-1">
                        {PRESET_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => updateColor(color)}
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-all",
                                    sectorColor === color ? "border-slate-900 scale-110 shadow-md" : "border-transparent hover:scale-105"
                                )}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Technicien assigné
                  </Label>
                  <Select value={assignedTechId} onValueChange={setAssignedTechId}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Choisir un technicien" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun technicien</SelectItem>
                      {technicians.map(tech => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.firstName} {tech.lastName || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveSector} className="flex-1 h-9 font-bold shadow-lg" disabled={isSaving} title="Sauvegarder">
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />} Sauver
                  </Button>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(true)} className="w-9 h-9 p-0 border-red-100 text-red-500 hover:bg-red-50" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-10 text-center px-4 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/20">
                <p className="text-xs text-slate-400 font-medium italic">Sélectionnez une zone pour l'éditer.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none border-slate-200 dark:border-slate-800 flex flex-col flex-1 overflow-hidden">
          <CardHeader className="py-2.5 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Liste des secteurs</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[220px]">
            {sectors.length === 0 ? <p className="p-10 text-[11px] text-slate-400 text-center italic">Vide</p> : (
              <div className="divide-y divide-slate-100">
                {sectors.map(sector => (
                  <button key={sector.id} onClick={() => {
                        if (draw.current) {
                          draw.current.changeMode('simple_select', { featureIds: [sector.id] });
                          setSelectedId(sector.id);
                          if (sector.boundary?.coordinates?.[0]?.[0]) {
                             map.current.flyTo({ center: sector.boundary.coordinates[0][0], zoom: 13, padding: { right: 100 } });
                          }
                        }
                    }}
                    className={cn(
                      "w-full text-left p-3.5 text-[13px] hover:bg-slate-50 transition-all border-l-4",
                      selectedId === sector.id ? "bg-primary/5 text-primary font-bold" : "border-transparent"
                    )}
                    style={{ borderLeftColor: sector.color || '#3bb2d0' }}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="truncate pr-2 font-medium">{sector.name}</span>
                      <MapIcon className={cn("w-3 h-3 transition-opacity", selectedId === sector.id ? "opacity-100" : "opacity-0")} />
                    </div>
                    {sector.technicians?.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium whitespace-nowrap overflow-hidden">
                        <Users className="w-3 h-3 text-slate-300" /> {sector.technicians[0].firstName} {sector.technicians[0].lastName}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
               <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl">Supprimer ce secteur ?</DialogTitle>
            <DialogDescription className="text-center pt-2 text-slate-500">
              Cette action est irréversible. Toutes les données liées à ce périmètre seront définitivement effacées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="px-6 h-10 font-bold border-slate-200">
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteSector} className="px-6 h-10 font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200">
              Oui, supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
