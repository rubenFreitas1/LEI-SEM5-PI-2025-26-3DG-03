# Vessel Operational Status Visualization

This implementation provides real-time visual representation of vessel operational statuses in the 3D port environment.

## Features Implemented

### 1. **Extended Backend Status Enum**
- **File**: `OEM/src/domain/VesselVisitExecutionStatus.ts`
- **Status Types**:
  - `Waiting` - Vessel awaiting dock assignment (Yellow)
  - `Loading` - Vessel loading cargo (Green)
  - `Unloading` - Vessel unloading cargo (Orange)
  - `InProgress` - Operations in progress (Blue)
  - `Completed` - Operations completed (Gray)

### 2. **Backend API Integration**
- **Service**: `UI/src/app/services/vesselStatus.service.ts`
- **Features**:
  - Fetches vessel status from OEM API (`/vessel-visit-executions`)
  - Filters active vessels (non-completed)
  - Provides fallback mock data for development
  - Type-safe status information interface

### 3. **Enhanced 3D Vessel Rendering**
- **File**: `UI/src/app/threejs/vessel.ts`
- **Visual Indicators**:
  - **Color Coding**: Emissive material colors based on status
  - **Status Light**: Point light above vessel with status color
  - **Dynamic Updates**: `updateVesselStatus()` function for real-time changes
- **Configuration**: Supports multiple vessels with individual IMO and status

### 4. **Real-time Status Updates**
- **Component**: `UI/src/app/components/visualization/visualization.ts`
- **Features**:
  - Automatic polling every 10 seconds
  - Fetches up to 3 active vessels from API
  - Dynamically updates vessel colors when status changes
  - Graceful handling of API failures with demo vessels

### 5. **Interactive Tooltips**
- **Service**: `UI/src/app/services/element-info.service.ts`
- **Component**: `UI/src/app/components/element-info-overlay/element-info-overlay.component.ts`
- **Features**:
  - Click on any vessel to see detailed information
  - Displays IMO number, vessel name, and current status
  - Status badge with color-coded background
  - Status description explaining the meaning
  - Integration with existing element info overlay

### 6. **Status Legend**
- **Component**: `UI/src/app/components/vessel-status-legend/vessel-status-legend.component.ts`
- **Features**:
  - Persistent legend in bottom-right corner
  - Collapsible for minimal screen space
  - Shows all status types with colors and descriptions
  - Indicates automatic refresh interval

## Visual Status Indicators

| Status | Color | Visual Effect | Description |
|--------|-------|---------------|-------------|
| Waiting | Yellow (#FFFF00) | Yellow emissive glow + point light | Vessel awaiting dock assignment |
| Loading | Green (#00FF00) | Green emissive glow + point light | Currently loading cargo |
| Unloading | Orange (#FF6600) | Orange emissive glow + point light | Currently unloading cargo |
| InProgress | Blue (#0099FF) | Blue emissive glow + point light | Operations in progress |
| Completed | Gray (#808080) | Gray emissive glow + point light | Operations completed |

## Architecture

### Data Flow
```
OEM API (/vessel-visit-executions)
    ↓
VesselStatusService (polling every 10s)
    ↓
PortVisualizationComponent
    ↓
3D Scene (vessel objects with status colors)
    ↓
ElementInfoOverlay (tooltips on click)
```

### Component Hierarchy
```
PortVisualizationComponent
├── 3D Scene (Three.js)
│   └── Vessel Objects (with status visualization)
├── ElementInfoOverlayComponent (tooltips)
└── VesselStatusLegendComponent (legend)
```

## Configuration

### Environment Variables
```typescript
// UI/src/environments/environment.ts
export const environment = {
  oemApiUrl: 'http://localhost:3001/api'  // OEM backend URL
};
```

### Refresh Interval
```typescript
// UI/src/app/components/visualization/visualization.ts
private readonly REFRESH_INTERVAL_MS = 10000; // 10 seconds
```

## API Endpoints Used

### Get Vessel Visit Executions
```
GET http://localhost:3001/api/vessel-visit-executions
```

**Response Example**:
```json
[
  {
    "id": "1",
    "code": "2025-PA-000001",
    "vesselIMO": "9074729",
    "status": "Loading",
    "arrivalDate": "2025-01-03T08:00:00Z",
    "DockAssigned": "Dock A"
  }
]
```

## User Interactions

### Viewing Status
1. **Visual Indicators**: Vessels display color-coded lights automatically
2. **Tooltip**: Click any vessel to see detailed status information
3. **Legend**: Bottom-right legend explains all status colors

### Status Updates
- Automatic refresh every 10 seconds
- Visual transition when status changes
- No user action required

## Acceptance Criteria Fulfillment

✅ **Status changes reflected visually**
- Color coding via emissive materials
- Point lights above vessels
- Real-time updates via polling

✅ **Tooltips clarify visual indicators**
- Click vessels to see element info overlay
- Status badge with color and description
- Permanent status legend in UI

✅ **Periodic data refresh from backend**
- REST call every 10 seconds
- Automatic status synchronization
- Graceful error handling with fallback

## Testing

### Manual Testing Steps
1. Start OEM backend: `cd OEM && npm start`
2. Start UI: `cd UI && npm start`
3. Navigate to port visualization
4. Observe multiple vessels with different colored lights
5. Click vessels to see status tooltips
6. Check legend in bottom-right corner
7. Wait 10 seconds and observe automatic refresh

### Mock Data
If OEM backend is unavailable, the system displays 3 demo vessels:
- Vessel 1 (IMO 9074729): Loading (Green)
- Vessel 2 (IMO 9074730): Waiting (Yellow)
- Vessel 3 (IMO 9074731): Unloading (Orange)

## Files Modified/Created

### Backend (OEM)
- `OEM/src/domain/VesselVisitExecutionStatus.ts` - Extended enum

### Frontend (UI)
- `UI/src/app/services/vesselStatus.service.ts` - New service
- `UI/src/app/threejs/vessel.ts` - Enhanced vessel rendering
- `UI/src/app/components/visualization/visualization.ts` - Status integration
- `UI/src/app/components/visualization/visualization.html` - Legend added
- `UI/src/app/components/vessel-status-legend/vessel-status-legend.component.ts` - New component
- `UI/src/app/services/element-info.service.ts` - Status tooltip support
- `UI/src/app/components/element-info-overlay/element-info-overlay.component.ts` - Status display

## Future Enhancements

1. **WebSocket Support**: Replace polling with WebSocket for instant updates
2. **Animation**: Smooth color transitions when status changes
3. **Sound Effects**: Optional audio alerts for status changes
4. **Historical Data**: Track and display status change history
5. **Custom Colors**: Allow users to customize status colors
6. **Performance**: Optimize rendering for many vessels (>10)

## Troubleshooting

### Issue: No vessels visible
**Solution**: Check if OEM backend is running and accessible

### Issue: Status not updating
**Solution**: 
- Check browser console for API errors
- Verify CORS settings on OEM backend
- Check network tab for failed requests

### Issue: Wrong colors displayed
**Solution**: Clear browser cache and refresh

## Related Documentation
- [Three.js Materials Documentation](https://threejs.org/docs/#api/en/materials/Material)
- [Angular HttpClient Guide](https://angular.io/guide/http)
- [RxJS Interval Documentation](https://rxjs.dev/api/index/function/interval)
