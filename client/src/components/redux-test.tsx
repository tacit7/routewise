import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { addToast, setTheme, selectUI, selectToasts } from '@/store/slices/uiSlice'
import { startNewWizard, selectWizard } from '@/store/slices/wizardSlice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReduxTest() {
  const dispatch = useAppDispatch()
  const ui = useAppSelector(selectUI)
  const wizard = useAppSelector(selectWizard)
  const toasts = useAppSelector(selectToasts)

  const handleAddToast = () => {
    dispatch(addToast({
      title: 'Redux Test',
      description: 'Redux is working! 🎉',
      variant: 'success',
      duration: 3000,
    }))
  }

  const handleToggleTheme = () => {
    const newTheme = ui.theme === 'light' ? 'dark' : 'light'
    dispatch(setTheme(newTheme))
  }

  const handleStartWizard = () => {
    dispatch(startNewWizard({
      tripType: 'road-trip',
      flexibleLocations: true,
    }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto m-4">
      <CardHeader>
        <CardTitle>Redux Integration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* UI State Test */}
        <div className="space-y-2">
          <h3 className="font-semibold">UI State</h3>
          <p>Current Theme: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{ui.theme}</span></p>
          <p>Active Toasts: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{toasts.length}</span></p>
          <div className="flex gap-2">
            <Button onClick={handleToggleTheme} variant="outline">
              Toggle Theme
            </Button>
            <Button onClick={handleAddToast} variant="outline">
              Add Toast
            </Button>
          </div>
        </div>

        {/* Wizard State Test */}
        <div className="space-y-2">
          <h3 className="font-semibold">Wizard State</h3>
          <p>Current Draft: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
            {wizard.currentDraft ? 'Active' : 'None'}
          </span></p>
          <p>Current Step: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
            {wizard.currentStep}
          </span></p>
          <Button onClick={handleStartWizard} variant="outline">
            Start New Wizard
          </Button>
        </div>

        {/* Redux DevTools Info */}
        <div className="space-y-2">
          <h3 className="font-semibold">Redux DevTools</h3>
          <p className="text-sm text-gray-600">
            Open browser DevTools and look for the Redux tab to inspect state changes.
            If you don't see it, install the Redux DevTools extension.
          </p>
        </div>

        {/* Persistence Test */}
        <div className="space-y-2">
          <h3 className="font-semibold">Persistence Test</h3>
          <p className="text-sm text-gray-600">
            Start a wizard or change the theme, then refresh the page. 
            The state should be restored from localStorage.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}