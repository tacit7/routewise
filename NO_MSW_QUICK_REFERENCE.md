# No-MSW Development Mode - Quick Reference

## 🚀 **Commands**

### MSW Enabled (Mocked APIs)
```bash
npm run dev
```
✅ Service worker intercepts all API calls  
✅ Consistent mock data  
✅ Offline development  

### MSW Disabled (Real APIs + Caching) 
```bash
npm run dev:no-msw
```
✅ Real backend API calls  
✅ Intelligent response caching  
✅ Production-like testing  

## 📊 **Console Indicators**

**MSW Mode:**
```
🚀 MSW: Mock Service Worker started successfully
📡 MSW: Intercepting API requests for development
💡 MSW: Use "npm run dev:no-msw" to disable mocking
```

**No-MSW Mode:**
```
🚫 MSW: Mock Service Worker disabled via MSW_DISABLED flag
🌐 MSW: Using real backend APIs with caching enabled  
💡 MSW: Use "npm run dev" to enable mocking
[cache] 🔍 MISS /api/health
[cache] 💾 SET /api/health
[cache] 🎯 HIT /api/health
```

## 🎯 **Cache Durations**

| Endpoint | Duration | Icon |
|----------|----------|------|
| `/api/health` | 30s | 🔍 |
| `/api/maps-key` | 10min | 💾 |
| `/api/places/autocomplete` | 5min | 🎯 |
| `/api/pois` | 2min | 🔍 |

## 🛠️ **Debug Tools**

- **Test Panel**: Bottom-right corner shows current mode
- **Cache Stats**: `/api/cache-stats` endpoint (no-MSW mode only)
- **Console Logs**: Real-time cache hit/miss indicators

## 🔄 **Mode Switching**

1. Stop server (`Ctrl+C`)
2. Run other command
3. Refresh browser

**You now have both mocked development AND real API testing with intelligent caching!** 🎉
